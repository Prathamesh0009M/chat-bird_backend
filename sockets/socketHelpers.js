// In-memory user socket management only
export const userSocketMap = new Map();

export const registerUser = (userId, socketId) => {
  userSocketMap.set(userId, socketId);
  console.log(`User ${userId} registered with socket ${socketId}`);
};

export const unregisterUser = (socketId) => {
  for (const [userId, sockId] of userSocketMap.entries()) {
    if (sockId === socketId) {
      userSocketMap.delete(userId);
      console.log(`User ${userId} removed from socket map`);
      break;
    }
  }
};

export const getRecipientSocket = (recipientId) => {
  return userSocketMap.get(recipientId);
};
