/** 表情の種類 */
export type ExpressionType =
  | "angry"    // 怒り → パンチ
  | "happy"    // 笑顔 → バリア
  | "surprise" // 驚き → ビーム
  | "sad"      // 悲しみ → 回復
  | "neutral"; // 無表情 → 待機

/** 各表情の検出確度（0.0〜1.0） */
export interface ExpressionScores {
  angry: number;
  happy: number;
  surprise: number;
  sad: number;
  neutral: number;
}

/** MediaPipe Face Meshのランドマーク座標 */
export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

/** 表情分類に使う主要ランドマーク群 */
export interface FaceLandmarks {
  leftEyeUpper: FaceLandmark;
  leftEyeLower: FaceLandmark;
  rightEyeUpper: FaceLandmark;
  rightEyeLower: FaceLandmark;
  leftEyebrow: FaceLandmark;
  rightEyebrow: FaceLandmark;
  upperLip: FaceLandmark;
  lowerLip: FaceLandmark;
  leftMouth: FaceLandmark;
  rightMouth: FaceLandmark;
  noseTip: FaceLandmark;
  chin: FaceLandmark;
}

/** 表情検出結果 */
export interface ExpressionResult {
  dominant: ExpressionType;
  scores: ExpressionScores;
  landmarks: FaceLandmarks;
  timestamp: number;
  faceDetected: boolean;
}

/** キャリブレーションデータ */
export interface CalibrationData {
  neutralMouthOpen: number;
  neutralEyeOpen: number;
  neutralBrowHeight: number;
  neutralMouthCornerHeight: number;
  calibrated: boolean;
}
