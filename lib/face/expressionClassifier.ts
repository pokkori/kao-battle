import { ExpressionScores, ExpressionType, FaceLandmark, CalibrationData } from "../../types/expression";

function distance(a: FaceLandmark, b: FaceLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export interface FaceFeatures {
  mouthOpenRatio: number;
  mouthSmileRatio: number;
  leftEyeOpenRatio: number;
  rightEyeOpenRatio: number;
  browRaiseRatio: number;
  browFurrowRatio: number;
}

/**
 * Convert MediaPipe blendshape map to FaceFeatures.
 * Mapping per R4 design:
 *   mouthOpenRatio ← jawOpen
 *   mouthSmileRatio ← (mouthSmileLeft + mouthSmileRight) / 2
 *   leftEyeOpenRatio ← 1.0 - eyeBlinkLeft
 *   rightEyeOpenRatio ← 1.0 - eyeBlinkRight
 *   browRaiseRatio ← browInnerUp + (browOuterUpLeft + browOuterUpRight) / 2
 *   browFurrowRatio ← (browDownLeft + browDownRight) / 2
 */
export function blendshapeToFaceFeatures(bs: Record<string, number>): FaceFeatures {
  return {
    mouthOpenRatio: bs["jawOpen"] ?? 0,
    mouthSmileRatio: ((bs["mouthSmileLeft"] ?? 0) + (bs["mouthSmileRight"] ?? 0)) / 2,
    leftEyeOpenRatio: 1.0 - (bs["eyeBlinkLeft"] ?? 0),
    rightEyeOpenRatio: 1.0 - (bs["eyeBlinkRight"] ?? 0),
    browRaiseRatio: (bs["browInnerUp"] ?? 0) + ((bs["browOuterUpLeft"] ?? 0) + (bs["browOuterUpRight"] ?? 0)) / 2,
    browFurrowRatio: ((bs["browDownLeft"] ?? 0) + (bs["browDownRight"] ?? 0)) / 2,
  };
}

/**
 * Classify expression from blendshape data using R4 thresholds.
 *
 * Thresholds per design:
 * - angry: browDown > 0.35 AND (mouthFrown > 0.25 OR noseSneer > 0.3)
 * - happy: mouthSmile > 0.4 AND cheekSquint > 0.2
 * - surprise: eyeWide > 0.4 AND jawOpen > 0.35
 * - sad: mouthFrown > 0.3 AND browInnerUp > 0.25
 */
export function classifyExpressionFromBlendshapes(bs: Record<string, number>): ExpressionScores {
  const browDown = ((bs["browDownLeft"] ?? 0) + (bs["browDownRight"] ?? 0)) / 2;
  const mouthFrown = ((bs["mouthFrownLeft"] ?? 0) + (bs["mouthFrownRight"] ?? 0)) / 2;
  const noseSneer = ((bs["noseSneerLeft"] ?? 0) + (bs["noseSneerRight"] ?? 0)) / 2;
  const mouthSmile = ((bs["mouthSmileLeft"] ?? 0) + (bs["mouthSmileRight"] ?? 0)) / 2;
  const cheekSquint = ((bs["cheekSquintLeft"] ?? 0) + (bs["cheekSquintRight"] ?? 0)) / 2;
  const eyeWide = ((bs["eyeWideLeft"] ?? 0) + (bs["eyeWideRight"] ?? 0)) / 2;
  const jawOpen = bs["jawOpen"] ?? 0;
  const browInnerUp = bs["browInnerUp"] ?? 0;

  // Angry: browDown > 0.35 AND (mouthFrown > 0.25 OR noseSneer > 0.3)
  let angryScore = 0;
  if (browDown > 0.35 && (mouthFrown > 0.25 || noseSneer > 0.3)) {
    angryScore = clamp((browDown + Math.max(mouthFrown, noseSneer)) / 2, 0, 1);
  } else {
    angryScore = clamp(browDown * 0.5 + Math.max(mouthFrown, noseSneer) * 0.3, 0, 0.35);
  }

  // Happy: mouthSmile > 0.4 AND cheekSquint > 0.2
  let happyScore = 0;
  if (mouthSmile > 0.4 && cheekSquint > 0.2) {
    happyScore = clamp((mouthSmile + cheekSquint) / 2, 0, 1);
  } else {
    happyScore = clamp(mouthSmile * 0.5 + cheekSquint * 0.3, 0, 0.35);
  }

  // Surprise: eyeWide > 0.4 AND jawOpen > 0.35
  let surpriseScore = 0;
  if (eyeWide > 0.4 && jawOpen > 0.35) {
    surpriseScore = clamp((eyeWide + jawOpen) / 2, 0, 1);
  } else {
    surpriseScore = clamp(eyeWide * 0.4 + jawOpen * 0.3, 0, 0.35);
  }

  // Sad: mouthFrown > 0.3 AND browInnerUp > 0.25
  let sadScore = 0;
  if (mouthFrown > 0.3 && browInnerUp > 0.25) {
    sadScore = clamp((mouthFrown + browInnerUp) / 2, 0, 1);
  } else {
    sadScore = clamp(mouthFrown * 0.4 + browInnerUp * 0.3, 0, 0.35);
  }

  const otherMax = Math.max(angryScore, happyScore, surpriseScore, sadScore);
  const neutralScore = clamp(1.0 - otherMax * 1.5, 0, 1);

  return {
    angry: angryScore,
    happy: happyScore,
    surprise: surpriseScore,
    sad: sadScore,
    neutral: neutralScore,
  };
}

export function classifyExpression(
  features: FaceFeatures,
  sensitivity: number
): ExpressionScores {
  const s = sensitivity;

  const angryScore = clamp(
    (features.browFurrowRatio * 0.4 +
      Math.max(0, -features.browRaiseRatio) * 0.3 +
      Math.max(0, features.mouthOpenRatio * 0.15) +
      Math.max(0, -features.mouthSmileRatio) * 0.15) * s,
    0, 1
  );

  const happyScore = clamp(
    (Math.max(0, features.mouthSmileRatio) * 0.5 +
      Math.max(0, 0.4 - features.leftEyeOpenRatio) * 0.25 +
      Math.max(0, 0.4 - features.rightEyeOpenRatio) * 0.25) * s,
    0, 1
  );

  const surpriseScore = clamp(
    (features.mouthOpenRatio * 0.35 +
      Math.max(0, features.leftEyeOpenRatio - 0.35) * 0.25 +
      Math.max(0, features.rightEyeOpenRatio - 0.35) * 0.25 +
      Math.max(0, features.browRaiseRatio) * 0.15) * s,
    0, 1
  );

  const sadScore = clamp(
    (Math.max(0, -features.mouthSmileRatio) * 0.35 +
      Math.max(0, features.browRaiseRatio * 0.5) * 0.3 +
      features.browFurrowRatio * 0.15 +
      Math.max(0, 0.3 - features.leftEyeOpenRatio) * 0.2) * s,
    0, 1
  );

  const otherMax = Math.max(angryScore, happyScore, surpriseScore, sadScore);
  const neutralScore = clamp(1.0 - otherMax * 1.5, 0, 1);

  return {
    angry: angryScore,
    happy: happyScore,
    surprise: surpriseScore,
    sad: sadScore,
    neutral: neutralScore,
  };
}

export function getDominantExpression(scores: ExpressionScores): ExpressionType {
  const entries = Object.entries(scores) as [ExpressionType, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/** Generate mock expression for web fallback (random cycling) */
export function generateMockExpression(tick: number): ExpressionScores {
  const cycle = Math.floor(tick / 60) % 5;
  const base: ExpressionScores = { angry: 0.1, happy: 0.1, surprise: 0.1, sad: 0.1, neutral: 0.1 };
  const keys: ExpressionType[] = ["angry", "happy", "surprise", "sad", "neutral"];
  base[keys[cycle]] = 0.6 + Math.random() * 0.3;
  return base;
}
