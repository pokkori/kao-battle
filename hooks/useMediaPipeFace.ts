import { useRef, useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * MediaPipe Face Landmarker hook.
 * Initializes FaceLandmarker from @mediapipe/tasks-vision,
 * runs detectForVideo() at ~30fps via requestAnimationFrame,
 * and returns blendshape results.
 */

export type MediaPipeStatus = "loading" | "ready" | "error";

export interface BlendshapeMap {
  [key: string]: number;
}

export interface MediaPipeFaceResult {
  blendshapes: BlendshapeMap | null;
  status: MediaPipeStatus;
  error: string | null;
}

export function useMediaPipeFace(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean
): MediaPipeFaceResult {
  const [status, setStatus] = useState<MediaPipeStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [blendshapes, setBlendshapes] = useState<BlendshapeMap | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);

  // Initialize FaceLandmarker
  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;

    let cancelled = false;

    const init = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false,
            runningMode: "VIDEO",
            numFaces: 1,
          }
        );

        if (!cancelled) {
          landmarkerRef.current = faceLandmarker;
          setStatus("ready");
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("MediaPipe init error:", err);
          setStatus("error");
          setError(err?.message || "Failed to load MediaPipe");
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Detection loop
  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      !active ||
      status !== "ready" ||
      !landmarkerRef.current
    ) {
      return;
    }

    const detect = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();
      // Throttle to ~30fps (33ms interval)
      if (now - lastTimeRef.current < 33) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const result = landmarkerRef.current.detectForVideo(video, now);
        if (
          result &&
          result.faceBlendshapes &&
          result.faceBlendshapes.length > 0
        ) {
          const categories = result.faceBlendshapes[0].categories;
          const map: BlendshapeMap = {};
          for (const cat of categories) {
            map[cat.categoryName] = cat.score;
          }
          setBlendshapes(map);
        } else {
          setBlendshapes(null);
        }
      } catch {
        // Silently continue on detection errors
      }

      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, status, videoRef]);

  // Cleanup landmarker on unmount
  useEffect(() => {
    return () => {
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {}
        landmarkerRef.current = null;
      }
    };
  }, []);

  return { blendshapes, status, error };
}
