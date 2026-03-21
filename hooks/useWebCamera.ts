import { useRef, useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Web camera hook using getUserMedia.
 * Returns a ref that should be attached to a <video> element (web only).
 * On native, this is a no-op.
 */
export function useWebCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (Platform.OS !== "web") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
      setCameraError(null);
    } catch (err: any) {
      setCameraError(err?.message || "Camera not available");
      setCameraReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Capture current frame as data URL
  const captureFrame = useCallback((): string | null => {
    if (Platform.OS !== "web" || !videoRef.current || !cameraReady) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      // Mirror the image (selfie mode)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.8);
    } catch {
      return null;
    }
  }, [cameraReady]);

  useEffect(() => {
    if (active && Platform.OS === "web") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [active, startCamera, stopCamera]);

  // Re-attach stream when videoRef changes
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  return { videoRef: setVideoRef, cameraReady, cameraError, captureFrame, stopCamera };
}
