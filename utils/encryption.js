// utils/encryption.js
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-cbc';
// Ensure the key is 32 bytes. We hash the .env key to guarantee this.
const key = crypto.scryptSync(process.env.PRIVATE_KEY || 'default_secret', 'salt', 32);

export const encrypt = (text) => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(16); // Random Initialization Vector
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Store IV with the encrypted text (format: iv:content)
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fail safe
  }
};

export const decrypt = (text) => {
  if (!text) return null;
  // If text doesn't contain ':', it might be old unencrypted data
  if (!text.includes(':')) return text; 

  try {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Return original if decryption fails
  }
};  