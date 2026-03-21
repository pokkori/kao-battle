import { useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";

/**
 * Web Audio API battle sound effects + BGM.
 * Works on web only; no-ops on native.
 */

type SEType = "punch" | "barrier" | "beam" | "heal" | "enemyAttack" | "enemyDefeat" | "gameOver" | "win" | "combo";

export function useBattleSE() {
  const ctxRef = useRef<AudioContext | null>(null);
  const bgmNodesRef = useRef<{ sources: OscillatorNode[]; gains: GainNode[]; interval: ReturnType<typeof setInterval> | null }>({
    sources: [],
    gains: [],
    interval: null,
  });

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

  /** Start BGM for a given world (1-5), isBoss flag */
  const startBGM = useCallback((world: number, isBoss: boolean) => {
    const ctx = getCtx();
    if (!ctx) return;

    // Stop any existing BGM first
    stopBGMInternal();

    try {
      switch (world) {
        case 1:
          startBGM_W1_Dojo(ctx, isBoss);
          break;
        case 2:
          startBGM_W2_Volcano(ctx, isBoss);
          break;
        case 3:
          startBGM_W3_Amusement(ctx, isBoss);
          break;
        case 4:
          startBGM_W4_Space(ctx, isBoss);
          break;
        case 5:
          startBGM_W5_Emotion(ctx, isBoss);
          break;
        default:
          startBGM_W1_Dojo(ctx, isBoss);
          break;
      }
    } catch {
      // Silently fail
    }
  }, [getCtx]);

  const stopBGMInternal = () => {
    const nodes = bgmNodesRef.current;
    if (nodes.interval) {
      clearInterval(nodes.interval);
      nodes.interval = null;
    }
    for (const g of nodes.gains) {
      try {
        g.gain.setValueAtTime(0, 0);
        g.disconnect();
      } catch {}
    }
    for (const s of nodes.sources) {
      try {
        s.stop();
        s.disconnect();
      } catch {}
    }
    nodes.sources = [];
    nodes.gains = [];
  };

  /** Stop BGM */
  const stopBGM = useCallback(() => {
    stopBGMInternal();
  }, []);

  /** Pause BGM (reduce volume to 0) */
  const pauseBGM = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    for (const g of bgmNodesRef.current.gains) {
      try {
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      } catch {}
    }
  }, [getCtx]);

  /** Resume BGM */
  const resumeBGM = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    for (const g of bgmNodesRef.current.gains) {
      try {
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      } catch {}
    }
  }, [getCtx]);

  // --- BGM generators ---

  // W1: 和風パーカッションループ（太鼓風）
  const startBGM_W1_Dojo = (ctx: AudioContext, isBoss: boolean) => {
    const bpm = isBoss ? 140 : 110;
    const beatDuration = 60 / bpm;
    let beat = 0;

    const interval = setInterval(() => {
      const t = ctx.currentTime;
      const step = beat % 8;

      // Taiko-like deep drum
      if (step === 0 || step === 4) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      }

      // Hi-hat on every beat
      const bufSize = ctx.sampleRate * 0.02;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.08, t);
      ng.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
      noise.connect(ng);
      ng.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.03);

      // Bass on boss
      if (isBoss && (step === 2 || step === 6)) {
        const bass = ctx.createOscillator();
        const bg = ctx.createGain();
        bass.type = "sine";
        bass.frequency.setValueAtTime(55, t);
        bg.gain.setValueAtTime(0.15, t);
        bg.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        bass.connect(bg);
        bg.connect(ctx.destination);
        bass.start(t);
        bass.stop(t + 0.15);
      }

      beat++;
    }, beatDuration * 1000);

    bgmNodesRef.current.interval = interval;
  };

  // W2: 重低音ドラムループ
  const startBGM_W2_Volcano = (ctx: AudioContext, isBoss: boolean) => {
    const bpm = isBoss ? 130 : 100;
    const beatDuration = 60 / bpm;
    let beat = 0;

    const interval = setInterval(() => {
      const t = ctx.currentTime;
      const step = beat % 8;

      // Heavy kick
      if (step === 0 || step === 3 || step === 6) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(60, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.2);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      }

      // Distorted snare
      if (step === 4) {
        const bufSize = ctx.sampleRate * 0.08;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.18, t);
        ng.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        noise.connect(ng);
        ng.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.1);
      }

      // Bass rumble for boss
      if (isBoss && step % 2 === 0) {
        const bass = ctx.createOscillator();
        const bg = ctx.createGain();
        bass.type = "sawtooth";
        bass.frequency.setValueAtTime(40, t);
        bg.gain.setValueAtTime(0.08, t);
        bg.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        bass.connect(bg);
        bg.connect(ctx.destination);
        bass.start(t);
        bass.stop(t + 0.12);
      }

      beat++;
    }, beatDuration * 1000);

    bgmNodesRef.current.interval = interval;
  };

  // W3: オルゴール風メロディループ
  const startBGM_W3_Amusement = (ctx: AudioContext, isBoss: boolean) => {
    const bpm = isBoss ? 150 : 120;
    const beatDuration = 60 / bpm;
    const melody = [523, 587, 659, 784, 659, 587, 523, 440]; // C5 D5 E5 G5...
    let beat = 0;

    const interval = setInterval(() => {
      const t = ctx.currentTime;
      const note = melody[beat % melody.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);

      // Subtle tick
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(note * 2, t);
      g2.gain.setValueAtTime(0.04, t);
      g2.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.1);

      beat++;
    }, beatDuration * 1000);

    bgmNodesRef.current.interval = interval;
  };

  // W4: シンセパッドアンビエント
  const startBGM_W4_Space = (ctx: AudioContext, isBoss: boolean) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(isBoss ? 110 : 82, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(isBoss ? 165 : 123, ctx.currentTime);
    gain2.gain.setValueAtTime(0.05, ctx.currentTime);

    // Slow LFO modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
    lfoGain.gain.setValueAtTime(10, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start();
    osc2.start();
    lfo.start();

    bgmNodesRef.current.sources = [osc1, osc2, lfo];
    bgmNodesRef.current.gains = [gain1, gain2, lfoGain];

    // Add arpeggiated blips for boss
    if (isBoss) {
      const bpm = 140;
      const beatDuration = 60 / bpm;
      const notes = [330, 440, 523, 659];
      let beat = 0;
      const interval = setInterval(() => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(notes[beat % notes.length], t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
        beat++;
      }, beatDuration * 1000);
      bgmNodesRef.current.interval = interval;
    }
  };

  // W5: エピックオーケストラ風
  const startBGM_W5_Emotion = (ctx: AudioContext, isBoss: boolean) => {
    const bpm = isBoss ? 130 : 100;
    const beatDuration = 60 / bpm;
    const chords = [
      [261, 329, 392], // C major
      [293, 349, 440], // D minor
      [329, 415, 493], // E minor
      [349, 440, 523], // F major
    ];
    let beat = 0;

    const interval = setInterval(() => {
      const t = ctx.currentTime;
      const chord = chords[Math.floor(beat / 4) % chords.length];

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });

      // Timpani on strong beats
      if (beat % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(isBoss ? 80 : 65, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      }

      beat++;
    }, beatDuration * 1000);

    bgmNodesRef.current.interval = interval;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBGMInternal();
    };
  }, []);

  return { playSE, startBGM, stopBGM, pauseBGM, resumeBGM };
}

// --- Sound synthesis functions ---

function playPunch(ctx: AudioContext) {
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
  const t = ctx.currentTime;

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
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047];
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
