import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { STAGES } from "../lib/data/stages";
import { getWorldName } from "../lib/battle/stageManager";
import { usePlayerData } from "../hooks/useStorage";

const WORLD_COLORS: Record<number, string> = {
  1: "#8B4513", 2: "#DC143C", 3: "#FF69B4", 4: "#4169E1", 5: "#9932CC",
};

export default function StageSelectScreen() {
  const router = useRouter();
  const { player, loaded } = usePlayerData();

  const worlds = [1, 2, 3, 4, 5];

  const isUnlocked = (stageId: string): boolean => {
    if (!loaded) return false;
    return player.unlockedStages.includes(stageId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>{"\u2190 \u623B\u308B"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"\u30B9\u30C6\u30FC\u30B8\u9078\u629E"}</Text>
        <TouchableOpacity onPress={() => router.push("/achievements" as any)}>
          <Text style={styles.rankingBtn}>{"\uD83C\uDFC6 \u8A18\u9332"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {worlds.map((world) => {
          const worldStages = STAGES.filter((s) => s.world === world);
          return (
            <View key={world} style={styles.worldSection}>
              <Text style={[styles.worldTitle, { color: WORLD_COLORS[world] || "#fff" }]}>
                {`\u2500\u2500 W${world}: ${getWorldName(world)} \u2500\u2500`}
              </Text>
              <View style={styles.stageGrid}>
                {worldStages.map((stage) => {
                  const unlocked = isUnlocked(stage.id);
                  const rank = player.stageRanks[stage.id];
                  return (
                    <TouchableOpacity
                      key={stage.id}
                      style={[
                        styles.stageCard,
                        { borderColor: unlocked ? WORLD_COLORS[world] || "#555" : "#333" },
                        !unlocked && styles.locked,
                      ]}
                      disabled={!unlocked}
                      onPress={() => router.push({ pathname: "/battle", params: { stageId: stage.id } })}
                    >
                      <Text style={styles.stageNum}>
                        {stage.bossId ? "BOSS" : `${stage.world}-${stage.stageNumber}`}
                      </Text>
                      {unlocked ? (
                        <>
                          <Text style={styles.stageName}>{stage.name}</Text>
                          {rank && <Text style={styles.rank}>{rank}</Text>}
                        </>
                      ) : (
                        <Text style={styles.lockIcon}>{"\uD83D\uDD12"}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  backBtn: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  rankingBtn: { color: "#ffd700", fontSize: 14, fontWeight: "bold" },
  scroll: { paddingBottom: 40, paddingHorizontal: 16 },
  worldSection: { marginBottom: 24 },
  worldTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  stageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  stageCard: {
    width: 90, height: 90, borderRadius: 12, borderWidth: 2,
    backgroundColor: "#16213e", alignItems: "center", justifyContent: "center",
  },
  locked: { opacity: 0.4 },
  stageNum: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  stageName: { color: "#aaa", fontSize: 10, marginTop: 2, textAlign: "center" },
  rank: { color: "#ffd700", fontSize: 20, fontWeight: "bold", marginTop: 2 },
  lockIcon: { fontSize: 24, marginTop: 4 },
});
