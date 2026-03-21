import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { usePlayerData } from "../hooks/useStorage";
import { getDailyChallenges, LOGIN_BONUSES } from "../lib/data/dailyChallenges";

export default function DailyScreen() {
  const router = useRouter();
  const { player, update, loaded } = usePlayerData();

  const today = new Date().toISOString().split("T")[0];
  const challenges = useMemo(() => getDailyChallenges(today), [today]);
  const streak = player.dailyStreak;
  const isCompletedToday = player.lastDailyDate === today;

  const claimLogin = () => {
    if (isCompletedToday) return;
    const dayIndex = streak % 7;
    const bonus = LOGIN_BONUSES[dayIndex];
    update((prev) => ({
      ...prev,
      coins: prev.coins + bonus,
      totalCoins: prev.totalCoins + bonus,
      dailyStreak: prev.lastDailyDate === getPreviousDate(today) ? prev.dailyStreak + 1 : 1,
      lastDailyDate: today,
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>{"\u2190 \u623B\u308B"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"\u30C7\u30A4\u30EA\u30FC\u30C1\u30E3\u30EC\u30F3\u30B8"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.date}>{"\uD83D\uDCC5 "}{today}</Text>
        <Text style={styles.streak}>{"\uD83D\uDD25 \u9023\u7D9A "}{streak}{"\u65E5\u76EE!"}</Text>

        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u4ECA\u65E5\u306E\u30C1\u30E3\u30EC\u30F3\u30B8 \u2500\u2500"}</Text>

        {challenges.map((ch, idx) => (
          <View key={ch.id} style={styles.challengeCard}>
            <Text style={styles.missionLabel}>{"\u30DF\u30C3\u30B7\u30E7\u30F3"}{idx + 1}:</Text>
            <Text style={styles.missionText}>{ch.description}</Text>
            <Text style={styles.reward}>{"\u5831\u916C: \uD83E\uDE99 "}{ch.coinReward}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u9023\u7D9A\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9 \u2500\u2500"}</Text>

        <View style={styles.loginRow}>
          {LOGIN_BONUSES.map((bonus, i) => {
            const done = streak > i || (streak === i + 1 && isCompletedToday);
            const isToday = streak % 7 === i && !isCompletedToday;
            return (
              <View key={i} style={[styles.loginDay, done && styles.loginDone, isToday && styles.loginToday]}>
                <Text style={styles.loginDayNum}>{i + 1}</Text>
                <Text style={styles.loginDayReward}>{"\uD83E\uDE99"}{bonus}</Text>
                {done && <Text style={styles.checkMark}>{"\u2713"}</Text>}
              </View>
            );
          })}
        </View>

        {!isCompletedToday && (
          <TouchableOpacity style={styles.claimBtn} onPress={claimLogin}>
            <Text style={styles.claimBtnText}>{"\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u3092\u53D7\u3051\u53D6\u308B"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.push({ pathname: "/battle", params: { stageId: "stage_1_1", dailyMode: "1" } })}
        >
          <Text style={styles.startBtnText}>{"\u25B6 \u30C1\u30E3\u30EC\u30F3\u30B8\u958B\u59CB"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
  },
  backBtn: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  scroll: { padding: 16, paddingBottom: 40 },
  date: { color: "#aaa", fontSize: 16, textAlign: "center" },
  streak: { color: "#ff9800", fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 4 },
  sectionTitle: { color: "#fff", fontSize: 16, textAlign: "center", marginVertical: 16 },
  challengeCard: {
    backgroundColor: "#16213e", borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#0f3460",
  },
  missionLabel: { color: "#e94560", fontSize: 14, fontWeight: "bold" },
  missionText: { color: "#fff", fontSize: 16, marginTop: 4 },
  reward: { color: "#ffd700", fontSize: 14, marginTop: 6 },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  loginDay: {
    width: 44, height: 60, borderRadius: 8, backgroundColor: "#16213e",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#333",
  },
  loginDone: { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.1)" },
  loginToday: { borderColor: "#ffd700", backgroundColor: "rgba(255,215,0,0.1)" },
  loginDayNum: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  loginDayReward: { color: "#ffd700", fontSize: 10 },
  checkMark: { color: "#4CAF50", fontSize: 14, fontWeight: "bold" },
  claimBtn: {
    backgroundColor: "#ffd700", paddingVertical: 14, paddingHorizontal: 30,
    borderRadius: 25, alignSelf: "center", marginTop: 16,
  },
  claimBtnText: { color: "#1a1a2e", fontSize: 16, fontWeight: "bold" },
  startBtn: {
    backgroundColor: "#e94560", paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 25, alignSelf: "center", marginTop: 20,
  },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
