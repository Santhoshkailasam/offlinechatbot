import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Modal,
  Alert,
  Clipboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { loadModel, generateResponse } from "../utils/llamaService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Keyboard } from "react-native";
// ─── Theme Palettes ──────────────────────────────────────────────────────────
const DARK = {
  bg: "#080A0F",
  card: "#131720",
  border: "#1E2535",
  gold: "#C9A84C",
  goldDim: "#7A6228",
  user: "#1A2540",
  userBorder: "#2A3D6B",
  text: "#EAE8E1",
  muted: "#6B7280",
  panel: "#0B0D14",
  panelItem: "#131720",
  panelActive: "#1E2A3A",
  overlay: "rgba(0,0,0,0.6)",
  toggleTrack: "#1E2535",
  danger: "#2D1515",
  dangerText: "#F87171",
  sendIcon: "#080A0F",
};

const LIGHT = {
  bg: "#F5F3EE",
  card: "#FFFFFF",
  border: "#E0DBD1",
  gold: "#A07828",
  goldDim: "#C9A84C",
  user: "#EAF0FF",
  userBorder: "#B8CAEE",
  text: "#1A1814",
  muted: "#8A8580",
  panel: "#EDEAE3",
  panelItem: "#FFFFFF",
  panelActive: "#E8E2D6",
  overlay: "rgba(0,0,0,0.3)",
  toggleTrack: "#D6D1C8",
  danger: "#FEE2E2",
  dangerText: "#B91C1C",
  sendIcon: "#FFFFFF",
};

