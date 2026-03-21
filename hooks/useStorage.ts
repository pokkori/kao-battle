import { useState, useEffect, useCallback } from "react";
import { PlayerData } from "../types/player";
import { GameSettings } from "../types/storage";
import { DEFAULT_PLAYER_DATA, DEFAULT_SETTINGS } from "../types/storage";
import { loadPlayerData, savePlayerData, loadSettings, saveSettings } from "../lib/storage/playerData";

export function usePlayerData() {
  const [player, setPlayer] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPlayerData().then((data) => {
      setPlayer(data);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(async (updater: (prev: PlayerData) => PlayerData) => {
    setPlayer((prev) => {
      const next = updater(prev);
      savePlayerData(next);
      return next;
    });
  }, []);

  return { player, loaded, update };
}

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((data) => {
      setSettings(data);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(async (partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, loaded, update };
}
