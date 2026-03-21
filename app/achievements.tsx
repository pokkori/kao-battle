import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { usePlayerData } from "../hooks/useStorage";
import { ACHIEVEMENTS } from "../lib/data/achievements";
import { AchievementCategory } from "../types/achievement";

const CATEGORIES: { key: AchievementCategory | "all"; label: string }[] = [
  { key: "all", label: "\u5168\u3066" },
  { key: "battle", label: "\u30D0\u30C8\u30EB" },
  { key: "expression", label: "\u8868\u60C5" },
  { key: "collection", label: "\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3" },
  { key: "challenge", label: "\u30C1\u30E3\u30EC\u30F3\u30B8" },
  { key: "social", label: "\u30BD\u30FC\u30B7\u30E3\u30EB" },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { player, loaded } = usePlayerData();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");

  const filtered = selectedCategory === "all"
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const unlockedCount = player.unlockedAchievements.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>{"\u2190 \u623B\u308B"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"\u5B9F\u7E3E"} ({unlockedCount}/{ACHIEVEMENTS.length})</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, selectedCategory === cat.key && styles.tabActive]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={[styles.tabText, selectedCategory === cat.key && styles.tabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((ach) => {
          const unlocked = player.unlockedAchievements.includes(ach.id);
          const isHidden = ach.hidden && !unlocked;

          return (
            <View key={ach.id} style={[styles.card, unlocked && styles.cardUnlocked]}>
              {isHidden ? (
                <>
                  <Text style={styles.hiddenIcon}>{"\u2753"}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.hiddenName}>{"\uFF1F\uFF1F\uFF1F"}</Text>
                    <Text style={styles.hiddenDesc}>{"\uFF08\u96A0\u3057\u5B9F\u7E3E\uFF09"}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.icon}>{unlocked ? "\uD83C\uDFC6" : "\u26AA"}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.name, unlocked && styles.nameUnlocked]}>{ach.name}</Text>
                    <Text style={styles.desc}>{ach.description}</Text>
                    <Text style={styles.reward}>{"\uD83E\uDE99 "}{ach.coinReward}</Text>
                  </View>
                  {unlocked && <Text style={styles.checkMark}>{"\u2705"}</Text>}
                </>
              )}
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
  },
  backBtn: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  tabBar: { maxHeight: 44, paddingHorizontal: 12 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 6,
    borderRadius: 20, backgroundColor: "#16213e",
  },
  tabActive: { backgroundColor: "#e94560" },
  tabText: { color: "#aaa", fontSize: 13 },
  tabTextActive: { color: "#fff", fontWeight: "bold" },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    flexDirection: "row", backgroundColor: "#16213e", borderRadius: 12,
    padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#0f3460",
  },
  cardUnlocked: { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.05)" },
  icon: { fontSize: 28, marginRight: 12 },
  hiddenIcon: { fontSize: 28, marginRight: 12 },
  cardInfo: { flex: 1 },
  name: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  nameUnlocked: { color: "#4CAF50" },
  hiddenName: { color: "#666", fontSize: 16, fontWeight: "bold" },
  desc: { color: "#aaa", fontSize: 12, marginTop: 2 },
  hiddenDesc: { color: "#555", fontSize: 12, marginTop: 2 },
  reward: { color: "#ffd700", fontSize: 12, marginTop: 4 },
  checkMark: { fontSize: 20, marginLeft: 8 },
});
