// utils/encryption.js
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.PRIVATE_KEY || 'default_secret', 'salt', 32);

export const encrypt = (text) => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
};

export const decrypt = (text) => {
  if (!text) return null;
  
  // If text doesn't contain ':', return as-is (unencrypted or invalid)
  if (!text.includes(':')) {
    console.warn('Decryption skipped: no IV separator found');
    return text;
  }

  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      console.warn('Decryption skipped: invalid format');
      return text;
    }

    const [ivHex, encryptedText] = parts;
    
    // Validate hex strings
    if (ivHex.length !== 32) { // IV should be 16 bytes = 32 hex chars
      console.warn(`Decryption skipped: invalid IV length (${ivHex.length})`);
      return text;
    }
    
    if (!encryptedText || encryptedText.length === 0) {
      console.warn('Decryption skipped: empty encrypted text');
      return text;
    }

    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedText)) {
      console.warn('Decryption skipped: invalid hex format');
      return text;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    return text; // Return original if decryption fails
  }
};