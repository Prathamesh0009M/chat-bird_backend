import User from "../module/user.js";
import Conversation from "../module/conversation.js";


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
        const userId = req.params.id;
        const { name, email, preferredLanguage } = req.body;
        const user = await User.findById
            (userId);
        if (!user) {
            return res.status(404).json({
                success: false,

                message: "User not found"
            });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.preferredLanguage = preferredLanguage || user.preferredLanguage;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferredLanguage: user.preferredLanguage
            }
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
        if(!loggedInUserId){
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








