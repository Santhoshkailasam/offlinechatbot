import * as FileSystem from "expo-file-system/legacy";
import { initLlama, releaseAllLlama } from "llama.rn";

// ✅ TinyLlama 1.1B GGUF Model - Fast mobile inference
const MODEL_URL =
  "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf?download=true";

const MODEL_PATH = FileSystem.documentDirectory + "tinyllama.gguf";

let llamaContext = null;

export const checkModelExists = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MODEL_PATH);
    return fileInfo.exists;
  } catch (err) {
    console.log("❌ Check error:", err);
    return false;
  }
};

export const downloadModel = async (onProgress) => {
  try {
    console.log("📥 Downloading TinyLlama model...");

    const downloadResumable = FileSystem.createDownloadResumable(
      MODEL_URL,
      MODEL_PATH,
      {},
      (progress) => {
        if (progress.totalBytesExpectedToWrite > 0) {
          const percent =
            progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          onProgress?.(percent);
        } else {
          onProgress?.(0.5);
        }
      },
    );

    const result = await downloadResumable.downloadAsync();
    console.log("✅ Download complete:", result.uri);
    return result.uri;
  } catch (err) {
    console.log("❌ Download error:", err);
    return null;
  }
};

export const loadModel = async () => {
  // Already loaded
  if (llamaContext) {
    console.log("✅ Model already loaded");
    return;
  }

  // Guard: make sure file exists before loading
  const fileInfo = await FileSystem.getInfoAsync(MODEL_PATH);
  if (!fileInfo.exists) {
    console.log("⚠️ Model file not found, skipping load");
    return;
  }

  try {
    console.log("🧠 Loading Phi-3 into memory...");

    llamaContext = await initLlama({
      model: MODEL_PATH,
      use_mlock: true,
      n_ctx: 2048,
      n_threads: 4,
    });

    console.log("✅ Model loaded successfully!");
  } catch (err) {
    console.log("❌ Load error:", err);
    llamaContext = null;
    throw err; // ← rethrow so App.js catch block sees it
  }
};

export const generateResponse = async (prompt, personality = "assistant") => {
  try {
    if (!llamaContext) {
      await loadModel();
    }

    if (!llamaContext) {
      return "⚠️ Model not loaded. Please restart the app.";
    }

    const systemPrompts = {
      assistant: "You are a helpful AI assistant. Be clear and concise.",
      teacher:
        "You are a friendly teacher. Explain step by step with examples.",
      coder:
        "You are a professional programmer. Provide clean and correct code.",
    };

    const fullPrompt = `<|system|>${systemPrompts[personality]}
<|user|>${prompt}
<|assistant|>`;

    console.log("🤖 Generating response...");

    const result = await llamaContext.completion({
      prompt: fullPrompt,
      n_predict: 256,
      temperature: 0.7,
      top_p: 0.9,
      stop: ["<|user|>", "<|assistant|>"],
    });

    console.log("✅ Response generated");
    return result.text.trim();
  } catch (err) {
    console.log("❌ Generate error:", err);
    return `⚠️ Error: ${err.message}`;
  }
};

export const unloadModel = async () => {
  try {
    await releaseAllLlama();
    llamaContext = null;
    console.log("🧹 Model unloaded");
  } catch (err) {
    console.log("❌ Unload error:", err);
  }
};

export const getModelPath = () => MODEL_PATH;
export const isModelLoaded = () => llamaContext !== null;
