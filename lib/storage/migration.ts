import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, CURRENT_DATA_VERSION } from "./keys";

export async function runMigrations(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    const version = raw ? parseInt(raw, 10) : 0;
    if (version < CURRENT_DATA_VERSION) {
      // Future migrations go here
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_VERSION, String(CURRENT_DATA_VERSION));
    }
  } catch {}
}
