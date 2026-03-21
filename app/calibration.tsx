import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useWebCamera } from "../hooks/useWebCamera";
import { useMediaPipeFace, BlendshapeMap } from "../hooks/useMediaPipeFace";
import {
  recordNeutral,
  recordExpression,
  saveCalibration,
  DEFAULT_CALIBRATION,
} from "../lib/face/calibration";
import { CalibrationData } from "../types/expression";

type CalibrationStep = 0 | 1 | 2 | 3; // 0=waiting, 1=neutral, 2=smile, 3=angry

const STEP_INSTRUCTIONS = [
  { title: "\u30AD\u30E3\u30EA\u30D6\u30EC\u30FC\u30B7\u30E7\u30F3", sub: "\u9854\u8A8D\u8B58\u306E\u7CBE\u5EA6\u3092\u4E0A\u3052\u308B\u305F\u3081\u3001\n\u3042\u306A\u305F\u306E\u8868\u60C5\u3092\u8A18\u9332\u3057\u307E\u3059\u3002", button: "\u958B\u59CB" },
  { title: "\u30B9\u30C6\u30C3\u30D71: \u30EA\u30E9\u30C3\u30AF\u30B9\u3057\u305F\u9854", sub: "\u30EA\u30E9\u30C3\u30AF\u30B9\u3057\u305F\u9854\u3092\u30AB\u30E1\u30E9\u306B\n\u5411\u3051\u3066\u304F\u3060\u3055\u3044\u3002", button: "\u8A18\u9332" },
  { title: "\u30B9\u30C6\u30C3\u30D72: \u601D\u3044\u3063\u304D\u308A\u7B11\u3063\u3066\uFF01", sub: "\u6E80\u9762\u306E\u7B11\u9854\u3092\u898B\u305B\u3066\u304F\u3060\u3055\u3044\uFF01", button: "\u8A18\u9332" },
  { title: "\u30B9\u30C6\u30C3\u30D73: \u6012\u3063\u305F\u9854\u3092\u3057\u3066\uFF01", sub: "\u7709\u3092\u3057\u304B\u3081\u3066\u6012\u3063\u305F\u9854\u3092\uFF01", button: "\u8A18\u9332" },
];