// ─── Typing Dots ─────────────────────────────────────────────────────────────
function TypingDots({ C }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(480 - i * 160),
        ]),
      ),
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
        marginLeft: 36,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 16,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 5,
        }}
      >
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: C.gold,
              opacity: dot,
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Animated Loading Bubble ──────────────────────────────────────────────────
function AnimatedLoadingBubble({ C }) {
  const floatAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = floatAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(300 - i * 100),
        ]),
      ),
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        marginBottom: 12,
        alignItems: "flex-end",
        justifyContent: "flex-start",
        opacity: 1,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.goldDim,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
          marginBottom: 2,
        }}
      >
        <Text style={{ fontSize: 11, color: C.gold }}>✦</Text>
      </View>

      <View
        style={{
          maxWidth: "78%",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.border,
          borderBottomLeftRadius: 4,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {floatAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: C.gold,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.3, 1],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Format Response Text for Better UI ─────────────────────────────────────
function FormattedText({ text, C }) {
  // Split text by double newlines (sections) and single newlines (lines)
  const sections = text.split(/\n\n+/);

  return (
    <View>
      {sections.map((section, sectionIdx) => {
        const lines = section.split(/\n/);
        return (
          <View
            key={sectionIdx}
            style={{ marginBottom: sectionIdx !== sections.length - 1 ? 8 : 0 }}
          >
            {lines.map((line, lineIdx) => {
              const isBold = line.match(/^[A-Z][a-z\s]+:|^\d+\.|^[•\-*]/);
              const isPaddedPoint = line.match(/^\s+[A-Z•\-*]/);

              return (
                <Text
                  key={lineIdx}
                  style={{
                    fontSize: 14,
                    color: C.text,
                    lineHeight: 20,
                    letterSpacing: 0.1,
                    fontWeight: isBold ? "600" : "400",
                    marginLeft: isPaddedPoint ? 12 : 0,
                    marginBottom: line.trim() === "" ? 4 : 2,
                  }}
                >
                  {line}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ item, C }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const isUser = item.sender === "user";
  const [copied, setCopied] = useState(false);
  const isLoading = item.text === "...";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        delay: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCopy = async () => {
    try {
      await Clipboard.setString(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.log("❌ Copy error:", err);
    }
  };

  // Show animated loading bubble instead of regular message
  if (isLoading) {
    return <AnimatedLoadingBubble C={C} />;
  }

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        marginBottom: 12,
        alignItems: "flex-end",
        justifyContent: isUser ? "flex-end" : "flex-start",
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {!isUser && (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.goldDim,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            marginBottom: 2,
          }}
        >
          <Text style={{ fontSize: 11, color: C.gold }}>✦</Text>
        </View>
      )}

      <View
        style={{
          maxWidth: "78%",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isUser ? C.user : C.card,
          borderWidth: 1,
          borderColor: isUser ? C.userBorder : C.border,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
        }}
      >
        {isUser ? (
          <Text
            style={{
              fontSize: 15,
              color: C.text,
              lineHeight: 22,
              letterSpacing: 0.1,
            }}
          >
            {item.text}
          </Text>
        ) : (
          <FormattedText text={item.text} C={C} />
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 5,
            gap: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>
              {new Date(parseInt(item.id)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {/* Sent checkmark for user messages */}
            {isUser && <Text style={{ fontSize: 11, color: C.gold }}>✓</Text>}
          </View>

          {/* Copy button */}
          <TouchableOpacity
            onPress={handleCopy}
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: copied ? C.gold + "25" : C.border,
              borderWidth: 1,
              borderColor: copied ? C.gold : C.border,
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={copied ? "check-circle" : "content-copy"}
              size={14}
              color={copied ? C.gold : C.muted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle, C }) {
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isDark]);
  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          backgroundColor: isDark ? C.goldDim : C.toggleTrack,
          justifyContent: "center",
          paddingHorizontal: 2,
          borderWidth: 1,
          borderColor: C.goldDim,
        }}
      >
        <Animated.View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: C.gold,
            transform: [{ translateX: knobX }],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 10 }}>{isDark ? "🌙" : "☀️"}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Side Panel ───────────────────────────────────────────────────────────────
function SidePanel({
  visible,
  onClose,
  sessions,
  currentId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  C,
}) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteSession(id),
        },
      ],
    );
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      "Clear All History",
      "Delete all conversations? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            sessions.forEach((s) => onDeleteSession(s.id));
            onClose();
          },
        },
      ],
    );
  };

  const getPreview = (messages) => {
    const first = messages.find((m) => m.sender === "user");
    return first
      ? first.text.slice(0, 38) + (first.text.length > 38 ? "…" : "")
      : "New conversation";
  };

  const getDateLabel = (session) => {
    if (!session.messages.length) return "Just now";
    const ts = parseInt(session.messages[0].id);
    return new Date(ts).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Dim overlay */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: C.overlay }}
          onPress={onClose}
          activeOpacity={1}
        />
        {/* Sliding Panel */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 288,
            backgroundColor: C.panel,
            transform: [{ translateX: slideAnim }],
            borderRightWidth: StyleSheet.hairlineWidth,
            borderRightColor: C.border,
          }}
        >
          <SafeAreaView
            style={{ flex: 1, backgroundColor: C.bg }}
            edges={["top"]}
          >
            {/* Panel Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 18,
                paddingVertical: 15,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: C.border,
              }}
            >
              <Text
                style={{
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  fontSize: 16,
                  color: C.gold,
                  letterSpacing: 4,
                }}
              >
                HISTORY
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
              onPress={() => {
                onNewChat();
                onClose();
              }}
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 14,
                marginTop: 14,
                marginBottom: 10,
                paddingVertical: 11,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.gold,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: C.gold,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: C.sendIcon,
                    fontSize: 18,
                    fontWeight: "600",
                    lineHeight: 24,
                  }}
                >
                  +
                </Text>
              </View>
              <Text
                style={{
                  color: C.gold,
                  fontSize: 14,
                  letterSpacing: 0.5,
                  fontWeight: "500",
                }}
              >
                New Chat
              </Text>
            </TouchableOpacity>

            {/* Section Label */}
            {sessions.length > 0 && (
              <Text
                style={{
                  color: C.muted,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginHorizontal: 18,
                  marginBottom: 6,
                }}
              >
                Recent
              </Text>
            )}

            {/* Session List */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {sessions.length === 0 ? (
                <Text
                  style={{
                    color: C.muted,
                    textAlign: "center",
                    marginTop: 40,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  No conversations yet.{"\n"}Start chatting!
                </Text>
              ) : (
                // Reverse to show newest first
                [...sessions].reverse().map((session) => {
                  const isActive = session.id === currentId;
                  return (
                    <View
                      key={session.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 14,
                        marginBottom: 6,
                        borderRadius: 10,
                        backgroundColor: isActive ? C.panelActive : C.panelItem,
                        borderWidth: 1,
                        borderColor: isActive ? C.goldDim : C.border,
                        overflow: "hidden",
                      }}
                    >
                      {/* Active indicator strip */}
                      {isActive && (
                        <View
                          style={{
                            width: 3,
                            alignSelf: "stretch",
                            backgroundColor: C.gold,
                          }}
                        />
                      )}
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          paddingVertical: 11,
                          paddingHorizontal: 12,
                        }}
                        onPress={() => {
                          onSelectSession(session.id);
                          onClose();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            color: C.text,
                            fontSize: 13,
                            fontWeight: "500",
                            marginBottom: 3,
                          }}
                          numberOfLines={1}
                        >
                          {getPreview(session.messages)}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Text style={{ color: C.muted, fontSize: 11 }}>
                            {getDateLabel(session)}
                          </Text>
                          <Text style={{ color: C.muted, fontSize: 11 }}>
                            ·
                          </Text>
                          <Text style={{ color: C.muted, fontSize: 11 }}>
                            {session.messages.length} msg
                            {session.messages.length !== 1 ? "s" : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {/* Delete single */}
                      <TouchableOpacity
                        onPress={() => confirmDelete(session.id)}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 13,
                          borderLeftWidth: StyleSheet.hairlineWidth,
                          borderLeftColor: C.border,
                        }}
                        hitSlop={{ top: 4, bottom: 4 }}
                      >
                        <Ionicons name="trash" size={18} color={C.dangerText} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Clear All Footer */}
            {sessions.length > 0 && (
              <TouchableOpacity
                onPress={confirmDeleteAll}
                style={{
                  marginHorizontal: 14,
                  marginBottom: 12,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: C.danger,
                  borderWidth: 1,
                  borderColor: C.dangerText + "44",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="trash" size={18} color={C.dangerText} />
                <Text
                  style={{
                    color: C.dangerText,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Clear All History
                </Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <ChatScreen />
    </SafeAreaProvider>
  );
}

// ─── Chat Screen ──────────────────────────────────────────────────────────────
function ChatScreen() {
  const [isDark, setIsDark] = useState(true);
  const C = isDark ? DARK : LIGHT;

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // sessions: Array<{ id: string, messages: Message[] }>
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentChat =
    sessions.find((s) => s.id === currentSessionId)?.messages ?? [];

  const flatListRef = useRef();
  const sendScale = useRef(new Animated.Value(1)).current;
  const shouldContinueStreaming = useRef(true);
  const currentBotMsgId = useRef(null);

  useEffect(() => {
    const initialize = async () => {
      await initSessions();
      loadModel();
      setIsInitialized(true);
    };
    initialize();
  }, []);

  // ── Persistence ──────────────────────────────────────────────────────────────
  const initSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem("aria_sessions_v2");
      console.log(
        "📂 Loading sessions from storage...",
        raw ? "Found" : "Not found",
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log("✅ Loaded", parsed.length, "session(s)");
        if (parsed.length > 0) {
          // Create a new blank session for current chat
          const newSessionId = Date.now().toString();
          const newSession = { id: newSessionId, messages: [] };
          
          // Add new session to saved sessions (at the end)
          const updated = [...parsed, newSession];
          
          setSessions(updated);
          setCurrentSessionId(newSessionId);
          
          // Save updated list with new session
          await AsyncStorage.setItem("aria_sessions_v2", JSON.stringify(updated));
          console.log("✨ Created new session:", newSessionId);
          console.log("💾 Previous sessions preserved:", parsed.length);
          return;
        }
      }
    } catch (err) {
      console.log("❌ Session load error:", err);
    }
    // First launch — create blank session
    console.log("➕ Creating new session (first launch)");
    const id = Date.now().toString();
    const initial = [{ id, messages: [] }];
    setSessions(initial);
    setCurrentSessionId(id);
    await AsyncStorage.setItem("aria_sessions_v2", JSON.stringify(initial));
  };

  const persist = (updated) => {
    AsyncStorage.setItem("aria_sessions_v2", JSON.stringify(updated)).catch(
      () => {},
    );
  };

  // ── Session Helpers ───────────────────────────────────────────────────────────
  const createNewSession = () => {
    const id = Date.now().toString();
    setSessions((prev) => {
      const updated = [...prev, { id, messages: [] }];
      persist(updated);
      return updated;
    });
    setCurrentSessionId(id);
    setMessage("");
    setPanelOpen(false); // Auto-close panel on new chat
  };

  const selectSession = (id) => setCurrentSessionId(id);

  const deleteSession = (id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      // Always keep at least one session
      if (updated.length === 0) {
        const newId = Date.now().toString();
        const fresh = [{ id: newId, messages: [] }];
        persist(fresh);
        setCurrentSessionId(newId);
        return fresh;
      }
      persist(updated);
      if (id === currentSessionId) {
        setCurrentSessionId(updated[updated.length - 1].id);
      }
      return updated;
    });
    setPanelOpen(false); // Auto-close panel on delete
  };

  const updateCurrentMessages = (updater) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === currentSessionId ? { ...s, messages: updater(s.messages) } : s,
      );
      persist(updated);
      return updated;
    });
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const pressSend = () => {
    Animated.sequence([
      Animated.timing(sendScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(sendScale, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start();
    sendMessage();
  };

  const stopMessage = () => {
    shouldContinueStreaming.current = false;
    // Update the message to show stopped indicator
    if (currentBotMsgId.current) {
      updateCurrentMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentBotMsgId.current
            ? {
                ...msg,
                text:
                  msg.text === "..."
                    ? "⛔ Generation stopped"
                    : msg.text + " [stopped]",
              }
            : msg,
        ),
      );
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    shouldContinueStreaming.current = true; // Reset flag
    const userMsg = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: "user",
    };
    updateCurrentMessages((prev) => [...prev, userMsg]);
    setMessage("");

    // Add bot message immediately with loading indicator
    const botMsgId = Date.now().toString() + "b";
    currentBotMsgId.current = botMsgId; // Store for stop button
    const placeholderMsg = {
      id: botMsgId,
      text: "...",
      sender: "bot",
    };
    updateCurrentMessages((prev) => [...prev, placeholderMsg]);
    setLoading(true);

    try {
      const aiReply = await generateResponse(message.trim());

      // Stream the response word by word
      const words = aiReply.split(/(\s+)/); // Split by whitespace but keep spaces
      let displayedText = "";

      for (let i = 0; i < words.length; i++) {
        // Check if user stopped the generation
        if (!shouldContinueStreaming.current) {
          console.log("⛔ Generation stopped by user");
          // Update message to show stopped
          updateCurrentMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? {
                    ...msg,
                    text: displayedText || "⛔ Generation stopped",
                  }
                : msg,
            ),
          );
          break;
        }

        displayedText += words[i];

        // Update message with current text
        updateCurrentMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: displayedText } : msg,
          ),
        );

        // Add delay between words (30ms)
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    } catch (err) {
      // Update placeholder with error message
      updateCurrentMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                text: "❌ Unable to process your request at this time.",
              }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
      shouldContinueStreaming.current = false;
      currentBotMsgId.current = null;
    }
  };

  const isEmpty = currentChat.length === 0 && !loading;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Side Panel */}
      <SidePanel
        visible={panelOpen}
        onClose={() => setPanelOpen(false)}
        sessions={sessions}
        currentId={currentSessionId}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onNewChat={createNewSession}
        C={C}
      />

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: C.bg,
        }}
      >
        {/* Hamburger menu */}
        <TouchableOpacity
          onPress={() => setPanelOpen(true)}
          style={{ padding: 6 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={{ gap: 5 }}>
            <View
              style={{
                width: 22,
                height: 2,
                borderRadius: 1,
                backgroundColor: C.gold,
              }}
            />
            <View
              style={{
                width: 16,
                height: 2,
                borderRadius: 1,
                backgroundColor: C.gold,
              }}
            />
            <View
              style={{
                width: 22,
                height: 2,
                borderRadius: 1,
                backgroundColor: C.gold,
              }}
            />
          </View>
        </TouchableOpacity>

        {/* Center title */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              fontSize: 22,
              letterSpacing: 5,
              color: C.gold,
              fontWeight: "400",
            }}
          >
            SKTech AI
          </Text>
          <Text
            style={{
              fontSize: 9,
              letterSpacing: 1.5,
              color: C.muted,
              textTransform: "uppercase",
              marginTop: 1,
            }}
          >
            Edge Intelligence · Offline
          </Text>
        </View>

        {/* Right: theme toggle + LOCAL badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ThemeToggle
            isDark={isDark}
            onToggle={() => setIsDark((d) => !d)}
            C={C}
          />
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: C.border,
          marginHorizontal: 20,
        }}
      />

      {/* ── Chat List ─────────────────────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={currentChat}
        renderItem={({ item }) => <MessageBubble item={item} C={C} />}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
          isEmpty && { flex: 1, justifyContent: "center" },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingVertical: 60,
              paddingHorizontal: 30,
            }}
          >
            <Text style={{ fontSize: 30, color: C.goldDim, marginBottom: 20 }}>
              ✦
            </Text>
            <Text
              style={{
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                fontSize: 20,
                color: C.text,
                marginBottom: 10,
                letterSpacing: 0.5,
              }}
            >
              How can I assist you?
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: C.muted,
                textAlign: "center",
                lineHeight: 20,
                letterSpacing: 0.2,
              }}
            >
              Your private AI runs entirely on-device.{"\n"}No data ever leaves
              your phone.
            </Text>
          </View>
        }
        ListFooterComponent={null}
      />

      {/* ── Input Bar ─────────────────────────────────────────────────────────── */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 6,
          backgroundColor: C.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.border,
          gap: 8,
          marginBottom: keyboardHeight,
        }}
      >
        {/* New Chat + button */}
        <TouchableOpacity
          onPress={createNewSession}
          activeOpacity={0.75}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: C.goldDim,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.card,
          }}
        >
          <Text
            style={{
              color: C.gold,
              fontSize: 24,
              lineHeight: 28,
              fontWeight: "300",
              marginTop: -1,
            }}
          >
            +
          </Text>
        </TouchableOpacity>

        {/* Text input */}
        <View
          style={{
            flex: 1,
            backgroundColor: C.card,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: inputFocused ? C.goldDim : C.border,
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <TextInput
            style={{
              color: C.text,
              fontSize: 15,
              lineHeight: 21,
              maxHeight: 110,
              letterSpacing: 0.1,
            }}
            placeholder="Ask anything…"
            placeholderTextColor={C.muted}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={pressSend}
          />
        </View>

        {/* Send/Stop button - Changes to danger theme when loading */}
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            onPress={loading ? stopMessage : pressSend}
            disabled={!message.trim() && !loading}
            activeOpacity={0.85}
            style={{
              width: 44,
              height: 44,
              borderRadius: loading ? 8 : 22,
              backgroundColor: loading
                ? C.danger
                : !message.trim()
                  ? C.border
                  : C.gold,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: loading ? 1 : 0,
              borderColor: loading ? C.dangerText : "transparent",
            }}
          >
            {loading ? (
              <MaterialCommunityIcons
                name="stop-circle"
                size={20}
                color={C.dangerText}
              />
            ) : (
              <Ionicons
                name="arrow-up"
                size={20}
                color={!message.trim() ? C.muted : C.sendIcon}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text
        style={{
          textAlign: "center",
          fontSize: 10,
          letterSpacing: 0.8,
          color: C.muted,
          paddingBottom: 8,
          paddingTop: 2,
          opacity: 0.55,
        }}
      >
        Responses generated locally · Private by design
      </Text>
    </SafeAreaView>
  );
}
