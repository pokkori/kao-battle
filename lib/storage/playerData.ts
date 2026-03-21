import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlayerData } from "../../types/player";
import { GameSettings } from "../../types/storage";
import { DEFAULT_PLAYER_DATA, DEFAULT_SETTINGS } from "../../types/storage";
import { STORAGE_KEYS } from "./keys";

export async function loadPlayerData(): Promise<PlayerData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER);
    if (raw) return { ...DEFAULT_PLAYER_DATA, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PLAYER_DATA };
}

export async function savePlayerData(data: PlayerData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(data));
}

export async function loadSettings(): Promise<GameSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function isTutorialDone(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_DONE);
    return val === "true";
  } catch {
    return false;
  }
}

export async function setTutorialDone(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_DONE, "true");
}
