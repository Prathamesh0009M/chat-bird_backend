import { getTranslationClient, getProjectId } from "../config/translation.js";

export const translateText = async (text, targetLanguage) => {
  try {
    console.log(`🔄 Translating to ${targetLanguage}: "${text}"`);
    
    const translationClient = getTranslationClient();
    const projectId = getProjectId();
    
    const request = {
      parent: `projects/${projectId}/locations/global`,
      contents: [text],
      mimeType: "text/plain",
      targetLanguageCode: targetLanguage,
    };
    
    const startTime = Date.now();
    const [response] = await translationClient.translateText(request);
    const endTime = Date.now();
    
    console.log(`✅ Translation completed in ${endTime - startTime}ms`);
    
    return response.translations[0].translatedText;
  } catch (error) {
    console.error("❌ Error translating text:", error.message);
    return `[Translation failed for ${targetLanguage}]`;
  }
};