import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }], // [UserA, UserB]
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Conversation", conversationSchema);
