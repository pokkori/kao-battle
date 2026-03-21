import { useState, useEffect, useRef, useCallback } from "react";
import { ExpressionResult, ExpressionType, ExpressionScores, FaceLandmarks, FaceLandmark } from "../types/expression";
import { generateMockExpression, getDominantExpression } from "../lib/face/expressionClassifier";

const ZERO_LANDMARK: FaceLandmark = { x: 0, y: 0, z: 0 };
const ZERO_LANDMARKS: FaceLandmarks = {
  leftEyeUpper: ZERO_LANDMARK, leftEyeLower: ZERO_LANDMARK,
  rightEyeUpper: ZERO_LANDMARK, rightEyeLower: ZERO_LANDMARK,
  leftEyebrow: ZERO_LANDMARK, rightEyebrow: ZERO_LANDMARK,
  upperLip: ZERO_LANDMARK, lowerLip: ZERO_LANDMARK,
  leftMouth: ZERO_LANDMARK, rightMouth: ZERO_LANDMARK,
  noseTip: ZERO_LANDMARK, chin: ZERO_LANDMARK,
};

/**
 * Expression detection hook.
 * On web/dev: uses mock expression cycling.
 * On native with camera: would use MediaPipe (not implemented in this build).
 */
export function useExpression(active: boolean) {
  const [result, setResult] = useState<ExpressionResult>({
    dominant: "neutral",
    scores: { angry: 0, happy: 0, surprise: 0, sad: 0, neutral: 1 },
    landmarks: ZERO_LANDMARKS,
    timestamp: Date.now(),
    faceDetected: false,
  });

  const tickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const scores = generateMockExpression(tickRef.current);
      const dominant = getDominantExpression(scores);
      setResult({
        dominant,
        scores,
        landmarks: ZERO_LANDMARKS,
        timestamp: Date.now(),
        faceDetected: true,
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  /** Force a specific expression (for testing/demo) */
  const forceExpression = useCallback((type: ExpressionType) => {
    const scores: ExpressionScores = { angry: 0.1, happy: 0.1, surprise: 0.1, sad: 0.1, neutral: 0.1 };
    scores[type] = 0.85;
    setResult({
      dominant: type,
      scores,
      landmarks: ZERO_LANDMARKS,
      timestamp: Date.now(),
      faceDetected: true,
    });
  }, []);

  return { expression: result, forceExpression };
}
