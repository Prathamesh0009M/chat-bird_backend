import User from "../module/user.js"
import Conversation from "../module/conversation.js";
import { decrypt } from "../utils/encryption.js";

export const startConversation = async (req, res) => {
    try {
        const { userAId, userBId } = req.body;
        if (!userAId || !userBId) {
            return res.status(400).json({
                success: false,
                message: "Both userAId and userBId are required"
            });
        }
        const userA = await User.findById(userAId);
        const userB = await User.findById(userBId);
        console.log("Starting conversation between:", userAId, "and", userBId);

        if (!userA || !userB) {
            return res.status(404).json({
                success: false,
                message: "One or both users not found"
            });
        }
        // Here you would typically create a conversation in the database
        await Conversation.create({
            participants: [userAId, userBId],
        });


        res.status(201).json({
            success: true,
            message: "Conversation started successfully",
            conversation: {
                id: "newlyCreatedConversationId",
                participants: [userAId, userBId]
            }
        });
    } catch (error) {
        console.error("❌ Error starting conversation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to start conversation"
        });
    }
};        // Here you would typically create a conversation in the database

export const getconnectedUsers = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        }).populate('participants', '-password');

        // Build the response with conversationId + participant
        const connectedUsers = conversations.flatMap(convo =>
            convo.participants
                .filter(p => p._id.toString() !== userId)
                .map(p => {
                    // Safely decrypt lastMessage
                    let decryptedMessage = null;
                    if (convo.lastMessage) {
                        try {
                            decryptedMessage = decrypt(convo.lastMessage);
                        } catch (err) {
                            console.error('Failed to decrypt message for conversation:', convo._id, err.message);
                            decryptedMessage = null; // or "Message unavailable"
                        }
                    }

                    return {
                        conversationId: convo._id,
                        user: p,
                        lastMessage: decryptedMessage,
                        lastMessageTime: convo.updatedAt || convo.createdAt
                    };
                })
        );

        return res.status(200).json({
            success: true,
            connectedUsers
        });

    } catch (error) {
        console.error("❌ Error fetching connected users:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching connected users"
        });
    }
};