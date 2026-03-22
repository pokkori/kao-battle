import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import Svg, { Circle, Path, Ellipse, Rect, Line } from "react-native-svg";
import { useRouter } from "expo-router";
import { usePlayerData } from "../hooks/useStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FaceExpr = "angry" | "happy" | "surprise" | "sad";

function FaceCharSVG({ expr }: { expr: FaceExpr }) {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* 顔ベース */}
      <Circle cx="60" cy="60" r="55" fill="#FFD700" stroke="#e94560" strokeWidth="3" />
      {/* 目（surpriseの場合はサイズが違うのでexprで分岐） */}
      {expr === "surprise" ? (
        <>
          <Ellipse cx="42" cy="50" rx="9" ry="11" fill="#1a1a2e" />
          <Ellipse cx="78" cy="50" rx="9" ry="11" fill="#1a1a2e" />
        </>
      ) : (
        <>
          <Ellipse cx="42" cy="50" rx="6" ry="7" fill="#1a1a2e" />
          <Ellipse cx="78" cy="50" rx="6" ry="7" fill="#1a1a2e" />
        </>
      )}
      {/* 表情別の眉・口 */}
      {expr === "angry" && (
        <>
          <Path d="M32,35 L50,40" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round"/>
          <Path d="M70,40 L88,35" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round"/>
          <Path d="M42,80 Q60,68 78,80" stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </>
      )}
      {expr === "happy" && (
        <>
          <Path d="M32,38 L50,38" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/>
          <Path d="M70,38 L88,38" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/>
          <Path d="M42,72 Q60,88 78,72" stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </>
      )}
      {expr === "surprise" && (
        <Ellipse cx="60" cy="80" rx="10" ry="12" fill="#1a1a2e" />
      )}
      {expr === "sad" && (
        <>
          <Path d="M32,38 L50,34" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/>
          <Path d="M70,34 L88,38" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/>
          <Path d="M42,80 Q60,68 78,80" stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </>
      )}
    </Svg>
  );
}

const EXPRESSIONS: FaceExpr[] = ["angry", "happy", "surprise", "sad"];

export default function TitleScreen() {
  const router = useRouter();
  const { player, loaded } = usePlayerData();
  const [exprIndex, setExprIndex] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [loginStreak, setLoginStreak] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem("@facefight/loginStreak").then((val) => {
      if (val) setLoginStreak(parseInt(val, 10));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setExprIndex((i) => (i + 1) % EXPRESSIONS.length);
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

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <FaceCharSVG expr={EXPRESSIONS[exprIndex]} />
      </Animated.View>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.push("/stage-select")}
      >
        <Text style={styles.mainButtonText}>{"\u25B6 \u30D0\u30C8\u30EB\u958B\u59CB"}</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/shop")}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path d="M2,3 L4,3 L6,12 L14,12 L16,5 L5,5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <Circle cx="7" cy="15" r="1.5" fill="#fff"/>
              <Circle cx="13" cy="15" r="1.5" fill="#fff"/>
            </Svg>
            <Text style={styles.subButtonText}>{"\u30B7\u30E7\u30C3\u30D7"}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/achievements")}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path d="M5,2 L13,2 L13,10 Q13,15 9,16 Q5,15 5,10 Z" stroke="#ffd700" strokeWidth="1.5" fill="rgba(255,215,0,0.2)"/>
              <Path d="M5,5 L2,5 L2,8 Q2,11 5,11" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
              <Path d="M13,5 L16,5 L16,8 Q16,11 13,11" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
              <Rect x="7" y="14" width="4" height="3" rx="1" fill="#ffd700"/>
            </Svg>
            <Text style={styles.subButtonText}>{"\u5B9F\u7E3E"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/daily")}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Rect x="2" y="3" width="14" height="13" rx="2" stroke="#fff" strokeWidth="1.5" fill="none"/>
              <Path d="M2,7 L16,7" stroke="#fff" strokeWidth="1"/>
              <Rect x="6" y="1" width="2" height="4" rx="1" fill="#fff"/>
              <Rect x="10" y="1" width="2" height="4" rx="1" fill="#fff"/>
            </Svg>
            <Text style={styles.subButtonText}>{"\u30C7\u30A4\u30EA\u30FC"}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.subButton} onPress={() => router.push("/settings")}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Circle cx="9" cy="9" r="3" stroke="#fff" strokeWidth="1.5" fill="none"/>
              <Path d="M9,1 L9,4 M9,14 L9,17 M1,9 L4,9 M14,9 L17,9 M3,3 L5.1,5.1 M12.9,12.9 L15,15 M15,3 L12.9,5.1 M5.1,12.9 L3,15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </Svg>
            <Text style={styles.subButtonText}>{"\u8A2D\u5B9A"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.coinBar}>
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Circle cx="10" cy="10" r="8" fill="#ffd700" stroke="#e0a000" strokeWidth="1.5"/>
          </Svg>
          <Text style={styles.coinText}>{loaded ? player.coins.toLocaleString() : "---"}</Text>
        </View>
      </View>
      {loginStreak >= 2 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>STREAK {loginStreak}日連続！</Text>
        </View>
      )}
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
  streakBadge: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "rgba(255, 100, 0, 0.18)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#ff6400",
  },
  streakText: {
    color: "#ff6400",
    fontSize: 14,
    fontWeight: "bold",
  },
});
