import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import DownloadScreen from "./src/screen/DownloadScreen";
import ChatScreen from "./src/screen/chatbotscreen";
import { checkModelExists } from "./src/utils/modelManager";
import { loadModel } from "./src/utils/llamaService";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    checkModel();
  }, []);

  const checkModel = async () => {
    try {
      console.log("🔍 Checking model...");
      const exists = await checkModelExists();
      console.log("📦 Model exists:", exists);
      // Don't load now - let it load lazily when user sends first message
      setModelReady(exists);
    } catch (e) {
      console.error("❌ checkModel error:", e);
      setModelReady(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadComplete = async () => {
    // Model loaded, chatbot will load it lazily on first message
    console.log("✅ Download complete! Model will load on first message.");
    setModelReady(true);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#080c14",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#c9a84c" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {modelReady ? (
        <ChatScreen />
      ) : (
        <DownloadScreen onComplete={handleDownloadComplete} />
      )}
    </SafeAreaProvider>
  );
}
