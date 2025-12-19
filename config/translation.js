import { TranslationServiceClient } from "@google-cloud/translate";

let translationClient = null;

export const initializeTranslationClient = () => {
  try {
    translationClient = new TranslationServiceClient();
    // console.log("✅ Translation client initialized");
    return translationClient;
  } catch (error) {
    console.error("❌ Failed to initialize translation client:", error);
    process.exit(1);
  }
};

export const getTranslationClient = () => {
  if (!translationClient) {
    throw new Error("Translation client not initialized");
  }
  return translationClient;
};

export const getProjectId = () => process.env.GOOGLE_PROJECT_ID;
