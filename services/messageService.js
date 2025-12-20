import Message from "../module/message.js"
import User from "../module/user.js"
import { translateText } from "./translationService.js";
import {
    getTranslationFromCache,
    setTranslationCache
} from "./cacheService.js";

export const saveMessage = async (conversationId, senderId, text, language) => {
    const newMessage = new Message({
        conversationId,
        sender: senderId,
        text,
        language,
    });

    await newMessage.save();
    return newMessage;
};

export const getConversationMessages = async (conversationId) => {
    return await Message.find({ conversationId })
        .populate("sender", "username")
        .sort({ createdAt: 1 });
};

export const batchTranslateMessages = async (message, userId, userLang) => {
    let translatedText = message.text;

    // 🔥 IMPORTANT: Only translate if languages are different
    if (message.language !== userLang) {
        // Check cache first
        const cached = await getTranslationFromCache(message._id, userId);

        if (cached) {
            console.log(`✅ Cache hit for message ${message._id}`);
            translatedText = cached;
        } else {
            // Translate and cache
            console.log(`🔄 Translating from ${message.language} to ${userLang}`);
            translatedText = await translateText(message.text, userLang);
            await setTranslationCache(message._id, userId, translatedText);
        }
    } else {
        console.log(`⏭️ Skip translation - same language (${userLang})`);
    }

    return translatedText;
};


export const prepareMessageResponse = (message, translatedText, userLang, userId) => {
    return {
        messageId: message._id,
        text: translatedText,
        originalText: message.text,
        originalLanguage: message.language,
        translatedLanguage: userLang,
        sender: {
            id: message.sender._id,
            username: message.sender.username
        },
        createdAt: message.createdAt,
        isMine: message.sender._id.toString() === userId
    };
};