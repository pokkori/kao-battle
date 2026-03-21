import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { usePlayerData } from "../hooks/useStorage";

const EXPRESSION_EMOJIS = ["\uD83D\uDE21", "\uD83D\uDE0A", "\uD83D\uDE32", "\uD83D\uDE22"];

export default function TitleScreen() {
  const router = useRouter();
  const { player, loaded } = usePlayerData();
  const [emojiIndex, setEmojiIndex] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiIndex((i) => (i + 1) % EXPRESSION_EMOJIS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.titleBox}>
        <Text style={styles.titleJp}>{"\u9854 \u30D0 \u30C8 \u30EB"}</Text>
        <Text style={styles.titleEn}>FACE FIGHT</Text>
      </View>

      <Animated.Text style={[styles.emoji, { transform: [{ scale: pulseAnim }] }]}>
        {EXPRESSION_EMOJIS[emojiIndex]}
      </Animated.Text>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.push("/stage-select")}
      >
        <Text style={styles.mainButtonText}>{"\u25B6 \u30D0\u30C8\u30EB\u958B\u59CB"}</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/shop")}>
          <Text style={styles.subButtonText}>{"\uD83D\uDED2 \u30B7\u30E7\u30C3\u30D7"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/achievements")}>
          <Text style={styles.subButtonText}>{"\uD83C\uDFC6 \u5B9F\u7E3E"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/daily")}>
          <Text style={styles.subButtonText}>{"\uD83D\uDCC5 \u30C7\u30A4\u30EA\u30FC"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/settings")}>
          <Text style={styles.subButtonText}>{"\u2699\uFE0F \u8A2D\u5B9A"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coinBar}>
        <Text style={styles.coinText}>{"\uD83E\uDE99"} {loaded ? player.coins.toLocaleString() : "---"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titleBox: {
    borderWidth: 3,
    borderColor: "#e94560",
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginBottom: 20,
    backgroundColor: "rgba(233,69,96,0.1)",
  },
  titleJp: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 8,
  },
  titleEn: {
    fontSize: 18,
    color: "#e94560",
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: 4,
  },
  emoji: {
    fontSize: 64,
    marginVertical: 20,
  },
  mainButton: {
    backgroundColor: "#e94560",
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  subButton: {
    backgroundColor: "#16213e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
    minWidth: 140,
    alignItems: "center",
  },
  subButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  coinBar: {
    position: "absolute",
    bottom: 40,
    left: 20,
  },
  coinText: {
    color: "#ffd700",
    fontSize: 18,
    fontWeight: "bold",
  },
});
