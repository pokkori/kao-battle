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

/** Generate mock expression for web (random cycling) */
export function generateMockExpression(tick: number): ExpressionScores {
  const cycle = Math.floor(tick / 60) % 5;
  const base: ExpressionScores = { angry: 0.1, happy: 0.1, surprise: 0.1, sad: 0.1, neutral: 0.1 };
  const keys: ExpressionType[] = ["angry", "happy", "surprise", "sad", "neutral"];
  base[keys[cycle]] = 0.6 + Math.random() * 0.3;
  return base;
}
