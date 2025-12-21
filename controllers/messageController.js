import User from "../module/user.js"
import Conversation from "../module/conversation.js";
import {
  getConversationMessages,
  batchTranslateMessages,
  prepareMessageResponse
} from "../services/messageService.js";

import {
  getChatHistoryFromCache,
  setChatHistoryCache
} from "../services/cacheService.js";



// Get messages for a conversation (with caching and translation)
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    // Get user's preferred language
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userLang = user.preferredLanguage;

    // Try cache first
    const cachedHistory = await getChatHistoryFromCache(conversationId, userId);

    if (cachedHistory) {
      console.log(`✅ Returning cached chat history for user ${userId}`);
      return res.json({
        success: true,
        conversationId,
        messages: cachedHistory,
        totalMessages: cachedHistory.length,
        cached: true
      });
    }

    // Fetch from database and translate
    console.log(`📦 Fetching and translating messages for user ${userId}`);
    const messages = await getConversationMessages(conversationId);

    // Batch translate messages
    const translatedMessagesData = await batchTranslateMessages(
      messages.map(msg => ({
        _id: msg._id,
        text: msg.text,
        language: msg.language,
        sender: msg.sender,
        createdAt: msg.createdAt
      })),
      userId,
      userLang
    );

    // Format response
    const translatedMessages = translatedMessagesData.map((msg, index) => ({
      messageId: msg._id,
      text: msg.translatedText,
      sender: messages[index].sender._id,
      senderName: messages[index].sender.username,
      lang: userLang,
      originalLanguage: msg.language,
      createdAt: msg.createdAt,
      isMine: messages[index].sender._id.toString() === userId
    }));

    // Cache for future requests
    await setChatHistoryCache(conversationId, userId, translatedMessages);

    res.json({
      success: true,
      conversationId,
      messages: translatedMessages,
      totalMessages: translatedMessages.length,
      cached: false
    });

  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};