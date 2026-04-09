
# 🚀 SKTech AI – Offline Chatbot App

> ⚡ Edge Intelligence • Fully Offline • Private by Design

SKTech AI is a mobile-based offline AI chatbot that runs directly on your device without requiring internet connectivity. It uses lightweight AI models like TinyLlama to deliver fast, private, and secure responses.

---

## 📲 Download APK

👉 Download the app here:  
https://expo.dev/accounts/santhoshkailasam/projects/OfflineChatbotApp/builds/2f2158b6-01b2-4728-aa34-3839c8731f3f

> ⚠️ Note: Enable "Install from Unknown Sources" in your device settings before installing.

---

## 📱 Features

- 🤖 Offline AI Chat (No Internet Required)
- 🔒 100% Private (No Cloud / No Tracking)
- 🌙 Dark & Light Mode Support
- 💬 Real-time Chat UI
- 📂 Chat History with Delete & Clear Options
- ⚡ Fast Local AI Inference
- 📥 One-time Model Download

---

## 🧠 AI Model

- Model: TinyLlama 1.1B  
- Quantization: Q4_K_M  
- Size: ~410 MB  
- Runs fully on-device  

---

## 🛠️ Tech Stack

- React Native (Expo)
- JavaScript
- Local Storage (AsyncStorage / FileSystem)
- GGUF AI Models

---

## 📦 Installation (For Developers)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/offline-chatbot.git
cd offline-chatbot
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Run App

```bash
npx expo start
```

---

## 📥 Model Setup

1. Download the TinyLlama model (.gguf file)
2. Place the model inside app storage

```js
const MODEL_PATH = FileSystem.documentDirectory + "model.gguf";
```

---

## 📱 Build APK / AAB

```bash
eas build -p android --profile production
```

---

## 📂 Project Structure

```
offline-chatbot/
│── assets/
│   └── model.gguf
│── components/
│── screens/
│── context/
│── utils/
│── App.js
│── package.json
```

---

## 🔐 Privacy

* ❌ No internet required after setup
* ❌ No cloud API calls
* ❌ No data collection
* ✅ Fully on-device processing

---

## 🚧 Future Improvements

* 🧠 Multiple AI models support
* 🎤 Voice input
* 🔊 Text-to-Speech
* 🌍 Multi-language support
* 📎 File & Image input

---

## 👨‍💻 Author

Kailasam N
AI Developer | Full Stack Developer

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 📢 Share it

---




