// System prompts for different AI personalities
export const SYSTEM_PROMPTS = {
  assistant:
    "You are a helpful AI assistant. Respond directly and briefly. For greetings like 'hi' or 'hello', just say 'Hi! How can I help?' Do not use preambles or explanations. Keep responses to 1-2 sentences.",
  teacher:
    "You are a friendly teacher. Answer questions directly in 1-2 sentences. No preambles.",
  coder:
    "You are a programmer. Provide code or answers directly. No preambles.",
  default:
    "You are a helpful AI assistant. Respond directly and briefly. For greetings like 'hi' or 'hello', just say 'Hi! How can I help?' Do not use preambles or explanations. Keep responses to 1-2 sentences.",
};

// Get system prompt by personality type
export const getSystemPrompt = (personality = "assistant") => {
  return SYSTEM_PROMPTS[personality] || SYSTEM_PROMPTS.default;
};

// AI response templates
export const RESPONSE_TEMPLATES = {
  notLoaded: "⚠️ Model not loaded. Please restart the app.",
  error: (message) => `⚠️ Error: ${message || "Unknown error"}`,
  noResponse: "No response generated",
};
