import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlayerData } from "../hooks/useStorage";
import { ALL_SHOP_ITEMS } from "../lib/data/shopItems";
import { ShopCategory } from "../types/shop";

const CATEGORIES: { key: ShopCategory | "all" | "coin_pack"; label: string }[] = [
  { key: "all", label: "\u5168\u3066" },
  { key: "coin_pack", label: "\uD83E\uDE99 \u30B3\u30A4\u30F3" },
  { key: "punch_effect", label: "\u30D1\u30F3\u30C1" },
  { key: "barrier_skin", label: "\u30D0\u30EA\u30A2" },
  { key: "beam_effect", label: "\u30D3\u30FC\u30E0" },
  { key: "title", label: "\u79F0\u53F7" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#9e9e9e", rare: "#2196F3", epic: "#9C27B0", legendary: "#ffd700",
};

const COIN_PACKS = [
  { id: "coin_300", label: "300\u30B3\u30A4\u30F3", coins: 300, price: "\u00A5300" },
  { id: "coin_1000", label: "1000\u30B3\u30A4\u30F3", coins: 1000, price: "\u00A5800" },
];

const KOMOJU_URL_300 = ""; // 審査通過後に設定
const KOMOJU_URL_1000 = ""; // 審査通過後に設定

export default function ShopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { player, update, loaded } = usePlayerData();
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | "all" | "coin_pack">("all");

  useEffect(() => {
    if (params.tab === "coin_pack") {
      setSelectedCategory("coin_pack");
    }
  }, [params.tab]);

  const items = selectedCategory === "all"
    ? ALL_SHOP_ITEMS
    : selectedCategory === "coin_pack"
    ? []
    : ALL_SHOP_ITEMS.filter((i) => i.category === selectedCategory);

  const purchase = (itemId: string) => {
    const item = ALL_SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    if (player.purchasedItems.includes(itemId)) {
      // Equip
      update((prev) => {
        const next = { ...prev };
        if (item.category === "punch_effect") next.equippedPunchEffect = itemId;
        else if (item.category === "barrier_skin") next.equippedBarrierSkin = itemId;
        else if (item.category === "beam_effect") next.equippedBeamEffect = itemId;
        else if (item.category === "title") next.equippedTitle = itemId;
        return next;
      });
      return;
    }
    if (item.currency === "iap") {
      router.push({ pathname: "/shop", params: { tab: "coin_pack" } } as any);
      return;
    }
    if (item.price > 0 && player.coins < item.price) {
      Alert.alert("\u30B3\u30A4\u30F3\u4E0D\u8DB3", "\u30B3\u30A4\u30F3\u304C\u8DB3\u308A\u307E\u305B\u3093\u3002");
      return;
    }
    update((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
      purchasedItems: [...prev.purchasedItems, itemId],
    }));
  };

  const handleKomojuPurchase = (packId: string) => {
    const url = packId === "coin_300" ? KOMOJU_URL_300 : packId === "coin_1000" ? KOMOJU_URL_1000 : "";
    if (!url) {
      Alert.alert(
        "\uD83D\uDCF1 \u30D5\u30A9\u30ED\u30FC\u3057\u3066\u306D",
        "\u65B0\u6A5F\u80FD\u30FB\u30AD\u30E3\u30F3\u30DA\u30FC\u30F3\u60C5\u5831\u306FX\u3067\u304A\u77E5\u3089\u305B\u3057\u307E\u3059\uFF01\n@face_fight_game",
        [{ text: "OK" }]
      );
      return;
    }
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url);
    }
  };

  const isOwned = (id: string) => player.purchasedItems.includes(id) || id.startsWith("default_");
  const isEquipped = (id: string) =>
    id === player.equippedPunchEffect ||
    id === player.equippedBarrierSkin ||
    id === player.equippedBeamEffect ||
    id === player.equippedTitle;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>{"\u2190 \u623B\u308B"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"\u30B7\u30E7\u30C3\u30D7"}</Text>
        <Text style={styles.coinText}>{"\uD83E\uDE99 "}{loaded ? player.coins.toLocaleString() : "---"}</Text>
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

      <ScrollView contentContainerStyle={styles.itemList}>
        {selectedCategory === "coin_pack" && (
          <>
            {COIN_PACKS.map((pack) => (
              <View key={pack.id} style={styles.coinPackCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.coinPackName}>{"\uD83E\uDE99 "}{pack.label}</Text>
                  <Text style={styles.itemDesc}>{pack.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => handleKomojuPurchase(pack.id)}
                >
                  <Text style={styles.buyBtnText}>{pack.price}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
        {selectedCategory !== "coin_pack" && items.map((item) => {
          const owned = isOwned(item.id);
          const equipped = isEquipped(item.id);
          return (
            <View key={item.id} style={[styles.itemCard, { borderColor: RARITY_COLORS[item.rarity] }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: RARITY_COLORS[item.rarity] }]}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={[styles.rarity, { color: RARITY_COLORS[item.rarity] }]}>
                  {item.rarity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.itemAction}>
                {equipped ? (
                  <Text style={styles.equippedLabel}>{"\u88C5\u5099\u4E2D"}</Text>
                ) : owned ? (
                  <TouchableOpacity style={styles.equipBtn} onPress={() => purchase(item.id)}>
                    <Text style={styles.equipBtnText}>{"\u88C5\u5099"}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.buyBtn} onPress={() => purchase(item.id)}>
                    <Text style={styles.buyBtnText}>
                      {item.currency === "iap" ? (item.iapProductId ? "\u00A5---" : "\u8AB2\u91D1") : `\uD83E\uDE99 ${item.price}`}
                    </Text>
                  </TouchableOpacity>
                )}
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
  },
  backBtn: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  coinText: { color: "#ffd700", fontSize: 16, fontWeight: "bold" },
  tabBar: { maxHeight: 44, paddingHorizontal: 12 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderRadius: 20, backgroundColor: "#16213e",
  },
  tabActive: { backgroundColor: "#e94560" },
  tabText: { color: "#aaa", fontSize: 14 },
  tabTextActive: { color: "#fff", fontWeight: "bold" },
  itemList: { padding: 16, gap: 12, paddingBottom: 40 },
  itemCard: {
    flexDirection: "row", backgroundColor: "#16213e", borderRadius: 12,
    borderWidth: 1, padding: 12, alignItems: "center",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "bold" },
  itemDesc: { color: "#aaa", fontSize: 12, marginTop: 2 },
  rarity: { fontSize: 10, marginTop: 4, fontWeight: "bold" },
  itemAction: { marginLeft: 12 },
  buyBtn: { backgroundColor: "#0f3460", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buyBtnText: { color: "#ffd700", fontWeight: "bold", fontSize: 14 },
  equipBtn: { backgroundColor: "#4CAF50", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  equipBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  equippedLabel: { color: "#4CAF50", fontWeight: "bold", fontSize: 14 },
  coinPackCard: {
    flexDirection: "row", backgroundColor: "#16213e", borderRadius: 12,
    borderWidth: 2, borderColor: "#ffd700", padding: 16, alignItems: "center",
  },
  coinPackName: { fontSize: 18, fontWeight: "bold", color: "#ffd700" },
});
