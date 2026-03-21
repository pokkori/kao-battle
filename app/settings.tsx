import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSettings, usePlayerData } from "../hooks/useStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update, loaded } = useSettings();
  const { update: updatePlayer } = usePlayerData();

  const toggleSetting = (key: "hapticsEnabled" | "showCameraPreview" | "showFaceMesh" | "autoSaveScreenshots") => {
    update({ [key]: !settings[key] });
  };

  const adjustVolume = (key: "bgmVolume" | "seVolume", delta: number) => {
    const current = settings[key];
    const next = Math.max(0, Math.min(1, current + delta));
    update({ [key]: Math.round(next * 10) / 10 });
  };

  const adjustSensitivity = (delta: number) => {
    const next = Math.max(0.5, Math.min(2.0, settings.expressionSensitivity + delta));
    update({ expressionSensitivity: Math.round(next * 10) / 10 });
  };

  const resetData = () => {
    Alert.alert(
      "\u30C7\u30FC\u30BF\u30EA\u30BB\u30C3\u30C8",
      "\u5168\u3066\u306E\u30C7\u30FC\u30BF\u304C\u524A\u9664\u3055\u308C\u307E\u3059\u3002\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F",
      [
        { text: "\u30AD\u30E3\u30F3\u30BB\u30EB", style: "cancel" },
        {
          text: "\u30EA\u30BB\u30C3\u30C8",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("\u5B8C\u4E86", "\u30C7\u30FC\u30BF\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F\u3002");
          },
        },
      ]
    );
  };

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>{"\u2190 \u623B\u308B"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"\u8A2D\u5B9A"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u30B5\u30A6\u30F3\u30C9 \u2500\u2500"}</Text>

        <VolumeRow
          label="BGM\u97F3\u91CF"
          value={settings.bgmVolume}
          onDecrease={() => adjustVolume("bgmVolume", -0.1)}
          onIncrease={() => adjustVolume("bgmVolume", 0.1)}
        />
        <VolumeRow
          label="SE\u97F3\u91CF"
          value={settings.seVolume}
          onDecrease={() => adjustVolume("seVolume", -0.1)}
          onIncrease={() => adjustVolume("seVolume", 0.1)}
        />

        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u30B2\u30FC\u30E0\u30D7\u30EC\u30A4 \u2500\u2500"}</Text>

        <ToggleRow label={"\u632F\u52D5"} value={settings.hapticsEnabled} onToggle={() => toggleSetting("hapticsEnabled")} />
        <ToggleRow label={"\u30AB\u30E1\u30E9\u8868\u793A"} value={settings.showCameraPreview} onToggle={() => toggleSetting("showCameraPreview")} />

        <VolumeRow
          label={"\u8868\u60C5\u611F\u5EA6"}
          value={settings.expressionSensitivity}
          onDecrease={() => adjustSensitivity(-0.1)}
          onIncrease={() => adjustSensitivity(0.1)}
          max={2.0}
        />

        <ToggleRow label="Face Mesh" value={settings.showFaceMesh} onToggle={() => toggleSetting("showFaceMesh")} />

        <TouchableOpacity
          style={calibrationStyles.calibrateBtn}
          onPress={() => {
            Alert.alert("\u30AD\u30E3\u30EA\u30D6\u30EC\u30FC\u30B7\u30E7\u30F3", "\u6B21\u56DE\u306E\u30D0\u30C8\u30EB\u958B\u59CB\u6642\u306B\u30AD\u30E3\u30EA\u30D6\u30EC\u30FC\u30B7\u30E7\u30F3\u304C\u5B9F\u884C\u3055\u308C\u307E\u3059\u3002\u6B63\u9762\u3092\u5411\u3044\u3066\u30AB\u30E1\u30E9\u306B\u9854\u3092\u5408\u308F\u305B\u3066\u304F\u3060\u3055\u3044\u3002");
          }}
        >
          <Text style={calibrationStyles.calibrateBtnText}>{"\uD83D\uDCF7 \u518D\u30AD\u30E3\u30EA\u30D6\u30EC\u30FC\u30B7\u30E7\u30F3"}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8 \u2500\u2500"}</Text>
        <ToggleRow label={"\u81EA\u52D5\u4FDD\u5B58"} value={settings.autoSaveScreenshots} onToggle={() => toggleSetting("autoSaveScreenshots")} />

        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u30A2\u30AB\u30A6\u30F3\u30C8 \u2500\u2500"}</Text>

        <TouchableOpacity style={styles.dangerBtn} onPress={resetData}>
          <Text style={styles.dangerBtnText}>{"\u30C7\u30FC\u30BF\u30EA\u30BB\u30C3\u30C8"}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{"\u2500\u2500 \u305D\u306E\u4ED6 \u2500\u2500"}</Text>
        <Text style={styles.versionText}>{"\u30D0\u30FC\u30B8\u30E7\u30F3: 1.0.0"}</Text>
      </ScrollView>
    </View>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={toggleStyles.row}>
      <Text style={toggleStyles.label}>{label}</Text>
      <TouchableOpacity onPress={onToggle} style={[toggleStyles.toggle, value && toggleStyles.toggleOn]}>
        <Text style={toggleStyles.toggleText}>{value ? "ON" : "OFF"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function VolumeRow({ label, value, onDecrease, onIncrease, max = 1.0 }: {
  label: string; value: number; onDecrease: () => void; onIncrease: () => void; max?: number;
}) {
  const percent = Math.round((value / max) * 100);
  return (
    <View style={toggleStyles.row}>
      <Text style={toggleStyles.label}>{label}</Text>
      <View style={toggleStyles.volumeControls}>
        <TouchableOpacity onPress={onDecrease} style={toggleStyles.volBtn}>
          <Text style={toggleStyles.volBtnText}>-</Text>
        </TouchableOpacity>
        <View style={toggleStyles.barOuter}>
          <View style={[toggleStyles.barInner, { width: `${percent}%` }]} />
        </View>
        <Text style={toggleStyles.volText}>{percent}%</Text>
        <TouchableOpacity onPress={onIncrease} style={toggleStyles.volBtn}>
          <Text style={toggleStyles.volBtnText}>+</Text>
        </TouchableOpacity>
      </View>
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
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 14, textAlign: "center", marginVertical: 16 },
  dangerBtn: {
    backgroundColor: "#c62828", paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 12, alignSelf: "center",
  },
  dangerBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  versionText: { color: "#555", fontSize: 14, textAlign: "center" },
});

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 8,
  },
  label: { color: "#fff", fontSize: 16 },
  toggle: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16,
    backgroundColor: "#333",
  },
  toggleOn: { backgroundColor: "#4CAF50" },
  toggleText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  volumeControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  volBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#333",
    alignItems: "center", justifyContent: "center",
  },
  volBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  barOuter: { width: 80, height: 8, backgroundColor: "#333", borderRadius: 4, overflow: "hidden" },
  barInner: { height: "100%", backgroundColor: "#e94560", borderRadius: 4 },
  volText: { color: "#aaa", fontSize: 12, width: 32, textAlign: "center" },
});

const calibrationStyles = StyleSheet.create({
  calibrateBtn: {
    backgroundColor: "#0f3460",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#4fc3f7",
  },
  calibrateBtnText: { color: "#4fc3f7", fontSize: 14, fontWeight: "bold" },
});
