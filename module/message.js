import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        default: null  // Changed: Can be null for media-only messages
    },
    language: {
        type: String,
        default: "en"
    },
    
    // NEW: Add these fields
    messageType: {
        type: String,
        enum: ["text", "image", "video"],
        default: "text"
    },
    media: {
        url: String,
        publicId: String,
        size: Number
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Message", messageSchema);