export default function CalibrationScreen() {
  const router = useRouter();
  const [step, setStep] = useState<CalibrationStep>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const calibrationRef = useRef<Partial<CalibrationData>>({});
  const blendshapeBufferRef = useRef<BlendshapeMap[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { videoRef: setVideoRef, cameraReady, cameraError } = useWebCamera(true);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const setVideoElRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    setVideoRef(el);
  }, [setVideoRef]);

  const { blendshapes, status: mpStatus } = useMediaPipeFace(videoElRef, true);

  // Pulse animation for recording
  useEffect(() => {
    if (recording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 400, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [recording]);

  // Buffer blendshapes during recording
  useEffect(() => {
    if (recording && blendshapes) {
      blendshapeBufferRef.current.push({ ...blendshapes });
    }
  }, [blendshapes, recording]);

  const startRecording = () => {
    blendshapeBufferRef.current = [];
    setCountdown(3);
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
    // countdown === 0 → start recording
    setRecording(true);
    const t = setTimeout(() => {
      setRecording(false);
      finishStep();
    }, 3000); // 3 seconds of recording
    return () => clearTimeout(t);
  }, [countdown]);

  const finishStep = () => {
    const buffer = blendshapeBufferRef.current;
    if (buffer.length === 0) {
      // No data captured, just advance
      advanceStep();
      return;
    }

    // Average the buffer
    const avg: BlendshapeMap = {};
    const keys = Object.keys(buffer[0]);
    for (const key of keys) {
      avg[key] = buffer.reduce((sum, b) => sum + (b[key] ?? 0), 0) / buffer.length;
    }

    if (step === 1) {
      // Neutral
      const neutral = recordNeutral(avg);
      calibrationRef.current = { ...calibrationRef.current, ...neutral };
    } else if (step === 2) {
      // Smile
      recordExpression(avg, "happy");
    } else if (step === 3) {
      // Angry
      recordExpression(avg, "angry");
    }

    advanceStep();
  };

  const advanceStep = () => {
    if (step < 3) {
      setStep((step + 1) as CalibrationStep);
      setCountdown(null);
    } else {
      // All steps done
      const finalData: CalibrationData = {
        ...DEFAULT_CALIBRATION,
        ...calibrationRef.current,
        calibrated: true,
      };
      saveCalibration(finalData);
      setDone(true);
    }
  };

  const handleAction = () => {
    if (step === 0) {
      setStep(1);
    } else {
      startRecording();
    }
  };

  const handleSkip = () => {
    const finalData: CalibrationData = {
      ...DEFAULT_CALIBRATION,
      calibrated: true,
    };
    saveCalibration(finalData);
    router.back();
  };

  if (done) {
    return (
      <View style={styles.container}>
        <Text style={styles.doneTitle}>{"\u2705 \u30AD\u30E3\u30EA\u30D6\u30EC\u30FC\u30B7\u30E7\u30F3\u5B8C\u4E86\uFF01"}</Text>
        <Text style={styles.doneSub}>{"\u9854\u8A8D\u8B58\u306E\u7CBE\u5EA6\u304C\u5411\u4E0A\u3057\u307E\u3057\u305F\u3002"}</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => router.back()}>
          <Text style={styles.startBtnText}>{"\u30D0\u30C8\u30EB\u3078\u623B\u308B"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const info = STEP_INSTRUCTIONS[step];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{info.title}</Text>
      <Text style={styles.sub}>{info.sub}</Text>

      {/* Camera preview */}
      <View style={styles.cameraBox}>
        {Platform.OS === "web" && cameraReady ? (
          <Animated.View style={{ transform: [{ scale: recording ? pulseAnim : 1 }] }}>
            <video
              ref={(el: any) => setVideoElRef(el)}
              autoPlay
              playsInline
              muted
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                objectFit: "cover",
                transform: "scaleX(-1)",
                border: recording ? "4px solid #e94560" : "4px solid #4fc3f7",
              } as any}
            />
          </Animated.View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>
              {mpStatus === "loading"
                ? "\u9854\u8A8D\u8B58\u3092\u6E96\u5099\u4E2D..."
                : cameraError
                ? "\u30AB\u30E1\u30E9\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093"
                : "\u30AB\u30E1\u30E9\u3092\u8D77\u52D5\u4E2D..."}
            </Text>
          </View>
        )}

        {/* Recording indicator */}
        {recording && (
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recLabel}>REC</Text>
          </View>
        )}

        {/* Countdown */}
        {countdown !== null && countdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Face detection status */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, blendshapes ? styles.statusActive : styles.statusInactive]} />
        <Text style={styles.statusText}>
          {blendshapes ? "\u9854\u3092\u691C\u51FA\u4E2D" : "\u9854\u3092\u30AB\u30E1\u30E9\u306B\u5411\u3051\u3066\u304F\u3060\u3055\u3044"}
        </Text>
      </View>

      {/* Action button */}
      {!recording && countdown === null && (
        <TouchableOpacity
          style={[styles.actionBtn, !blendshapes && step > 0 && styles.actionBtnDisabled]}
          onPress={handleAction}
          disabled={!blendshapes && step > 0}
        >
          <Text style={styles.actionBtnText}>{info.button}</Text>
        </TouchableOpacity>
      )}

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipBtnText}>{"\u30B9\u30AD\u30C3\u30D7"}</Text>
      </TouchableOpacity>

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  sub: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  cameraBox: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  cameraPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#0f3460",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#4fc3f7",
  },
  cameraPlaceholderText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  recIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f44336",
  },
  recLabel: {
    color: "#f44336",
    fontSize: 12,
    fontWeight: "bold",
  },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 100,
    width: 200,
    height: 200,
  },
  countdownText: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: "#f44336",
  },
  statusText: {
    color: "#aaa",
    fontSize: 14,
  },
  actionBtn: {
    backgroundColor: "#e94560",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 12,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipBtnText: {
    color: "#666",
    fontSize: 14,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#333",
  },
  progressDotActive: {
    backgroundColor: "#e94560",
  },
  doneTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  doneSub: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: "#e94560",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
