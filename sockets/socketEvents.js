// sockets/socketEvents.js
import User from "../module/user.js"
import Conversation from "../module/conversation.js"
import {
  saveMessage,
  getConversationMessages,
  batchTranslateMessages
} from "../services/messageService.js";
import {
  publishMessage,
  getChatHistoryFromCache,
  setChatHistoryCache,
  invalidateChatHistoryCache,
  setTranslationCache
} from "../services/cacheService.js";
import { translateText } from "../services/translationService.js";
import { encrypt, decrypt } from "../utils/encryption.js";

export const handleLoadChatHistory = async (socket, { conversationId, userId }) => {
  try {
    // 🔥 CRITICAL: ALWAYS fetch fresh user data from DB
    // This ensures we get the latest preferredLanguage
    const user = await User.findById(userId);
    if (!user) {
      socket.emit("error", { message: "User not found" });
      return;
    }

    // 🔥 Get the CURRENT preferred language (after any updates)
    const userLang = user.preferredLanguage;
    console.log(`📖 [LOAD HISTORY] User: ${userId}, Language: ${userLang}`);

    // Try to get from cache (cache key includes userId, so each user has their own cache)
    const cachedHistory = await getChatHistoryFromCache(conversationId, userId);

    if (cachedHistory) {
      socket.emit("chatHistory", {
        conversationId,
        messages: cachedHistory
      });
      return;
    }

    // Fetch from database
    console.log(`📦 Cache miss - fetching from DB for ${userLang}`);
    const messages = await getConversationMessages(conversationId);

    // Translate each message for this user's CURRENT language
    const translatedMessages = await Promise.all(
      messages.map(async (msg) => {
        // STEP 1: DECRYPT (only for text messages)
        let plainText = msg.text;
        if (msg.messageType === 'text' && msg.text) {
          plainText = decrypt(msg.text);
        }

        let finalDisplayText = plainText;

        // STEP 2: TRANSLATE if needed
        if (msg.messageType === "text" && msg.language !== userLang) {
          console.log(`🔄 Translate: ${msg.language} → ${userLang}`);
          const tempMsg = { ...msg.toObject(), text: plainText };
          finalDisplayText = await batchTranslateMessages(tempMsg, userId, userLang);
        }

        // Build response
        const messageObj = {
          messageId: msg._id,
          text: finalDisplayText,
          sender: msg.sender._id,
          senderName: msg.sender.username,
          lang: userLang, // The language we're displaying in
          originalLanguage: msg.language,
          createdAt: msg.createdAt,
          isMine: msg.sender._id.toString() === userId,
          messageType: msg.messageType || "text"
        };

        // Add media if present
        if (msg.messageType === "image" || msg.messageType === "video") {
          messageObj.media = {
            url: msg.media.url,
            type: msg.messageType,
            size: msg.media.size
          };
        }

        return messageObj;
      })
    );

    // Cache for this specific user in their language
    await setChatHistoryCache(conversationId, userId, translatedMessages);

    socket.emit("chatHistory", {
      conversationId,
      messages: translatedMessages
    });

    console.log(`✅ Sent ${translatedMessages.length} messages in ${userLang}`);

  } catch (error) {
    console.error("❌ Error loading chat history:", error);
    socket.emit("error", { message: "Failed to load chat history" });
  }
};
export const handleSendMessage = async (socket, data) => {
  const { conversationId, senderId, text, language, recipients } = data;

  try {
    // Save to MongoDB
    const encryptedText = encrypt(text);

    const newMessage = await saveMessage(
      conversationId,
      senderId,
      encryptedText,
      language
    );

    // Get sender info
    const sender = await User.findById(senderId);

    // Get all participants for cache invalidation
    const conversation = await Conversation.findById(conversationId);
    const allParticipantIds = conversation.participants.map(p => p.toString());

    // Invalidate cached chat history for all participants
    await invalidateChatHistoryCache(conversationId, allParticipantIds);

    // Send confirmation to sender (original language)
    socket.emit("receiveMessage", {
      text: text,
      sender: senderId,
      senderName: sender.username,
      lang: language, 
      messageId: newMessage._id,
      createdAt: newMessage.createdAt,
      isMine: true,
      messageType: "text"
    });

    console.log(`✅ Sent confirmation to sender ${senderId}`);

    // Translate and publish to recipients
    for (const recipientId of recipients) {
      if (recipientId === senderId) continue;

      const targetUser = await User.findById(recipientId);
      if (!targetUser) {
        console.log(`⚠️ Recipient ${recipientId} not found`);
        continue;
      }

      const targetLang = targetUser.preferredLanguage;
      let translatedText;

      // Translate message for recipient's language
      if (targetLang === language) {
        translatedText = text;
        console.log(`✅ No translation needed for ${recipientId} (same language)`);
      } else {
        console.log(`🔄 Translating message ${newMessage._id} from ${language} to ${targetLang} for user ${recipientId}`);
        translatedText = await translateText(text, targetLang);

        // Cache the translation
        await setTranslationCache(newMessage._id, recipientId, translatedText);
        console.log(`✅ Translation cached: "${text}" -> "${translatedText}"`);
      }

      // Publish to Redis Pub/Sub
      await publishMessage("chat:messages", {
        recipientId,
        messageData: {
          text: translatedText,
          sender: senderId,
          senderName: sender.username,
          lang: targetLang,
          messageId: newMessage._id,
          createdAt: newMessage.createdAt,
          isMine: false,
          messageType: "text"
        }
      });

      console.log(`📤 Published translated message for user ${recipientId} in ${targetLang}`);
    }
  } catch (error) {
    console.error("❌ Error handling sendMessage:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
};