import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getStage, getNextStageId } from "../lib/battle/stageManager";
import { RankGrade } from "../types/player";

const RANK_COLORS: Record<RankGrade, string> = {
  S: "#ffd700", A: "#4CAF50", B: "#2196F3", C: "#9e9e9e", D: "#795548",
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    stageId: string; won: string; score: string; maxCombo: string;
    defeated: string; total: string; elapsed: string; rank: string; coins: string;
  }>();

  const stageId = params.stageId ?? "stage_1_1";
  const won = params.won === "1";
  const score = parseInt(params.score ?? "0", 10);
  const maxCombo = parseInt(params.maxCombo ?? "0", 10);
  const defeated = parseInt(params.defeated ?? "0", 10);
  const total = parseInt(params.total ?? "0", 10);
  const elapsed = parseInt(params.elapsed ?? "0", 10);
  const rank = (params.rank as RankGrade) ?? "D";
  const coins = parseInt(params.coins ?? "0", 10);

  const stage = getStage(stageId);
  const nextStageId = getNextStageId(stageId);

  const [displayScore, setDisplayScore] = useState(0);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }).start();

    // Score count-up
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [score]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {won ? "\uD83C\uDF89 STAGE CLEAR!" : "DEFEATED..."}
      </Text>

      <Animated.View style={[styles.rankBox, { transform: [{ scale: scaleAnim }], borderColor: RANK_COLORS[rank] }]}>
        <Text style={[styles.rankText, { color: RANK_COLORS[rank] }]}>RANK: {rank}</Text>
      </Animated.View>

      <View style={styles.stats}>
        <StatRow label={"\u30B9\u30B3\u30A2"} value={displayScore.toLocaleString()} />
        <StatRow label={"\u6700\u5927\u30B3\u30F3\u30DC"} value={`x${maxCombo}`} />
        <StatRow label={"\u6483\u7834\u6570"} value={`${defeated}/${total}`} />
        <StatRow label={"\u30AF\u30EA\u30A2\u6642\u9593"} value={formatTime(elapsed)} />
      </View>

      <Text style={styles.coinReward}>{"\u7372\u5F97: \uD83E\uDE99 "}{coins.toLocaleString()}</Text>

      <View style={styles.buttons}>
        {won && nextStageId && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => router.replace({ pathname: "/battle", params: { stageId: nextStageId } })}
          >
            <Text style={styles.nextBtnText}>{"\u6B21\u306E\u30B9\u30C6\u30FC\u30B8 \u25B6"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/stage-select")}>
          <Text style={styles.backBtnText}>{"\u30B9\u30C6\u30FC\u30B8\u9078\u629E\u306B\u623B\u308B"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  rankBox: {
    borderWidth: 3, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 24,
  },
  rankText: { fontSize: 36, fontWeight: "bold" },
  stats: { width: "100%", maxWidth: 300, marginBottom: 20 },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  statLabel: { color: "#aaa", fontSize: 16 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  coinReward: { color: "#ffd700", fontSize: 20, fontWeight: "bold", marginBottom: 24 },
  buttons: { gap: 12, alignItems: "center" },
  nextBtn: { backgroundColor: "#e94560", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  nextBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backBtn: { backgroundColor: "#333", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  backBtnText: { color: "#fff", fontSize: 14 },
});
