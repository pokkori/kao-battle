import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getCapturedFace, clearCapturedFace } from "../lib/share/captureStore";
import { getStage, getNextStageId } from "../lib/battle/stageManager";
import { RankGrade } from "../types/player";
import { generateShareCard } from "../lib/share/generateShareCard";
import { useRanking } from "../hooks/useRanking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDailyChallenges, DailyChallenge } from "../lib/data/dailyChallenges";

const DAILY_CONSTRAINT_EXPRESSIONS_RESULT = ["angry", "surprise", "sad", "happy"] as const;
const EXPRESSION_EMOJIS_RESULT: Record<string, string> = {
  angry: "😡", surprise: "😲", sad: "😢", happy: "😊",
};
function getNextDailyConstraintEmoji(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const tomorrowIndex = (dayOfYear + 1) % 4;
  const expr = DAILY_CONSTRAINT_EXPRESSIONS_RESULT[tomorrowIndex];
  return EXPRESSION_EMOJIS_RESULT[expr] ?? "❓";
}

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
    dailyMode: string; dominantSkill: string; enragedKills: string;
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
  const dailyMode = params.dailyMode === "1";

  const DEFEAT_ADVICE: Record<string, string> = {
    punch: "もっと怒り顔を練習しよう！鏡で確認してみて",
    beam: "驚き顔が足りない！口をもっと大きく開けて",
    barrier: "笑顔でバリアを張り続けよう",
    heal: "回復タイミングが鍵！HP30%以下で優先して",
  };

  const stage = getStage(stageId);
  const nextStageId = getNextStageId(stageId);

  const { updateRanking } = useRanking();
  const [displayScore, setDisplayScore] = useState(0);
  const [shareText, setShareText] = useState<string | null>(null);
  const [todayEnragedKills, setTodayEnragedKills] = useState(0);
  const [capturedFace, setCapturedFaceState] = useState<string | null>(null);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [loginStreak, setLoginStreak] = useState(0);
  const [clearedChallenges, setClearedChallenges] = useState<DailyChallenge[]>([]);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const faceScaleAnim = React.useRef(new Animated.Value(0)).current;
  const starAnims = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Save to local ranking on clear
  useEffect(() => {
    if (won) {
      const today = new Date().toISOString().split("T")[0];
      updateRanking(stageId, score, rank, today);
    }
  }, []);

  // Enraged kills daily counter
  useEffect(() => {
    const updateEnragedKills = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const key = `@facefight/enragedKills/${today}`;
        const prev = parseInt((await AsyncStorage.getItem(key)) ?? "0", 10);
        const kills = parseInt(String(params.enragedKills ?? "0"), 10);
        if (kills > 0) {
          await AsyncStorage.setItem(key, String(prev + kills));
          setTodayEnragedKills(prev + kills);
        } else {
          setTodayEnragedKills(prev);
        }
      } catch {}
    };
    if (won) updateEnragedKills();
  }, []);

  // Daily streak tracking
  useEffect(() => {
    const updateStreak = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const lastPlayDate = await AsyncStorage.getItem("@facefight/lastPlayDate");
        const streakStr = await AsyncStorage.getItem("@facefight/loginStreak");
        let streak = parseInt(streakStr ?? "0", 10);
        if (lastPlayDate === null) {
          streak = 1;
        } else {
          const last = new Date(lastPlayDate);
          const now = new Date(today);
          const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000);
          if (diffDays === 1) {
            streak += 1;
          } else if (diffDays > 1) {
            streak = 1;
          }
          // diffDays === 0: same day, no change
        }
        await AsyncStorage.setItem("@facefight/lastPlayDate", today);
        await AsyncStorage.setItem("@facefight/loginStreak", String(streak));
        setLoginStreak(streak);
      } catch {
        // Silently fail
      }
    };
    updateStreak();
  }, []);

  // Daily challenge completion check & coin reward
  useEffect(() => {
    if (!won) return;
    const checkChallenges = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const challenges = getDailyChallenges(today);
        const elapsedSec = Math.floor(elapsed / 1000);
        const cleared: DailyChallenge[] = [];
        for (const ch of challenges) {
          if (ch.type === "combo_min" && maxCombo >= (ch.targetValue ?? 0)) {
            cleared.push(ch);
          } else if (ch.type === "time_limit" && won && elapsedSec <= (ch.targetValue ?? 9999)) {
            cleared.push(ch);
          } else if (ch.type === "defeat_count" && defeated >= (ch.targetValue ?? 0)) {
            cleared.push(ch);
          }
        }
        if (cleared.length === 0) return;
        // Prevent duplicate coin rewards
        const rewardKey = `@facefight/challengeRewards/${today}`;
        const rewardedRaw = await AsyncStorage.getItem(rewardKey);
        const alreadyRewarded: string[] = rewardedRaw ? JSON.parse(rewardedRaw) : [];
        const newlyCleared = cleared.filter((ch) => !alreadyRewarded.includes(ch.id));
        if (newlyCleared.length > 0) {
          const totalBonus = newlyCleared.reduce((sum, ch) => sum + (ch.coinReward ?? 0), 0);
          // Store rewarded IDs
          const updatedRewarded = [...alreadyRewarded, ...newlyCleared.map((ch) => ch.id)];
          await AsyncStorage.setItem(rewardKey, JSON.stringify(updatedRewarded));
          // Add coins to player data via AsyncStorage
          const coinKey = "@facefight/coins";
          const currentCoins = parseInt((await AsyncStorage.getItem(coinKey)) ?? "0", 10);
          await AsyncStorage.setItem(coinKey, String(currentCoins + totalBonus));
        }
        setClearedChallenges(cleared);
      } catch {}
    };
    checkChallenges();
  }, []);

  // Load captured face from captureStore (web only)
  useEffect(() => {
    if (Platform.OS === "web") {
      const face = getCapturedFace();
      if (face) {
        setCapturedFaceState(face);
        clearCapturedFace();
      }
    }
  }, []);

  // Generate OGP share card when face is available
  useEffect(() => {
    if (capturedFace && Platform.OS === "web" && won) {
      generateShareCard({
        faceImageDataUrl: capturedFace,
        stageName: stage?.name ?? stageId,
        rank,
        score,
        maxCombo,
        loginStreak,    // ← 追加（既存state変数を渡す）
      }).then((url) => {
        setShareCardUrl(url);
      }).catch(() => {
        // Silently fail
      });
    }
  }, [capturedFace, won]);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }).start();

    // Face photo pop-in animation
    if (capturedFace) {
      setTimeout(() => {
        Animated.spring(faceScaleAnim, { toValue: 1, tension: 60, friction: 4, useNativeDriver: true }).start();
      }, 600);
    }

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
  }, [score, capturedFace]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleShare = async () => {
    const stageName = stage?.name ?? stageId;
    const defeatEmoji = ["😤", "😩", "😭", "🤬"][Math.floor(Math.random() * 4)];
    const text = won
      ? `🔥 顔バトル\n${stageName} クリア！\nスコア${score.toLocaleString()} コンボ x${maxCombo}\nあなたも激怒撃破に挑戦？\nhttps://face-fight.vercel.app\n#顔バトル #FaceFight #表情ゲーム`
      : `${defeatEmoji} 顔バトル 撃沈...\n${stageName} でやられた！\nスコア${score.toLocaleString()} コンボ x${maxCombo}\n変顔でリベンジしてみて👇\nhttps://face-fight.vercel.app\n#顔バトル #FaceFight #変顔チャレンジ`;

    if (Platform.OS === "web") {
      // Try Web Share API with share card image
      if (shareCardUrl && navigator.share) {
        try {
          const response = await fetch(shareCardUrl);
          const blob = await response.blob();
          const file = new File([blob], "face-fight-result.jpg", { type: "image/jpeg" });
          await navigator.share({
            text,
            files: [file],
          });
          return;
        } catch {
          // Fall through to clipboard
        }
      }

      // Fallback: copy text to clipboard
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
      try {
        const { Share } = require("react-native");
        await Share.share({ message: text });
      } catch {}
    }
  };

  const handleDownloadCard = () => {
    if (!shareCardUrl || Platform.OS !== "web") return;
    try {
      const a = document.createElement("a");
      a.href = shareCardUrl;
      a.download = "face-fight-result.jpg";
      a.click();
    } catch {}
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

      {/* Share card preview (OGP card) */}
      {shareCardUrl && Platform.OS === "web" && (
        <View style={styles.shareCardContainer}>
          <img
            src={shareCardUrl}
            style={{
              width: 180,
              height: 320,
              borderRadius: 8,
              objectFit: "cover",
              border: "2px solid #e94560",
            } as any}
            alt="Share card"
          />
        </View>
      )}

      {/* Captured face photo (when no share card) */}
      {capturedFace && !shareCardUrl && Platform.OS === "web" && (
        <Animated.View style={[styles.capturedFaceContainer, { transform: [{ scale: faceScaleAnim }] }]}>
          <View style={styles.capturedFaceFrame}>
            <img
              src={capturedFace}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                objectFit: "cover",
              } as any}
              alt="Battle face"
            />
            <View style={styles.capturedFaceCorners}>
              <View style={[styles.capCorner, styles.capCornerTL]} />
              <View style={[styles.capCorner, styles.capCornerTR]} />
              <View style={[styles.capCorner, styles.capCornerBL]} />
              <View style={[styles.capCorner, styles.capCornerBR]} />
            </View>
          </View>
          <Text style={styles.capturedFaceLabel}>
            {won
              ? "\uD83C\uDFA5 \u3053\u306E\u9854\u3067\u52DD\u5229\uFF01"
              : "\uD83C\uDFA5 \u3053\u306E\u9854\u3067\u6226\u3063\u305F\uFF01"}
          </Text>
        </Animated.View>
      )}

      {/* Fallback flavor text when no captured face */}
      {(!capturedFace || Platform.OS !== "web") && (
        <View style={styles.battleFlavorBox}>
          <Text style={styles.battleFlavorText}>
            {won
              ? "\uD83C\uDFA5 \u3053\u306E\u5909\u9854\u3067\u52DD\u5229\u3092\u52DD\u3061\u53D6\u3063\u305F\uFF01"
              : "\uD83C\uDFA5 \u3053\u306E\u5909\u9854\u3067\u6226\u3063\u305F\u304C\u53CA\u3070\u305A..."}
          </Text>
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

      {/* Daily streak badge */}
      {loginStreak >= 2 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{"\uD83D\uDD25 "}{loginStreak}{"\u65E5\u9023\u7D9A\u30D7\u30EC\u30A4\u4E2D\uFF01"}</Text>
        </View>
      )}

      {/* Daily clear + tomorrow's constraint preview */}
      {dailyMode && won && (
        <View style={{
          backgroundColor: "rgba(255, 215, 0, 0.15)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#ffd700",
          alignItems: "center",
          width: "100%",
          maxWidth: 300,
        }}>
          <Text style={{ color: "#ffd700", fontSize: 15, fontWeight: "bold" }}>
            🗓 デイリークリア！
          </Text>
          <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4, textAlign: "center" }}>
            明日の縛り: {getNextDailyConstraintEmoji()} が使えるのみ！
          </Text>
        </View>
      )}

      {/* Daily challenge cleared banner */}
      {clearedChallenges.length > 0 && (
        <View style={{
          backgroundColor: "rgba(100, 220, 100, 0.15)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#64dc64",
          alignItems: "center",
          width: "100%",
          maxWidth: 300,
        }}>
          <Text style={{ color: "#64dc64", fontSize: 15, fontWeight: "bold" }}>
            📅 デイリーチャレンジ クリア！
          </Text>
          {clearedChallenges.map((ch) => (
            <Text key={ch.id} style={{ color: "#aaa", fontSize: 12, marginTop: 4, textAlign: "center" }}>
              {ch.description} (+🪙{ch.coinReward})
            </Text>
          ))}
        </View>
      )}

      {/* Share feedback */}
      {shareText && (
        <View style={styles.shareFeedback}>
          <Text style={styles.shareFeedbackText}>{shareText}</Text>
        </View>
      )}

      <View style={styles.buttons}>
        {/* Share button */}
        <TouchableOpacity style={won ? styles.shareBtn : styles.shareBtn_defeat} onPress={handleShare}>
          <Text style={styles.shareBtnText}>{won ? "📤 結果をシェア" : "😤 変顔をシェアして自慢する"}</Text>
        </TouchableOpacity>
        {won && (
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(255,215,0,0.15)",
              borderWidth: 1,
              borderColor: "#ffd700",
              borderRadius: 20,
              paddingVertical: 10,
              paddingHorizontal: 28,
              marginTop: 8,
            }}
            onPress={() => router.push("/shop")}
          >
            <Text style={{ color: "#ffd700", fontWeight: "bold", fontSize: 14, textAlign: "center" }}>
              🪙 コインでスキンを解放する
            </Text>
          </TouchableOpacity>
        )}

        {/* Download share card button */}
        {shareCardUrl && Platform.OS === "web" && (
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadCard}>
            <Text style={styles.downloadBtnText}>{"\uD83D\uDCBE \u30B7\u30A7\u30A2\u30AB\u30FC\u30C9\u4FDD\u5B58"}</Text>
          </TouchableOpacity>
        )}

        {/* X (Twitter) share button */}
        {Platform.OS === "web" && (
          <TouchableOpacity
            style={styles.twitterBtn}
            onPress={() => {
              const tweetText = won
                ? `🔥 顔バトル クリア！スコア${score.toLocaleString()} コンボ x${maxCombo}\nhttps://face-fight.vercel.app\n#顔バトル #FaceFight`
                : `😤 顔バトル で撃沈...スコア${score.toLocaleString()}\nhttps://face-fight.vercel.app\n#顔バトル #変顔チャレンジ`;
              if (typeof window !== "undefined") {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
              }
            }}
          >
            <Text style={styles.twitterBtnText}>𝕏 Xでシェア</Text>
          </TouchableOpacity>
        )}

        {won && nextStageId && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => router.replace({ pathname: "/battle", params: { stageId: nextStageId } })}
          >
            <Text style={styles.nextBtnText}>{"\u6B21\u306E\u30B9\u30C6\u30FC\u30B8 \u25B6"}</Text>
          </TouchableOpacity>
        )}

        {!won && DEFEAT_ADVICE[params.dominantSkill] && (
          <Text style={{ fontSize: 14, color: "#AAAAAA", textAlign: "center", marginTop: 8 }}>
            💡 {DEFEAT_ADVICE[params.dominantSkill]}
          </Text>
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
  // Share card preview
  shareCardContainer: {
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  // Captured face photo
  capturedFaceContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  capturedFaceFrame: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "#e94560",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f3460",
  },
  capturedFaceCorners: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  capCorner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: "#4fc3f7",
  },
  capCornerTL: { top: 2, left: 2, borderTopWidth: 2, borderLeftWidth: 2 },
  capCornerTR: { top: 2, right: 2, borderTopWidth: 2, borderRightWidth: 2 },
  capCornerBL: { bottom: 2, left: 2, borderBottomWidth: 2, borderLeftWidth: 2 },
  capCornerBR: { bottom: 2, right: 2, borderBottomWidth: 2, borderRightWidth: 2 },
  capturedFaceLabel: {
    color: "#e94560",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  rankBox: {
    borderWidth: 3, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 24,
  },
  rankText: { fontSize: 36, fontWeight: "bold" },
  stats: { width: "100%", maxWidth: 300, marginBottom: 20 },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  statLabel: { color: "#aaa", fontSize: 16 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  coinReward: { color: "#ffd700", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  streakBadge: {
    backgroundColor: "rgba(255, 100, 0, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ff6400",
  },
  streakText: { color: "#ff6400", fontSize: 14, fontWeight: "bold", textAlign: "center" },
  battleFlavorBox: {
    backgroundColor: "rgba(233,69,96,0.1)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(233,69,96,0.3)",
  },
  battleFlavorText: { color: "#e94560", fontSize: 14, fontWeight: "bold", textAlign: "center" },
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
  shareBtn_defeat: {
    backgroundColor: "rgba(233,69,96,0.2)",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#e94560",
  },
  shareBtnText: { color: "#4fc3f7", fontSize: 16, fontWeight: "bold" },
  downloadBtn: {
    backgroundColor: "#16213e",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e94560",
  },
  downloadBtnText: { color: "#e94560", fontSize: 14, fontWeight: "bold" },
  nextBtn: { backgroundColor: "#e94560", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  nextBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  retryBtn: { backgroundColor: "#e94560", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  retryBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backBtn: { backgroundColor: "#333", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  backBtnText: { color: "#fff", fontSize: 14 },
  twitterBtn: { backgroundColor: "#000", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, marginTop: 8 },
  twitterBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
