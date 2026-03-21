import { CalibrationData } from "../../types/expression";
import { Platform } from "react-native";

export const DEFAULT_CALIBRATION: CalibrationData = {
  neutralMouthOpen: 0.02,
  neutralEyeOpen: 0.25,
  neutralBrowHeight: 0.08,
  neutralMouthCornerHeight: 0.0,
  calibrated: false,
};

const STORAGE_KEY = "face-fight-calibration";

/** Record neutral face blendshapes */
export function recordNeutral(
  blendshapes: Record<string, number>
): Partial<CalibrationData> {
  return {
    neutralMouthOpen: blendshapes["jawOpen"] ?? 0.02,
    neutralEyeOpen:
      1.0 - ((blendshapes["eyeBlinkLeft"] ?? 0) + (blendshapes["eyeBlinkRight"] ?? 0)) / 2,
    neutralBrowHeight:
      (blendshapes["browInnerUp"] ?? 0) +
      ((blendshapes["browOuterUpLeft"] ?? 0) + (blendshapes["browOuterUpRight"] ?? 0)) / 2,
    neutralMouthCornerHeight:
      ((blendshapes["mouthSmileLeft"] ?? 0) + (blendshapes["mouthSmileRight"] ?? 0)) / 2,
  };
}

/** Record expression max values (smile or angry) */
export function recordExpression(
  blendshapes: Record<string, number>,
  type: "happy" | "angry"
): Record<string, number> {
  if (type === "happy") {
    return {
      maxSmile:
        ((blendshapes["mouthSmileLeft"] ?? 0) + (blendshapes["mouthSmileRight"] ?? 0)) / 2,
      maxCheekSquint:
        ((blendshapes["cheekSquintLeft"] ?? 0) + (blendshapes["cheekSquintRight"] ?? 0)) / 2,
    };
  }
  return {
    maxBrowDown:
      ((blendshapes["browDownLeft"] ?? 0) + (blendshapes["browDownRight"] ?? 0)) / 2,
    maxMouthFrown:
      ((blendshapes["mouthFrownLeft"] ?? 0) + (blendshapes["mouthFrownRight"] ?? 0)) / 2,
  };
}

/** Check if calibration is done */
export function getCalibrated(): boolean {
  if (Platform.OS !== "web") return false;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data) as CalibrationData;
    return parsed.calibrated === true;
  } catch {
    return false;
  }
}

/** Save calibration data */
export function saveCalibration(data: CalibrationData): void {
  if (Platform.OS !== "web") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/** Load calibration data */
export function loadCalibration(): CalibrationData {
  if (Platform.OS !== "web") return DEFAULT_CALIBRATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CALIBRATION;
    return JSON.parse(raw) as CalibrationData;
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

/** Clear calibration */
export function clearCalibration(): void {
  if (Platform.OS !== "web") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
