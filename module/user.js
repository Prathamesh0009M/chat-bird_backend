import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    // username: {
    //     type: String,
    //     required: true,
    //     unique: true,
    //     lowercase: true,
    //     trim: true
    // },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    preferredLanguage: {
        type: String,
        default: "en",
        enum: ["en", "hi", "mr", "kn", "es", "fr", "de", "ja", "zh", "ar", "pt", "ru", "it"]
    },

    profilePicture: {
        type: String,
        default: null
    },

    // ===== PROFILE MEDIA (CLOUD STORAGE) =====
    avatar: {
        url: {
            type: String,
            default: null  // Cloudinary URL
        },
        publicId: {
            type: String,
            default: null  // Cloudinary public_id for deletion
        },
        uploadedAt: {
            type: Date,
            default: null
        }
    },

    coverPhoto: {
        url: {
            type: String,
            default: null
        },
        publicId: {
            type: String,
            default: null
        },
        uploadedAt: {
            type: Date,
            default: null
        }
    },

    // Default avatar settings if no image uploaded
    avatarColor: {
        type: String,
        default: "#667eea"
    },

    bio: {
        type: String,
        maxlength: 150,
        default: "Hey there! I'm using ChatApp"
    },

    status: {
        type: String,
        enum: ["online", "offline", "away", "busy", "invisible"],
        default: "offline"
    },

    autoTranslate: {
        type: Boolean,
        default: true
    },

    lastSeen: {
        type: Date,
        default: Date.now
    },

    isOnline: {
        type: Boolean,
        default: false
    },



}, {
    timestamps: true
});

// ===== VIRTUAL FIELDS =====
userSchema.virtual('initials').get(function () {
    return this.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});







export default mongoose.model("User", userSchema);