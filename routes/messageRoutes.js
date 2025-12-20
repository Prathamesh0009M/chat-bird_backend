import express from "express";
import { getAllUsers, updateUserLanguage } from "../controllers/user.js";
import { getMessages } from "../controllers/messageController.js";
import { startConversation, getconnectedUsers } from "../controllers/startConv.js";
import { auth } from "../middleware/auth.js";
import Conversation from "../module/conversation.js";

const router = express.Router();

// router.get("/:conversationId", getMessages);
router.post("/startConvo", startConversation);
router.post("/getConnectedUser", auth, getconnectedUsers);
// router.get("/connectedUsers", getconnectedUsers);
router.get("/getAllUser", auth, getAllUsers);
router.get("/:conversationId/messages", getMessages);
router.patch("/update-lang", auth, updateUserLanguage);

// Get conversation details with participants
router.get("/conversation/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'username email preferredLanguage');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        res.json({
            success: true,
            conversationId: conversation._id,
            participants: conversation.participants,
            createdAt: conversation.createdAt
        });

    } catch (error) {
        console.error("❌ Error fetching conversation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversation details"
        });
    }
});

export default router;
