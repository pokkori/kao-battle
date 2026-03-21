import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getStage, getNextStageId } from "../lib/battle/stageManager";
import { RankGrade } from "../types/player";

const RANK_COLORS: Record<RankGrade, string> = {
  S: "#ffd700", A: "#4CAF50", B: "#2196F3", C: "#9e9e9e", D: "#795548",
};

const RANK_EMOJIS: Record<RankGrade, string> = {
  S: "\u2B50", A: "\uD83D\uDD25", B: "\uD83D\uDCAA", C: "\uD83D\uDC4D", D: "\uD83D\uDE24",
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
  const [shareText, setShareText] = useState<string | null>(null);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const starAnims = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

    // Star animations (staggered)
    const starCount = rank === "S" ? 3 : rank === "A" ? 3 : rank === "B" ? 2 : rank === "C" ? 1 : 0;
    starAnims.forEach((anim, i) => {
      if (i < starCount) {
        setTimeout(() => {
          Animated.spring(anim, { toValue: 1, tension: 80, friction: 4, useNativeDriver: true }).start();
        }, 400 + i * 200);
      }
    });

    return () => clearInterval(interval);
  }, [score]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleShare = async () => {
    const stageName = stage?.name ?? stageId;
    const text = `\u9854\u30D0\u30C8\u30EB ${stageName} ${won ? "\u30AF\u30EA\u30A2\uFF01" : "\u6311\u6226\u4E2D..."}\n${RANK_EMOJIS[rank]} \u30E9\u30F3\u30AF${rank} \uD83D\uDC4A\u30B9\u30B3\u30A2${score.toLocaleString()}\n\u30B3\u30F3\u30DC x${maxCombo} | \u6483\u7834 ${defeated}/${total}\n#\u9854\u30D0\u30C8\u30EB #FaceFight`;

    if (Platform.OS === "web") {
      // Web: copy to clipboard
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          setShareText("\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\uFF01");
          setTimeout(() => setShareText(null), 2000);
        }
      } catch {
        setShareText(text);
        setTimeout(() => setShareText(null), 5000);
      }
    } else {
      // Native: use Share API
      try {
        const { Share } = require("react-native");
        await Share.share({ message: text });
      } catch {}
    }
  };

  const starCount = rank === "S" ? 3 : rank === "A" ? 3 : rank === "B" ? 2 : rank === "C" ? 1 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {won ? "\uD83C\uDF89 STAGE CLEAR!" : "DEFEATED..."}
      </Text>

      {/* Star display */}
      {won && (
        <View style={styles.starsRow}>
          {[0, 1, 2].map((i) => (
            <Animated.Text
              key={i}
              style={[
                styles.star,
                {
                  transform: [{ scale: starAnims[i] }],
                  opacity: i < starCount ? 1 : 0.2,
                  color: i < starCount ? "#ffd700" : "#555",
                },
              ]}
            >
              {"\u2605"}
            </Animated.Text>
          ))}
        </View>
      )}

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

      {/* Share feedback */}
      {shareText && (
        <View style={styles.shareFeedback}>
          <Text style={styles.shareFeedbackText}>{shareText}</Text>
        </View>
      )}

      <View style={styles.buttons}>
        {/* Share button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>{"\uD83D\uDCE4 \u7D50\u679C\u3092\u30B7\u30A7\u30A2"}</Text>
        </TouchableOpacity>

        {won && nextStageId && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => router.replace({ pathname: "/battle", params: { stageId: nextStageId } })}
          >
            <Text style={styles.nextBtnText}>{"\u6B21\u306E\u30B9\u30C6\u30FC\u30B8 \u25B6"}</Text>
          </TouchableOpacity>
        )}

        {!won && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.replace({ pathname: "/battle", params: { stageId } })}
          >
            <Text style={styles.retryBtnText}>{"\uD83D\uDD04 \u30EA\u30C8\u30E9\u30A4"}</Text>
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
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  starsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  star: { fontSize: 36, fontWeight: "bold" },
  rankBox: {
    borderWidth: 3, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 24,
  },
  rankText: { fontSize: 36, fontWeight: "bold" },
  stats: { width: "100%", maxWidth: 300, marginBottom: 20 },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  statLabel: { color: "#aaa", fontSize: 16 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  coinReward: { color: "#ffd700", fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  shareFeedback: {
    backgroundColor: "rgba(79,195,247,0.2)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },
  shareFeedbackText: { color: "#4fc3f7", fontSize: 14 },
  buttons: { gap: 12, alignItems: "center" },
  shareBtn: {
    backgroundColor: "#0f3460",
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#4fc3f7",
  },
  shareBtnText: { color: "#4fc3f7", fontSize: 16, fontWeight: "bold" },
  nextBtn: { backgroundColor: "#e94560", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  nextBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  retryBtn: { backgroundColor: "#e94560", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  retryBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backBtn: { backgroundColor: "#333", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  backBtnText: { color: "#fff", fontSize: 14 },
});
