import User from "../module/user.js";
import Conversation from "../module/conversation.js";
import { invalidateChatHistoryCache } from "../services/cacheService.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("❌ Error fetching user profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user profile"
        });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, preferredLanguage, bio } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(
                req.file,
                "profilePicture"
            );
            user.profilePicture = cloudinaryResult.secure_url;
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (preferredLanguage) user.preferredLanguage = preferredLanguage;
        // if (profilePicture) user.profilePicture = profilePicture;
        if (bio) user.bio = bio;
        await user.save();
        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user
        });


    } catch (error) {
        console.error("❌ Error updating user profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating user profile"
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user =
            await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    }
    catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting user"
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user.id || req.user._id;
        if (!loggedInUserId) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }
        const users = await User.find({
            _id: { $ne: loggedInUserId }  // exclude logged-in user
        }).select("-password");

        return res.status(200).json({
            success: true,
            users,
        });

    } catch (error) {
        console.error("❌ Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching users",
        });
    }
};


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
        }).populate('participants').sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error("❌ Error fetching conversations:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversations"
        });
    }
};

export const updateUserLanguage = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { preferredLanguage, conversationId } = req.body;

        if (!preferredLanguage) {
            return res.status(400).json({
                success: false,
                message: "preferredLanguage is required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update user's preferred language
        user.preferredLanguage = preferredLanguage;
        await user.save();

        // 🔥 IMPORTANT: Invalidate the chat history cache for this user
        if (conversationId) {
            await invalidateChatHistoryCache(conversationId, [userId]);
            console.log(`🗑️ Invalidated cache for user ${userId} in conversation ${conversationId}`);
        }

        return res.status(200).json({
            success: true,
            message: "Preferred language updated successfully",
            preferredLanguage: user.preferredLanguage
        });
    } catch (error) {
        console.error("❌ Error updating preferred language:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating preferred language"
        });
    }
};







