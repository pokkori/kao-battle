import { PlayerData } from "./player";
import { CalibrationData } from "./expression";

/** ゲーム設定 */
export interface GameSettings {
  bgmVolume: number;
  seVolume: number;
  hapticsEnabled: boolean;
  showCameraPreview: boolean;
  showFaceMesh: boolean;
  autoSaveScreenshots: boolean;
  expressionSensitivity: number;
}

/** デフォルト設定値 */
export const DEFAULT_SETTINGS: GameSettings = {
  bgmVolume: 0.7,
  seVolume: 1.0,
  hapticsEnabled: true,
  showCameraPreview: true,
  showFaceMesh: false,
  autoSaveScreenshots: true,
  expressionSensitivity: 1.0,
};

/** デフォルトプレイヤーデータ */
export const DEFAULT_PLAYER_DATA: PlayerData = {
  totalCoins: 0,
  coins: 0,
  unlockedStages: ["stage_1_1"],
  stageScores: {},
  stageRanks: {},
  purchasedItems: [],
  equippedPunchEffect: "default_punch",
  equippedBarrierSkin: "default_barrier",
  equippedBeamEffect: "default_beam",
  equippedTitle: "",
  unlockedAchievements: [],
  lastDailyDate: "",
  dailyStreak: 0,
  totalPlays: 0,
  totalPlayTime: 0,
  totalEnemiesDefeated: 0,
  overallMaxCombo: 0,
  adFree: false,
  dataVersion: 1,
  firstPlayDate: "",
  lastPlayDate: "",
};

/** AsyncStorageの全キー型安全定義 */
export interface StorageSchema {
  "@facefight/player": PlayerData;
  "@facefight/calibration": CalibrationData;
  "@facefight/settings": GameSettings;
  "@facefight/daily_seed": string;
  "@facefight/snapshots": string[];
  "@facefight/data_version": number;
  "@facefight/first_launch": boolean;
  "@facefight/ad_consent": boolean;
  "@facefight/tutorial_done": boolean;
}
