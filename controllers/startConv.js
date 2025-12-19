import User from "../module/user.js"
import Conversation from "../module/conversation.js";

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
                .map(p => ({
                    conversationId: convo._id,
                    user: p
                }))
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

