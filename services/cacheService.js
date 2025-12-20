import { getRedisClient } from "../config/redis.js";

const CACHE_TTL = 3600; // 1 hour for translations
const CHAT_HISTORY_TTL = 1800; // 30 minutes for chat history

// Translation Cache - Per user, per message
export const getTranslationFromCache = async (messageId, userId) => {
  try {
    const redis = getRedisClient();
    const redisKey = `translation:${messageId}:${userId}`;
    const cached = await redis.get(redisKey);
    
    if (cached) {
      console.log(`✅ Cache hit for message ${messageId} user ${userId}`);
    }
    
    return cached;
  } catch (error) {
    console.error("❌ Cache get error:", error);
    return null;
  }
};

export const setTranslationCache = async (messageId, userId, translation) => {
  try {
    const redis = getRedisClient();
    const redisKey = `translation:${messageId}:${userId}`;
    await redis.setex(redisKey, CACHE_TTL, translation);
    console.log(`🔄 Cached translation for message ${messageId} user ${userId}`);
  } catch (error) {
    console.error("❌ Cache set error:", error);
  }
};

// Batch Translation Cache - Store multiple translations at once
export const setBatchTranslations = async (translations) => {
  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    
    translations.forEach(({ messageId, userId, translation }) => {
      const redisKey = `translation:${messageId}:${userId}`;
      pipeline.setex(redisKey, CACHE_TTL, translation);
    });
    
    await pipeline.exec();
    console.log(`🔄 Cached ${translations.length} translations in batch`);
  } catch (error) {
    console.error("❌ Batch cache set error:", error);
  }
};

// Chat History Cache - Store entire translated chat for a user
export const getChatHistoryFromCache = async (conversationId, userId) => {
  try {
    const redis = getRedisClient();
    const redisKey = `chat:${conversationId}:${userId}`;
    const cached = await redis.get(redisKey);
    
    if (cached) {
      console.log(`✅ Chat history cache hit for conversation ${conversationId} user ${userId}`);
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    console.error("❌ Chat history cache get error:", error);
    return null;
  }
};

export const setChatHistoryCache = async (conversationId, userId, messages) => {
  try {
    const redis = getRedisClient();
    const redisKey = `chat:${conversationId}:${userId}`;
    await redis.setex(redisKey, CHAT_HISTORY_TTL, JSON.stringify(messages));
    console.log(`🔄 Cached chat history for conversation ${conversationId} user ${userId}`);
  } catch (error) {
    console.error("❌ Chat history cache set error:", error);
  }
};

// Invalidate chat history when new message arrives
export const invalidateChatHistoryCache = async (conversationId, userIds) => {
  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    
    userIds.forEach(userId => {
      const redisKey = `chat:${conversationId}:${userId}`;
      console.log(`🗑️ Deleting cache key: ${redisKey}`);
      pipeline.del(redisKey);
    });
    
    const results = await pipeline.exec();
    console.log(`🗑️ Cache invalidation results:`, results);
  } catch (error) {
    console.error("❌ Cache invalidation error:", error);
  }
};

// User's Active Conversations Cache
export const getUserConversationsCache = async (userId) => {
  try {
    const redis = getRedisClient();
    const redisKey = `user:conversations:${userId}`;
    const cached = await redis.get(redisKey);
    
    if (cached) {
      console.log(`✅ User conversations cache hit for user ${userId}`);
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    console.error("❌ User conversations cache get error:", error);
    return null;
  }
};

export const setUserConversationsCache = async (userId, conversations) => {
  try {
    const redis = getRedisClient();
    const redisKey = `user:conversations:${userId}`;
    await redis.setex(redisKey, CHAT_HISTORY_TTL, JSON.stringify(conversations));
    console.log(`🔄 Cached conversations for user ${userId}`);
  } catch (error) {
    console.error("❌ User conversations cache set error:", error);
  }
};

// Pub/Sub for real-time messages
export const publishMessage = async (channel, data) => {
  try {
    const redis = getRedisClient();
    const publisher = redis.duplicate();
    await publisher.publish(channel, JSON.stringify(data));
    console.log(`📤 Published to ${channel}`);
  } catch (error) {
    console.error("❌ Publish error:", error);
  }
};