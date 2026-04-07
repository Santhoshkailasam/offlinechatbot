import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { downloadModel } from "../utils/modelManager";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const RING_SIZE = 180;
const STROKE = 8;

function Particle({ delay }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const x = useRef(Math.random() * width).current;
  const size = useRef(2 + Math.random() * 3).current;

  useEffect(() => {
    const animate = () => {
      y.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -(120 + Math.random() * 80),
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 80,
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#c9a84c",
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}

function ProgressRing({ progress, downloading }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (downloading) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      rotation.stopAnimation();
      glowPulse.stopAnimation();
    }
  }, [downloading]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pct = Math.round(progress * 100);
  const segments = 36;

  return (
    <Animated.View
      style={[styles.ringWrapper, { transform: [{ scale: glowPulse }] }]}
    >
      {/* Outer glow */}
      <View style={styles.ringGlow} />

      {/* Track ring */}
      <View style={styles.ringTrack} />

      {/* Spinning arc */}
      <Animated.View
        style={[styles.ringArc, { transform: [{ rotate: spin }] }]}
      />

      {/* Center content */}
      <View style={styles.ringCenter}>
        {downloading ? (
          <>
            <Text style={styles.pctText}>{pct}</Text>
            <Text style={styles.pctSymbol}>%</Text>
          </>
        ) : progress >= 1 ? (
          <Text style={styles.doneIcon}>✦</Text>
        ) : (
          <Text style={styles.idleIcon}>⬡</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function DownloadScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(cardY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const startDownload = async () => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setDownloading(true);
    const fileUri = await downloadModel(setProgress);
    setDownloading(false);

    if (fileUri) {
      setDone(true);
      // User taps Next to navigate — no auto redirect
    } else {
      alert("Download failed ⚠️");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.gridOverlay} />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      {downloading &&
        [0, 400, 800, 1200, 1600, 2000].map((d, i) => (
          <Particle key={i} delay={d} />
        ))}

      <Animated.View
        style={[
          styles.header,
          { opacity: titleOpacity, transform: [{ translateY: titleY }] },
        ]}
      >
        <Text style={styles.eyebrow}>SK Tech AI · OFFLINE SUITE</Text>
        <Text style={styles.title}>Edge Intelligence</Text>
        <Text style={styles.subtitle}>
          Deploy a sovereign AI model{"\n"}directly on your device
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          { opacity: cardOpacity, transform: [{ translateY: cardY }] },
        ]}
      >
        <View style={styles.cardShine} />

        <ProgressRing progress={progress} downloading={downloading} />

        <View style={styles.cardBody}>
          <Text style={styles.modelName}>TinyLlama 1.1B · Q4_K_M</Text>
          <Text style={styles.modelMeta}>
            410 MB · Lightning Fast · On-device
          </Text>

          {(downloading || done) && (
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          )}

          <View style={styles.tags}>
            {["Private", "No Cloud", "Fast"].map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <Animated.View
          style={{ transform: [{ scale: btnScale }], width: "100%" }}
        >
          <TouchableOpacity
            style={[styles.button, done && styles.buttonDone]}
            onPress={done ? onComplete : startDownload}
            disabled={downloading}
            activeOpacity={0.85}
          >
            <View style={styles.btnInner}>
              <Text style={[styles.btnText, done && styles.btnTextDone]}>
                {done
                  ? "Next"
                  : downloading
                    ? "Downloading…"
                    : "Begin Download"}
              </Text>
              {(done || (!downloading && !done)) && (
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={done ? "#fff" : "#080c14"}
                />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footNote}>
          One-time setup · Runs fully offline after install
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080c14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: "#fff",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.18,
  },
  blobTop: {
    width: 340,
    height: 340,
    backgroundColor: "#c9a84c",
    top: -100,
    right: -80,
    transform: [{ scaleX: 1.4 }],
  },
  blobBottom: {
    width: 280,
    height: 280,
    backgroundColor: "#3b5bdb",
    bottom: -60,
    left: -60,
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: "#c9a84c",
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: "700",
    marginBottom: 12,
    opacity: 0.8,
  },
  title: {
    color: "#f0ece0",
    fontSize: 36,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: "#8892a4",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  card: {
    width: width - 40,
    backgroundColor: "#0e1520",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#1e2d45",
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
    overflow: "hidden",
  },
  cardShine: {
    position: "absolute",
    top: 0,
    left: "15%",
    right: "15%",
    height: 1,
    backgroundColor: "#c9a84c",
    opacity: 0.5,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  ringGlow: {
    position: "absolute",
    width: RING_SIZE + 30,
    height: RING_SIZE + 30,
    borderRadius: (RING_SIZE + 30) / 2,
    backgroundColor: "#c9a84c",
    opacity: 0.07,
  },
  ringTrack: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE,
    borderColor: "#1a2540",
  },
  ringArc: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE,
    borderColor: "transparent",
    borderTopColor: "#c9a84c",
    borderRightColor: "#c9a84c44",
  },
  ringCenter: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pctText: {
    color: "#f0ece0",
    fontSize: 42,
    fontWeight: "200",
    letterSpacing: -2,
  },
  pctSymbol: {
    color: "#c9a84c",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "600",
  },
  doneIcon: {
    color: "#c9a84c",
    fontSize: 40,
  },
  idleIcon: {
    color: "#2a3a55",
    fontSize: 40,
  },
  cardBody: {
    width: "100%",
    marginBottom: 24,
  },
  modelName: {
    color: "#e8e0cc",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  modelMeta: {
    color: "#4a5a72",
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  barTrack: {
    height: 2,
    backgroundColor: "#1a2540",
    borderRadius: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#c9a84c",
    borderRadius: 1,
  },
  tags: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#1e2d45",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#0a1020",
  },
  tagText: {
    color: "#4a6080",
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    backgroundColor: "#c9a84c",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: "#c9a84c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDone: {
    backgroundColor: "#1a3a20",
    shadowColor: "#4CAF50",
    borderWidth: 1,
    borderColor: "#2d6e35",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    color: "#080c14",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  btnTextDone: {
    color: "#fff",
  },
  footNote: {
    color: "#2a3a55",
    fontSize: 11,
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
