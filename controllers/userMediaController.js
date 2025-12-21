// controllers/mediaController.js
import Message from "../module/message.js";
import User from "../module/user.js";
import Conversation from "../module/conversation.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { publishMessage, invalidateChatHistoryCache } from "../services/cacheService.js";
import fs from 'fs';

export const uploadMedia = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;
        const { conversationId, messageType = 'image', caption } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        // Check storage
        const user = await User.findById(userId);
        // Upload to Cloudinary
        const folder = messageType === 'video' ? 'chat-app/videos' : 'chat-app/images';
        const uploadResult = await uploadToCloudinary(file, folder);

        // Update storage
        // await user.save();
        console.log(`uploaded file to Cloudinary: ${uploadResult}`);

        // Delete temp file
        fs.unlinkSync(file.path);

        // ... previous code ...

        // Save message to database
        const newMessage = new Message({
            conversationId,
            sender: userId,
            text: caption || null,
            language: user.preferredLanguage,
            messageType: messageType,

            // 👇 THIS IS THE FIX
            media: {
                // Cloudinary returns 'secure_url', not 'url'
                url: uploadResult.secure_url || uploadResult.url,

                // Cloudinary returns 'public_id', not 'publicId'
                publicId: uploadResult.public_id,

                // Cloudinary returns 'bytes', not 'size'
                size: uploadResult.bytes
            }
        });

        // Debug log to confirm values exist BEFORE saving
        console.log("Saving Message Media:", newMessage);

        const data = await newMessage.save();
        console.log(`Saved message ${data} to database`);
        // ... rest of code ...

        // Get conversation participants
        const conversation = await Conversation.findById(conversationId);
        const allParticipantIds = conversation.participants.map(p => p.toString());

        // Invalidate cached chat history for all participants
        await invalidateChatHistoryCache(conversationId, allParticipantIds);

        // Broadcast media message to all participants via Socket.IO
        for (const participantId of allParticipantIds) {
            const isSender = participantId === userId.toString();

            // Prepare message data
            const messageData = {
                messageId: newMessage._id,
                conversationId,
                text: caption || null,
                sender: userId,
                senderName: user.username,
                messageType,
                media: {
                    url: uploadResult.url,
                    type: messageType,
                    size: uploadResult.size
                },
                createdAt: newMessage.createdAt,
                isMine: isSender
            };

            // Publish to Redis for real-time delivery
            await publishMessage("chat:messages", {
                recipientId: participantId,
                messageData
            });

            console.log(`📤 Published media message to user ${participantId}`);
        }

        res.json({
            success: true,
            message: "Media uploaded and shared successfully",
            data: {
                messageId: newMessage._id,
                url: uploadResult.url,
                type: messageType,
                conversationId
            }
        });

    } catch (error) {
        console.error("❌ Upload error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: "Failed to upload media"
        });
    }
};

export const getUserMedia = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const media = await Message.find({
            sender: userId,
            messageType: { $in: ['image', 'video'] }
        })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            media
        });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch media"
        });
    }
};

export const getConversationMedia = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { type, page = 1, limit = 20 } = req.query;

        const query = {
            conversationId,
            messageType: { $in: ['image', 'video'] },
            'media.url': { $ne: null }
        };

        if (type && ['image', 'video'].includes(type)) {
            query.messageType = type;
        }

        const skip = (page - 1) * limit;

        const mediaMessages = await Message.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('media messageType createdAt sender text')
            .populate('sender', 'username name avatar')
            .lean();

        const total = await Message.countDocuments(query);

        const media = mediaMessages.map(msg => ({
            id: msg._id,
            url: msg.media.url,
            type: msg.messageType,
            size: msg.media.size,
            caption: msg.text,
            uploadedAt: msg.createdAt,
            sender: {
                id: msg.sender._id,
                username: msg.sender.username,
                name: msg.sender.name,
                avatar: msg.sender.avatar
            }
        }));

        res.json({
            success: true,
            media,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error("❌ Get conversation media error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversation media",
            error: error.message
        });
    }
};

export const deleteMedia = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own media"
            });
        }

        // Delete from Cloudinary
        if (message.media.publicId) {
            const resourceType = message.messageType === 'video' ? 'video' : 'image';
            await deleteFromCloudinary(message.media.publicId, resourceType);
        }

        // Update user storage
        const user = await User.findById(userId);
        user.storageUsed -= message.media.size || 0;
        await user.save();

        // Get conversation for broadcasting deletion
        const conversation = await Conversation.findById(message.conversationId);
        const allParticipantIds = conversation.participants.map(p => p.toString());

        // Invalidate cache
        await invalidateChatHistoryCache(message.conversationId, allParticipantIds);

        // Mark message as deleted
        message.deleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Broadcast deletion to all participants
        for (const participantId of allParticipantIds) {
            await publishMessage("chat:messages", {
                recipientId: participantId,
                messageData: {
                    type: "messageDeleted",
                    messageId: message._id,
                    conversationId: message.conversationId
                }
            });
        }

        res.json({
            success: true,
            message: "Media deleted successfully",
            storageUsed: user.storageUsed,
            storagePercentage: user.storagePercentage
        });

    } catch (error) {
        console.error("❌ Delete media error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete media",
            error: error.message
        });
    }
};

