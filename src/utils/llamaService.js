import * as FileSystem from "expo-file-system/legacy";
import { initLlama, releaseAllLlama } from "llama.rn";
import { SYSTEM_PROMPTS, RESPONSE_TEMPLATES } from "./prompts";

const MODEL_URL =
  "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf?download=true";

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
    console.log("📥 Downloading Phi-3 model...");

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
    console.log("🧠 Loading TinyLlama into memory...");
    console.log("📂 File size:", fileInfo.size, "bytes");

    // Use simpler config for Android compatibility
    const config = {
      model: MODEL_PATH,
      use_mlock: false,
      n_ctx: 512, // Larger context window for complete responses
      n_threads: 4, // 4 threads for good speed
    };

    console.log("⚙️ Config:", JSON.stringify(config));
    console.log("⏳ Calling initLlama - TinyLlama loads fast...");
    llamaContext = await initLlama(config);

    if (!llamaContext) {
      console.log(
        "⚠️ initLlama returned null, model may not be initialized properly",
      );
      return;
    }

    console.log("✅ initLlama returned:", typeof llamaContext);
    console.log("✅ Model loaded and cached in memory!");
  } catch (err) {
    console.log("❌ Load error:", err.message || err);
    console.log("Error details:", JSON.stringify(err));
    llamaContext = null;
  }
};

export const generateResponse = async (prompt, personality = "assistant") => {
  try {
    console.log("🤖 generateResponse called with:", prompt.substring(0, 50));

    if (!llamaContext) {
      console.log("⚠️ Model not loaded, attempting to load...");
      await loadModel();
    }

    if (!llamaContext) {
      console.log("❌ Model failed to load");
      return RESPONSE_TEMPLATES.notLoaded;
    }

    const fullPrompt = `<|system|>${SYSTEM_PROMPTS[personality] || SYSTEM_PROMPTS.assistant}
<|user|>${prompt}
<|assistant|>`;

    console.log("⏳ Starting completion request...");

    // Create the completion promise - NO timeout, let it finish
    console.log("⏳ Starting completion request...");
    const result = await llamaContext.completion({
      prompt: fullPrompt,
      n_predict: 800, // More tokens for complete comparative answers
      temperature: 0.2, // Even lower for more direct responses
      top_p: 0.4, // Even lower for less randomness
      stop: ["<|user|>", "<|assistant|>"],
    });

    console.log("✅ Response received, processing...");
    console.log("Response length:", result.text?.length || 0);

    // Clean up response: remove preambles only
    let text = result.text?.trim() || RESPONSE_TEMPLATES.noResponse;

    // Only remove common preambles: "Sure", "Happy to help", "Here's", "Let me", etc.
    // Don't remove numbered lists like "1. React" - only remove at very start
    text = text
      .replace(
        /^(Sure[,.]?\s*|Happy to help[,.]?\s*|Here['']?s\s*|Let me\s*|Of course[,.]?\s*)/gi,
        "",
      )
      .trim();

    // Ensure list items (1., 2., 3., A., B., C.) start on new lines
    text = text.replace(/([^\n])(\d+\.|[A-Z]\.)\s+/g, "$1\n$2 ").trim();

    // Add better spacing for comparison responses
    // Split by common keywords and add double newlines
    text = text.replace(
      /\n(React|React Native|VS\.|Difference|Similarity|Key Point|Pros|Cons|Advantages|Disadvantages):/gi,
      "\n\n$1:",
    );
    text = text.replace(/\n(?=[•\-*])/g, "\n"); // Preserve bullet points

    console.log("✅ Response generated successfully");
    return text;
  } catch (err) {
    console.log("❌ Generate error:", err.message || err);
    return RESPONSE_TEMPLATES.error(err.message);
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
