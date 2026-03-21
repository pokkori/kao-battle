import { useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";

/**
 * Web Audio API battle sound effects.
 * Works on web only; no-ops on native.
 */

type SEType = "punch" | "barrier" | "beam" | "heal" | "enemyAttack" | "enemyDefeat" | "gameOver" | "win" | "combo";

export function useBattleSE() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (Platform.OS !== "web") return null;
    if (!ctxRef.current) {
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) ctxRef.current = new AC();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  // Resume audio context on first user interaction (required by browsers)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const resume = () => {
      const ctx = getCtx();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    };
    document.addEventListener("click", resume, { once: true });
    document.addEventListener("touchstart", resume, { once: true });
    return () => {
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
    };
  }, [getCtx]);

  const playSE = useCallback((type: SEType) => {
    const ctx = getCtx();
    if (!ctx) return;

    try {
      switch (type) {
        case "punch":
          playPunch(ctx);
          break;
        case "barrier":
          playBarrier(ctx);
          break;
        case "beam":
          playBeam(ctx);
          break;
        case "heal":
          playHeal(ctx);
          break;
        case "enemyAttack":
          playEnemyAttack(ctx);
          break;
        case "enemyDefeat":
          playEnemyDefeat(ctx);
          break;
        case "gameOver":
          playGameOver(ctx);
          break;
        case "win":
          playWin(ctx);
          break;
        case "combo":
          playCombo(ctx);
          break;
      }
    } catch {
      // Silently fail if audio is not available
    }
  }, [getCtx]);

  return { playSE };
}

// --- Sound synthesis functions ---

function playPunch(ctx: AudioContext) {
  // "Don!" - low triangle wave impact
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.15);

  // Add a noise burst for impact
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

function playBarrier(ctx: AudioContext) {
  // "Shakin!" - high metallic sine
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2000, t);
  osc.frequency.exponentialRampToValueAtTime(3000, t + 0.03);
  osc.frequency.exponentialRampToValueAtTime(1500, t + 0.08);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);

  // Shimmer overtone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(4000, t);
  osc2.frequency.exponentialRampToValueAtTime(2500, t + 0.1);
  gain2.gain.setValueAtTime(0.15, t);
  gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(t);
  osc2.stop(t + 0.1);
}

function playBeam(ctx: AudioContext) {
  // Electric beam - rising saw wave
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.setValueAtTime(0.3, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

function playHeal(ctx: AudioContext) {
  // "Kirarin" - ascending sine arpeggio
  const t = ctx.currentTime;
  const notes = [800, 1000, 1200, 1600];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.06);
    gain.gain.setValueAtTime(0, t);
    gain.gain.setValueAtTime(0.25, t + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.15);
  });
}

function playEnemyAttack(ctx: AudioContext) {
  // Low rumble hit
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

function playEnemyDefeat(ctx: AudioContext) {
  // "Dokaan!" - explosion noise + low sine
  const t = ctx.currentTime;

  // Noise burst
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.25);

  // Low boom
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.35);
}

function playGameOver(ctx: AudioContext) {
  // Descending tones
  const t = ctx.currentTime;
  const notes = [400, 350, 300, 200, 150];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.2);
    gain.gain.setValueAtTime(0.3, t + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.2 + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.2);
    osc.stop(t + i * 0.2 + 0.25);
  });
}

function playWin(ctx: AudioContext) {
  // Victory fanfare - ascending major arpeggio
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0.3, t + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.3);
  });
}

function playCombo(ctx: AudioContext) {
  // Quick ascending blip
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}
