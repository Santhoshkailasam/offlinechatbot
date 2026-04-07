const express = require("express");
const cors = require("cors");

// If fetch not available (Node <18), uncomment below:
// const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// 🧠 In-memory chat history
let chatHistory = [];

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Message is required" });
  }

  try {
    // 👉 Add user message to history
    chatHistory.push({ role: "user", content: message });

    // 👉 Limit memory (last 10 messages)
    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(-10);
    }

    // 👉 Convert history to text format
    const context = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // 👉 Call Ollama local API
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "phi3", // 🔁 change to "llama3" if needed
        prompt: `You are a helpful AI assistant.
Give clear, short answers. Avoid code unless asked.

Conversation:
${context}

assistant:`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 200,
        },
      }),
    });

    const data = await ollamaRes.json();

    const aiReply = data.response?.trim() || "No response";

    // 👉 Save AI reply to history
    chatHistory.push({ role: "assistant", content: aiReply });

    // 👉 Send response
    res.json({
      reply: aiReply,
    });
  } catch (error) {
    console.error("❌ Error:", error);

    res.status(500).json({
      reply: "⚠️ Error connecting to AI",
    });
  }
});

// Optional test route
app.get("/", (req, res) => {
  res.send("✅ Offline AI Backend is running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from phone: http://10.227.119.220:${PORT}`);
});
