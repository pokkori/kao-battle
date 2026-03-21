import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions } from "react-native";
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useBattle } from "../hooks/useBattle";
import { useExpression } from "../hooks/useExpression";
import { usePlayerData } from "../hooks/useStorage";
import { useBattleSE } from "../hooks/useBattleSE";
import { useWebCamera } from "../hooks/useWebCamera";
import { useMediaPipeFace } from "../hooks/useMediaPipeFace";
import { getStage } from "../lib/battle/stageManager";
import { getCalibrated } from "../lib/face/calibration";
import { ExpressionType } from "../types/expression";
import { SkillType, SKILLS } from "../types/battle";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const EXPRESSION_EMOJI: Record<ExpressionType, string> = {
  angry: "\uD83D\uDE21", happy: "\uD83D\uDE0A", surprise: "\uD83D\uDE32", sad: "\uD83D\uDE22", neutral: "\uD83D\uDE10",
};

const EXPRESSION_LABELS: Record<ExpressionType, string> = {
  angry: "\u6012\u308A", happy: "\u7B11\u9854", surprise: "\u9A5A\u304D", sad: "\u60B2\u3057\u307F", neutral: "\u7121\u8868\u60C5",
};

const SKILL_ICONS: Record<SkillType, string> = {
  punch: "\uD83D\uDC4A", barrier: "\uD83D\uDEE1\uFE0F", beam: "\u26A1", heal: "\uD83D\uDCA7", idle: "",
};

const SKILL_NAMES: Record<SkillType, string> = {
  punch: "\u30D1\u30F3\u30C1", barrier: "\u30D0\u30EA\u30A2", beam: "\u30D3\u30FC\u30E0", heal: "\u30D2\u30FC\u30EB", idle: "",
};

const SKILL_DAMAGE: Record<SkillType, string> = {
  punch: "30", barrier: "\u9632\u5FA1", beam: "60", heal: "+15", idle: "",
};

const EXPRESSION_TO_SKILL: Record<ExpressionType, SkillType> = {
  angry: "punch", happy: "barrier", surprise: "beam", sad: "heal", neutral: "idle",
};

const EXPRESSION_GUIDE: Record<ExpressionType, string> = {
  angry: "\u773C\u3092\u3064\u308A\u4E0A\u3052\u3066\uFF01",
  happy: "\u30CB\u30B3\u30C3\u3068\u7B11\u3063\u3066\uFF01",
  surprise: "\u53E3\u3092\u5927\u304D\u304F\u958B\u3051\u3066\uFF01",
  sad: "\u53E3\u89D2\u3092\u4E0B\u3052\u3066\uFF01",
  neutral: "",
};

const ENEMY_EMOJIS: Record<string, string> = {
  e_slime: "\uD83D\uDFE2", e_wooden_dummy: "\uD83E\uDEAB", e_ninja: "\uD83E\uDD77",
  e_sumo: "\uD83D\uDCAA", e_boss_sensei: "\uD83E\uDD4B", e_fire_imp: "\uD83D\uDD25",
  e_lava_golem: "\uD83C\uDF0B", e_flame_dancer: "\uD83D\uDC83",
  e_boss_volcano_dragon: "\uD83D\uDC32", e_clown: "\uD83E\uDD21",
  e_puppet: "\uD83E\uDE86", e_mirror: "\uD83E\uDE9E",
  e_boss_ringmaster: "\uD83C\uDFA9", e_alien: "\uD83D\uDC7D",
  e_space_jellyfish: "\uD83E\uDEBC", e_boss_cosmos_emperor: "\uD83D\uDE80",
  e_emotion_ghost: "\uD83D\uDC7B", e_boss_emotion_king: "\uD83D\uDC51",
};

// Skill ring colors per design
const SKILL_RING_COLORS: Record<SkillType, string> = {
  punch: "#e94560",   // red
  barrier: "#4fc3f7", // blue
  beam: "#ffd700",    // yellow
  heal: "#4CAF50",    // green
  idle: "transparent",
};

export default function BattleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stageId: string; dailyMode?: string; dailyConstraint?: string }>();
  const stageId = params.stageId ?? "stage_1_1";
  const dailyMode = params.dailyMode ?? "0";
  const dailyConstraint = params.dailyConstraint ?? "";
  const stage = getStage(stageId) ?? null;
  const { player, update } = usePlayerData();
  const { state, battleResult, lastDamage, actions } = useBattle(stage, player.equippedPunchEffect, player.equippedBeamEffect, dailyConstraint || undefined);

  const isFighting = state.phase === "fight" || state.phase === "boss_fight";

  // Web camera
  const { videoRef: setVideoRef, cameraReady, cameraError, captureFrame, stopCamera } = useWebCamera(isFighting);

  // Store actual video element ref for MediaPipe
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const setVideoElRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    setVideoRef(el);
  }, [setVideoRef]);

  // MediaPipe face detection
  const { blendshapes, status: mpStatus, error: mpError } = useMediaPipeFace(videoElRef, isFighting && cameraReady);
  const mediaPipeReady = mpStatus === "ready";
  const mediaPipeError = mpStatus === "error";

  // Expression with MediaPipe blendshapes
  const { expression, forceExpression } = useExpression(
    isFighting,
    blendshapes,
    mediaPipeReady,
    mediaPipeError
  );

  const { playSE, startBGM, stopBGM, pauseBGM, resumeBGM } = useBattleSE();

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Captured face frames for result (max 5)
  const capturedFramesRef = useRef<{ dataUrl: string; score: number }[]>([]);
  const capturedFaceRef = useRef<string | null>(null);

  // Skill ring effect
  const [skillRingColor, setSkillRingColor] = useState("transparent");
  const skillRingOpacity = useRef(new Animated.Value(0)).current;

  // SVG Skill effects
  const [activeSkillEffect, setActiveSkillEffect] = useState<SkillType | null>(null);
  const skillEffectScale = useRef(new Animated.Value(1)).current;
  const skillEffectOpacity = useRef(new Animated.Value(0)).current;
  const skillEffectTranslateX = useRef(new Animated.Value(0)).current;

  // Calibration check
  const [calibrationChecked, setCalibrationChecked] = useState(false);

  // Animation refs
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const damagePopAnim = useRef(new Animated.Value(0)).current;
  const damagePopOpacity = useRef(new Animated.Value(0)).current;
  const [damagePopText, setDamagePopText] = useState("");
  const [damagePopColor, setDamagePopColor] = useState("#fff");
  const enemyShakeAnim = useRef(new Animated.Value(0)).current;
  const playerHpAnim = useRef(new Animated.Value(100)).current;
  const enemyHpAnim = useRef(new Animated.Value(100)).current;
  const enemyBounceAnim = useRef(new Animated.Value(0)).current;
  const shockwaveScale = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const recBlink = useRef(new Animated.Value(1)).current;
  const cameraOverlayOpacity = useRef(new Animated.Value(0)).current;
  const [cameraOverlayColor, setCameraOverlayColor] = useState("#4fc3f7");

  // Enraged mode flash
  const [enragedMode, setEnragedMode] = useState(false);
  const enrageFlashOpacity = useRef(new Animated.Value(0)).current;

  // Enemy speech bubble
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastEnemyId = useRef<string | null>(null);
  const lastCombo = useRef(0);

  // Check calibration on mount — redirect if first time
  useEffect(() => {
    if (Platform.OS === "web" && !calibrationChecked) {
      setCalibrationChecked(true);
      if (!getCalibrated()) {
        router.push("/calibration");
      }
    }
  }, [calibrationChecked]);

  // REC blink loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recBlink, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(recBlink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Show tutorial on first fight
  useEffect(() => {
    if (state.phase === "ready") {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, [state.phase]);

  // Start battle on mount
  useEffect(() => {
    actions.start();
  }, []);

  // Feed expression results into battle
  useEffect(() => {
    if (state.phase === "fight" || state.phase === "boss_fight") {
      actions.processExpression(expression);
    }
  }, [expression, state.phase]);

  // Show enemy enterLine when new enemy appears
  useEffect(() => {
    if (state.currentEnemy && state.currentEnemy.id !== lastEnemyId.current) {
      lastEnemyId.current = state.currentEnemy.id;
      showSpeechBubble(state.currentEnemy.enterLine);
    }
  }, [state.currentEnemy?.id]);

  // Combo SE
  useEffect(() => {
    if (state.combo > lastCombo.current && state.combo >= 3) {
      playSE("combo");
    }
    lastCombo.current = state.combo;
  }, [state.combo, playSE]);

  // Animate HP bars
  useEffect(() => {
    const hpPct = (state.playerHP / state.playerMaxHP) * 100;
    Animated.timing(playerHpAnim, { toValue: hpPct, duration: 300, useNativeDriver: false }).start();
  }, [state.playerHP]);

  useEffect(() => {
    const enemyHpPct = state.currentEnemy ? (state.enemyHP / state.currentEnemy.hp) * 100 : 0;
    Animated.timing(enemyHpAnim, { toValue: Math.max(0, enemyHpPct), duration: 300, useNativeDriver: false }).start();
    // 激怒モード突入検知（HP30%以下かつ前回は30%超）
    if (state.currentEnemy && enemyHpPct <= 30 && enemyHpPct > 0) {
      // 敵キャラ激怒バウンス演出（既存enemyBounceAnimを流用）
      Animated.sequence([
        Animated.timing(enemyBounceAnim, { toValue: -20, duration: 80, useNativeDriver: true }),
        Animated.timing(enemyBounceAnim, { toValue: 20, duration: 80, useNativeDriver: true }),
        Animated.timing(enemyBounceAnim, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(enemyBounceAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
        Animated.timing(enemyBounceAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    const nowEnraged = state.currentEnemy !== null
      && enemyHpPct <= 30
      && state.enemyHP > 0;
    if (nowEnraged && !enragedMode) {
      setEnragedMode(true);
      Animated.sequence([
        Animated.timing(enrageFlashOpacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
        Animated.timing(enrageFlashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(enrageFlashOpacity, { toValue: 0.4, duration: 100, useNativeDriver: true }),
        Animated.timing(enrageFlashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    if (!nowEnraged) setEnragedMode(false);
  }, [state.enemyHP, state.currentEnemy]);

  // BGM: start on fight, stop on win/lose, pause on paused
  useEffect(() => {
    if (state.phase === "fight" && stage) {
      startBGM(stage.world, false);
    } else if (state.phase === "boss_fight" && stage) {
      stopBGM();
      startBGM(stage.world, true);
    } else if (state.phase === "paused") {
      pauseBGM();
    } else if (state.phase === "win" || state.phase === "lose") {
      stopBGM();
    }
  }, [state.phase, stage]);

  // Resume BGM when unpausing
  useEffect(() => {
    if (state.phase === "fight" || state.phase === "boss_fight") {
      resumeBGM();
    }
  }, [state.phase]);

  // Handle damage effects + SE + capture frame on skill activation
  useEffect(() => {
    if (lastDamage) {
      if (lastDamage.type === "player_attack") {
        triggerFlash("#4fc3f7");
        // 激怒モード判定: 敵HP30%以下かつ生存中
        const isEnraged = state.currentEnemy !== null
          && state.enemyHP > 0
          && (state.enemyHP / (state.currentEnemy.hp ?? 100)) <= 0.30;

        const popupColor = lastDamage.critical
          ? "#ffd700"
          : isEnraged
            ? "#FF2244"  // 激怒中: 赤
            : "#4fc3f7"; // 通常: 水色

        const popupText = lastDamage.critical
          ? `⚡クリティカル！-${lastDamage.amount}`
          : isEnraged
            ? `🔥-${lastDamage.amount}（激怒2倍！）`
            : `-${lastDamage.amount}`;

        showDamagePopup(popupText, popupColor);
        triggerEnemyShake();
        triggerShockwave();
        triggerCameraOverlay("#4fc3f7");
        triggerHaptic("impact");

        // Skill ring effect + SVG skill effect
        const skill = EXPRESSION_TO_SKILL[expression.dominant];
        triggerSkillRing(skill);
        triggerSkillEffect(skill);

        if (skill === "punch") playSE("punch");
        else if (skill === "beam") playSE("beam");
        else playSE("punch");

        // Capture frame on skill activation (max 5)
        captureAndStore(expression.scores[expression.dominant]);

        if (lastDamage.enemyDefeated && state.currentEnemy) {
          showSpeechBubble(lastDamage.defeatLine || "...");
          playSE("enemyDefeat");
        }
      } else if (lastDamage.type === "enemy_attack") {
        triggerFlash("#e94560");
        showDamagePopup(`-${lastDamage.amount}`, "#e94560");
        triggerEnemyBounce();
        triggerCameraOverlay("#e94560");
        triggerHaptic("warning");
        playSE("enemyAttack");
      } else if (lastDamage.type === "heal") {
        showDamagePopup(`+${lastDamage.amount}`, "#4CAF50");
        triggerCameraOverlay("#4CAF50");
        triggerHaptic("light");
        playSE("heal");
        triggerSkillRing("heal");
        triggerSkillEffect("heal");
        captureAndStore(expression.scores[expression.dominant]);
      }
    }
  }, [lastDamage]);

  // Win/Lose SE + select best face
  useEffect(() => {
    if (state.phase === "win") {
      playSE("win");
      stopBGM();
      // Pick best captured frame
      const frames = capturedFramesRef.current;
      if (frames.length > 0) {
        frames.sort((a, b) => b.score - a.score);
        capturedFaceRef.current = frames[0].dataUrl;
      } else {
        const frame = captureFrame();
        if (frame) capturedFaceRef.current = frame;
      }
    } else if (state.phase === "lose") {
      playSE("gameOver");
      stopBGM();
    }
  }, [state.phase, playSE, captureFrame]);

  // Navigate to result when battle ends
  useEffect(() => {
    if (battleResult && (state.phase === "win" || state.phase === "lose")) {
      const timeout = setTimeout(() => {
        update((prev) => ({
          ...prev,
          totalPlays: prev.totalPlays + 1,
          totalPlayTime: prev.totalPlayTime + Math.round(state.elapsedTime / 1000),
          totalEnemiesDefeated: prev.totalEnemiesDefeated + state.defeatedCount,
          overallMaxCombo: Math.max(prev.overallMaxCombo, state.maxCombo),
          coins: prev.coins + battleResult.coins,
          totalCoins: prev.totalCoins + battleResult.coins,
          stageScores: {
            ...prev.stageScores,
            [stageId]: Math.max(prev.stageScores[stageId] ?? 0, battleResult.score),
          },
          stageRanks: battleResult.won ? {
            ...prev.stageRanks,
            [stageId]: battleResult.rank,
          } : prev.stageRanks,
          unlockedStages: battleResult.won
            ? [...new Set([...prev.unlockedStages, stageId, getNextStageId(stageId)])]
                .filter(Boolean) as string[]
            : prev.unlockedStages,
          lastPlayDate: new Date().toISOString().split("T")[0],
          firstPlayDate: prev.firstPlayDate || new Date().toISOString().split("T")[0],
        }));

        // Store captured face in sessionStorage for result screen (web only)
        if (Platform.OS === "web" && capturedFaceRef.current) {
          try {
            sessionStorage.setItem("face-fight-capture", capturedFaceRef.current);
          } catch {}
        }

        router.replace({
          pathname: "/result",
          params: {
            stageId,
            won: battleResult.won ? "1" : "0",
            score: String(battleResult.score),
            maxCombo: String(battleResult.maxCombo),
            defeated: String(battleResult.defeatedCount),
            total: String(battleResult.totalEnemies),
            elapsed: String(battleResult.elapsedTime),
            rank: battleResult.rank,
            coins: String(battleResult.coins),
            dailyMode,
            dominantSkill: String(battleResult.dominantSkill),
            enragedKills: String(battleResult.enragedKills),
          },
        });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [battleResult, state.phase]);

  const getNextStageId = (currentId: string): string => {
    const { STAGES } = require("../lib/data/stages");
    const idx = STAGES.findIndex((s: { id: string }) => s.id === currentId);
    if (idx < 0 || idx >= STAGES.length - 1) return currentId;
    return STAGES[idx + 1].id;
  };

  // Capture and store frame
  const captureAndStore = (score: number) => {
    const frame = captureFrame();
    if (frame) {
      const frames = capturedFramesRef.current;
      if (frames.length < 5) {
        frames.push({ dataUrl: frame, score });
      } else {
        // Replace lowest score
        const minIdx = frames.reduce((mi, f, i, arr) => f.score < arr[mi].score ? i : mi, 0);
        if (score > frames[minIdx].score) {
          frames[minIdx] = { dataUrl: frame, score };
        }
      }
    }
  };

  // Effect helpers
  const triggerFlash = (color: string) => {
    flashOpacity.setValue(0.4);
    Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  };

  const showDamagePopup = (text: string, color: string) => {
    setDamagePopText(text);
    setDamagePopColor(color);
    damagePopAnim.setValue(0);
    damagePopOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(damagePopAnim, { toValue: -60, duration: 600, useNativeDriver: true }),
      Animated.timing(damagePopOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  };

  const triggerEnemyShake = () => {
    Animated.sequence([
      Animated.timing(enemyShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(enemyShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(enemyShakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(enemyShakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(enemyShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const triggerEnemyBounce = () => {
    Animated.sequence([
      Animated.timing(enemyBounceAnim, { toValue: 30, duration: 120, useNativeDriver: true }),
      Animated.timing(enemyBounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const triggerShockwave = () => {
    shockwaveScale.setValue(0.2);
    shockwaveOpacity.setValue(0.6);
    Animated.parallel([
      Animated.timing(shockwaveScale, { toValue: 3, duration: 500, useNativeDriver: true }),
      Animated.timing(shockwaveOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const triggerCameraOverlay = (color: string) => {
    setCameraOverlayColor(color);
    cameraOverlayOpacity.setValue(0.4);
    Animated.timing(cameraOverlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  };

  const triggerSkillRing = (skill: SkillType) => {
    setSkillRingColor(SKILL_RING_COLORS[skill] ?? "transparent");
    skillRingOpacity.setValue(0.8);
    Animated.timing(skillRingOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  };

  const triggerSkillEffect = (skill: SkillType) => {
    if (skill === "idle") return;
    setActiveSkillEffect(skill);
    if (skill === "punch") {
      skillEffectScale.setValue(1);
      skillEffectOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(skillEffectScale, { toValue: 2, duration: 400, useNativeDriver: true }),
        Animated.timing(skillEffectOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setActiveSkillEffect(null));
    } else if (skill === "beam") {
      skillEffectTranslateX.setValue(0);
      skillEffectOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(skillEffectTranslateX, { toValue: SCREEN_WIDTH, duration: 400, useNativeDriver: true }),
        Animated.timing(skillEffectOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setActiveSkillEffect(null));
    } else if (skill === "barrier") {
      skillEffectScale.setValue(1);
      skillEffectOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(skillEffectOpacity, { toValue: 0.5, duration: 150, useNativeDriver: true }),
        Animated.timing(skillEffectOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => setActiveSkillEffect(null));
    } else if (skill === "heal") {
      skillEffectScale.setValue(1);
      skillEffectOpacity.setValue(1);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(skillEffectScale, { toValue: 1.5, duration: 250, useNativeDriver: true }),
          Animated.timing(skillEffectScale, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
        Animated.timing(skillEffectOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start(() => setActiveSkillEffect(null));
    }
  };

  const triggerHaptic = async (type: "impact" | "warning" | "light") => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      if (type === "impact") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === "warning") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  const showSpeechBubble = (text: string) => {
    if (speechTimeout.current) clearTimeout(speechTimeout.current);
    setSpeechBubble(text);
    speechTimeout.current = setTimeout(() => setSpeechBubble(null), 2500);
  };

  // Barrier SE
  useEffect(() => {
    if (state.barrierActive) {
      playSE("barrier");
    }
  }, [state.barrierActive, playSE]);

  const hpPercent = (state.playerHP / state.playerMaxHP) * 100;
  const enemyHpPercent = state.currentEnemy ? (state.enemyHP / state.currentEnemy.hp) * 100 : 0;
  const enemyHpRatio = state.currentEnemy ? state.enemyHP / (state.currentEnemy.hp ?? 1) : 1;

  const expressionButtons: ExpressionType[] = ["angry", "happy", "surprise", "sad"];

  const getHpColor = (percent: number) => {
    if (percent > 60) return "#4CAF50";
    if (percent > 30) return "#FFC107";
    return "#f44336";
  };

  const getEnemyHpColor = () => {
    if (enemyHpRatio > 0.5) return "#4CAF50";
    if (enemyHpRatio > 0.25) return "#FF9800";
    return "#FF1744";
  };

  // Tutorial content
  const tutorialSteps = [
    { text: "\u8868\u60C5\u3067\u6226\u304A\u3046\uFF01", sub: "\uD83D\uDE21=\u30D1\u30F3\u30C1  \uD83D\uDE0A=\u30D0\u30EA\u30A2  \uD83D\uDE32=\u30D3\u30FC\u30E0  \uD83D\uDE22=\u30D2\u30FC\u30EB" },
    { text: "\u6575\u306E\u5F31\u70B9\u8868\u60C5\u3092\u898B\u3064\u3051\u3066\u653B\u6483\uFF01", sub: "\u5F31\u70B9\u8868\u60C5\u3067\u30C0\u30E1\u30FC\u30B82\u500D\uFF01" },
    { text: "🔥 HP30%以下で激怒モード！", sub: "激怒中は攻撃が激しくなる！\n赤いダメージ表示が出たら全力攻撃のチャンス！" },
    { text: "\u30AB\u30E1\u30E9\u306B\u5411\u304B\u3063\u3066\u5909\u9854\uFF01", sub: "\u30AB\u30E1\u30E9\u306B\u6620\u308B\u81EA\u5206\u306E\u9854\u3092\u898B\u306A\u304C\u3089\u6226\u304A\u3046\uFF01\n\u30DC\u30BF\u30F3\u30BF\u30C3\u30D7\u3067\u3082\u64CD\u4F5C\u3067\u304D\u307E\u3059" },
  ];

  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const getEnemyEmoji = (enemy: { id: string; isBoss: boolean }) => {
    return ENEMY_EMOJIS[enemy.id] || (enemy.isBoss ? "\uD83D\uDC79" : "\uD83D\uDC7E");
  };

  // Expression meter bars (4-direction)
  const meterExpressions: ExpressionType[] = ["angry", "happy", "surprise", "sad"];
  const meterColors: Record<ExpressionType, string> = {
    angry: "#e94560",
    happy: "#4fc3f7",
    surprise: "#ffd700",
    sad: "#4CAF50",
    neutral: "#666",
  };

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: enrageFlashOpacity, backgroundColor: "#FF0000", zIndex: 50 }
        ]}
      />
      {/* Attack flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          {
            opacity: flashOpacity,
            backgroundColor: damagePopColor === "#e94560" ? "#e94560" : "#4fc3f7",
          },
        ]}
      />

      {/* SVG Skill effect overlay */}
      {activeSkillEffect && isFighting && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.skillEffectOverlay,
            activeSkillEffect === "beam" && {
              transform: [{ translateX: skillEffectTranslateX }],
              opacity: skillEffectOpacity,
            },
            (activeSkillEffect === "punch" || activeSkillEffect === "heal") && {
              transform: [{ scale: skillEffectScale }],
              opacity: skillEffectOpacity,
            },
            activeSkillEffect === "barrier" && {
              opacity: skillEffectOpacity,
            },
          ]}
        >
          <Svg
            width={activeSkillEffect === "beam" ? 160 : activeSkillEffect === "barrier" ? 200 : 100}
            height={activeSkillEffect === "beam" ? 24 : activeSkillEffect === "barrier" ? 200 : 100}
          >
            {activeSkillEffect === "punch" && (
              <>
                <Circle cx="50" cy="50" r="40" fill="none" stroke="#e94560" strokeWidth="4" />
                <Path d="M50,10 L54,38 L82,40 L60,58 L68,86 L50,70 L32,86 L40,58 L18,40 L46,38 Z" fill="#e94560" opacity="0.8" />
              </>
            )}
            {activeSkillEffect === "beam" && (
              <Defs>
                <LinearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#4fc3f7" stopOpacity="0" />
                  <Stop offset="0.3" stopColor="#4fc3f7" stopOpacity="1" />
                  <Stop offset="1" stopColor="#fff" stopOpacity="0.8" />
                </LinearGradient>
              </Defs>
            )}
            {activeSkillEffect === "beam" && (
              <Rect x="0" y="4" width="160" height="16" rx="8" fill="url(#beamGrad)" />
            )}
            {activeSkillEffect === "barrier" && (
              <Circle cx="100" cy="100" r="90" fill="rgba(79,195,247,0.15)" stroke="#4fc3f7" strokeWidth="3" />
            )}
            {activeSkillEffect === "heal" && (
              <>
                <Rect x="42" y="20" width="16" height="60" rx="6" fill="#fff" />
                <Rect x="20" y="42" width="60" height="16" rx="6" fill="#fff" />
              </>
            )}
          </Svg>
        </Animated.View>
      )}

      {/* Shockwave effect from bottom on player attack */}
      {isFighting && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shockwave,
            {
              transform: [{ scale: shockwaveScale }],
              opacity: shockwaveOpacity,
            },
          ]}
        />
      )}

      {/* Daily mode constraint banner */}
      {dailyMode === "1" && (
        <View style={{
          backgroundColor: "rgba(255,215,0,0.2)",
          borderBottomWidth: 1,
          borderColor: "#ffd700",
          paddingVertical: 4,
          alignItems: "center",
        }}>
          <Text style={{ color: "#ffd700", fontSize: 14, fontWeight: "bold" }}>
            {`今日の縛り: ${EXPRESSION_EMOJI[dailyConstraint as keyof typeof EXPRESSION_EMOJI] ?? "❓"}のみ！`}
          </Text>
        </View>
      )}

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.playerHpRow}>
          <Text style={styles.playerLabel}>YOU</Text>
          <View style={styles.hpBarOuter}>
            <Animated.View
              style={[
                styles.hpBarInner,
                {
                  width: playerHpAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                  backgroundColor: hpPercent > 30 ? "#4CAF50" : "#f44336",
                },
              ]}
            />
            <Text style={styles.hpText}>{state.playerHP}/{state.playerMaxHP}</Text>
          </View>
        </View>
        <View style={styles.hudRow}>
          <Text style={styles.scoreText}>Score: {state.score.toLocaleString()}</Text>
          <Text style={styles.comboText}>
            {state.combo > 0 ? `Combo: x${state.combo}` : ""}
          </Text>
          <TouchableOpacity onPress={actions.pause}>
            <Text style={styles.pauseBtn}>{"\u23F8"}</Text>
          </TouchableOpacity>
        </View>
        {state.barrierActive && (
          <View style={styles.barrierIndicator}>
            <Text style={styles.barrierText}>{"\uD83D\uDEE1\uFE0F \u30D0\u30EA\u30A2\u5C55\u958B\u4E2D"}</Text>
          </View>
        )}
      </View>

      {/* MediaPipe loading overlay */}
      {isFighting && mpStatus === "loading" && (
        <View style={styles.mpLoadingOverlay}>
          <Text style={styles.mpLoadingText}>{"\u9854\u8A8D\u8B58\u3092\u6E96\u5099\u4E2D..."}</Text>
        </View>
      )}

      {/* Tutorial overlay */}
      {showTutorial && state.phase === "ready" && (
        <TouchableOpacity
          style={styles.tutorialOverlay}
          activeOpacity={1}
          onPress={handleTutorialNext}
        >
          <View style={styles.tutorialBox}>
            <Text style={styles.tutorialTitle}>{tutorialSteps[tutorialStep].text}</Text>
            <Text style={styles.tutorialSub}>{tutorialSteps[tutorialStep].sub}</Text>
            <View style={styles.tutorialDots}>
              {tutorialSteps.map((_, i) => (
                <View key={i} style={[styles.tutorialDot, i === tutorialStep && styles.tutorialDotActive]} />
              ))}
            </View>
            <Text style={styles.tutorialTap}>
              {tutorialStep < tutorialSteps.length - 1 ? "\u30BF\u30C3\u30D7\u3067\u6B21\u3078" : "\u30BF\u30C3\u30D7\u3067\u30D0\u30C8\u30EB\u958B\u59CB\uFF01"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Phase overlays */}
      {state.phase === "intro" && stage && (
        <View style={styles.overlay}>
          <Text style={styles.phaseTitle}>{stage.name}</Text>
          <Text style={styles.phaseDesc}>{stage.description}</Text>
        </View>
      )}

      {state.phase === "ready" && !showTutorial && (
        <View style={styles.overlay}>
          <Text style={styles.readyText}>Ready?</Text>
        </View>
      )}

      {state.phase === "boss_warning" && (
        <View style={[styles.overlay, { backgroundColor: "rgba(255,0,0,0.3)" }]}>
          <Text style={styles.warningText}>WARNING!</Text>
          <Text style={styles.warningSubtext}>{"\u30DC\u30B9\u767B\u5834\uFF01"}</Text>
        </View>
      )}

      {state.phase === "paused" && (
        <View style={styles.overlay}>
          <Text style={styles.pausedTitle}>{"\u4E00\u6642\u505C\u6B62"}</Text>
          <TouchableOpacity style={styles.resumeBtn} onPress={actions.resume}>
            <Text style={styles.resumeBtnText}>{"\u518D\u958B"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quitBtn} onPress={() => { stopBGM(); router.replace("/stage-select"); }}>
            <Text style={styles.quitBtnText}>{"\u30B9\u30C6\u30FC\u30B8\u9078\u629E\u306B\u623B\u308B"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {state.phase === "win" && (
        <View style={styles.overlay}>
          <Text style={styles.winText}>{"\uD83C\uDF89 STAGE CLEAR!"}</Text>
        </View>
      )}

      {state.phase === "lose" && (
        <View style={styles.overlay}>
          <Text style={styles.loseText}>DEFEATED...</Text>
        </View>
      )}

      {/* Enemy area */}
      {state.currentEnemy && isFighting && (
        <View style={styles.enemyArea}>
          {speechBubble && (
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>{speechBubble}</Text>
              <View style={styles.speechArrow} />
            </View>
          )}

          <Animated.Text
            style={[
              styles.damagePopup,
              {
                color: damagePopColor,
                transform: [{ translateY: damagePopAnim }],
                opacity: damagePopOpacity,
              },
            ]}
          >
            {damagePopText}
          </Animated.Text>

          <Animated.View style={{
            transform: [
              { translateX: enemyShakeAnim },
              { translateY: enemyBounceAnim },
            ],
          }}>
            <Text
              style={[
                styles.enemyEmoji,
                {
                  fontSize: state.currentEnemy.isBoss
                    ? Math.min(120, SCREEN_WIDTH * 0.3)
                    : Math.min(90, SCREEN_WIDTH * 0.22) * state.currentEnemy.scale,
                },
              ]}
            >
              {getEnemyEmoji(state.currentEnemy)}
            </Text>
          </Animated.View>
          <Text style={[styles.enemyName, state.currentEnemy.isBoss && styles.bossName]}>
            {state.currentEnemy.isBoss ? `\u2605 ${state.currentEnemy.name} \u2605` : state.currentEnemy.name}
          </Text>
          <View style={styles.enemyHpBarOuter}>
            <Animated.View
              style={[
                styles.enemyHpBarInner,
                {
                  width: enemyHpAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                  backgroundColor: getEnemyHpColor(),
                },
              ]}
            />
            <Text style={styles.enemyHpValueText}>{Math.max(0, state.enemyHP)}/{state.currentEnemy.hp}</Text>
          </View>
          {enemyHpRatio <= 0.5 && (
            <Text style={styles.enragedBadge}>{"\uD83D\uDE21 \u6FC3\u6012\uFF01"}</Text>
          )}
          {state.currentEnemy && (state.enemyHP / state.currentEnemy.hp) <= 0.3 && state.enemyHP > 0 && (
            <Text style={{ color: '#FF4444', fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginTop: 2 }}>
              {'\uD83D\uDD25 \u6FC3\u6012\u30E2\u30FC\u30C9\uFF01'}
            </Text>
          )}
          <View style={styles.weaknessRow}>
            <Text style={styles.weaknessLabel}>{"\u5F31\u70B9:"}</Text>
            <View style={styles.weaknessBadge}>
              <Text style={styles.weaknessBadgeText}>
                {EXPRESSION_EMOJI[state.currentEnemy.weakness]} {EXPRESSION_LABELS[state.currentEnemy.weakness]}
              </Text>
            </View>
          </View>
          {state.currentEnemy.isCharging && (
            <View style={styles.chargeWarningBox}>
              <Text style={styles.chargeWarning}>{"\u26A0\uFE0F \u653B\u6483\u304C\u304F\u308B\uFF01"}</Text>
            </View>
          )}
        </View>
      )}

      {/* Expression prompt */}
      {state.requestedExpression && isFighting && (
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>
            {`${EXPRESSION_EMOJI[state.requestedExpression]} ${EXPRESSION_LABELS[state.requestedExpression]}\u3063\u3066\uFF01`}
          </Text>
        </View>
      )}

      {/* Camera preview area with expression meter overlay */}
      {isFighting && (
        <View style={styles.cameraPreview}>
          <View style={styles.cameraFrame}>
            {Platform.OS === "web" ? (
              <>
                {cameraReady ? (
                  <video
                    ref={(el: any) => setVideoElRef(el)}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      objectFit: "cover",
                      transform: "scaleX(-1)",
                    } as any}
                  />
                ) : (
                  <>
                    <Text style={styles.cameraEmoji}>{EXPRESSION_EMOJI[expression.dominant]}</Text>
                    {cameraError && (
                      <Text style={styles.cameraErrorText}>{"\uD83D\uDCF7"}</Text>
                    )}
                  </>
                )}
              </>
            ) : (
              <Text style={styles.cameraEmoji}>{EXPRESSION_EMOJI[expression.dominant]}</Text>
            )}
            <View style={styles.cameraOverlayCorners}>
              <View style={[styles.cameraCorner, styles.cornerTL]} />
              <View style={[styles.cameraCorner, styles.cornerTR]} />
              <View style={[styles.cameraCorner, styles.cornerBL]} />
              <View style={[styles.cameraCorner, styles.cornerBR]} />
            </View>
            {/* Camera color overlay on attack/damage */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cameraColorOverlay,
                {
                  backgroundColor: cameraOverlayColor,
                  opacity: cameraOverlayOpacity,
                },
              ]}
            />
            {/* Skill ring effect */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.skillRing,
                {
                  borderColor: skillRingColor,
                  opacity: skillRingOpacity,
                },
              ]}
            />
            {/* REC indicator */}
            <Animated.View style={[styles.recBadge, { opacity: recBlink }]}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC</Text>
            </Animated.View>
          </View>
          <Text style={styles.cameraLabel}>
            {`${EXPRESSION_EMOJI[expression.dominant]} ${EXPRESSION_LABELS[expression.dominant]} ${Math.round(expression.scores[expression.dominant] * 100)}%`}
          </Text>

          {/* Face not detected warning */}
          {!expression.faceDetected && mediaPipeReady && (
            <Text style={styles.faceWarning}>{"\u9854\u3092\u30AB\u30E1\u30E9\u306B\u5411\u3051\u3066\u304F\u3060\u3055\u3044"}</Text>
          )}

          {/* Expression meter - 4 vertical bars */}
          {(() => {
            const dominantExpr = meterExpressions.reduce((best, expr) =>
              expression.scores[expr] > expression.scores[best] ? expr : best,
              meterExpressions[0]
            );
            return (
              <View style={styles.meterContainer}>
                {meterExpressions.map((expr) => {
                  const val = expression.scores[expr];
                  const pct = Math.round(val * 100);
                  const isTop = expr === dominantExpr;
                  return (
                    <View key={expr} style={styles.meterCol}>
                      <Text style={styles.meterPct}>{pct}</Text>
                      <View style={[
                        styles.meterBarOuterV,
                        isTop && { borderColor: "gold", borderWidth: 2 },
                      ]}>
                        <View style={styles.meterBarBg}>
                          <View
                            style={[
                              styles.meterBarFill,
                              {
                                height: `${Math.min(pct, 100)}%`,
                                backgroundColor: meterColors[expr],
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[styles.meterLabelV, { color: meterColors[expr] }]}>
                        {EXPRESSION_EMOJI[expr]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </View>
      )}

      {/* Expression control cards - 2x2 grid */}
      {isFighting && (
        <View style={styles.cardGrid}>
          {expressionButtons.map((expr) => {
            const isActive = expression.dominant === expr;
            const isWeakness = state.currentEnemy?.weakness === expr;
            const skill = EXPRESSION_TO_SKILL[expr];
            const cd = state.cooldowns[skill];
            const maxCd = SKILLS[skill].cooldown;
            const ready = cd === 0;
            const cdPercent = maxCd > 0 ? (cd / maxCd) * 100 : 0;
            return (
              <TouchableOpacity
                key={expr}
                style={[
                  styles.skillCard,
                  isActive && styles.skillCardActive,
                  isWeakness && styles.skillCardWeakness,
                  !ready && styles.skillCardCooldown,
                ]}
                onPress={() => forceExpression(expr)}
                activeOpacity={0.7}
              >
                <Text style={styles.skillCardEmoji}>{EXPRESSION_EMOJI[expr]}</Text>
                <Text style={styles.skillCardName}>
                  {SKILL_ICONS[skill]} {SKILL_NAMES[skill]}
                </Text>
                <Text style={[
                  styles.skillCardDamage,
                  skill === "heal" && { color: "#4CAF50" },
                  skill === "barrier" && { color: "#4fc3f7" },
                ]}>
                  {SKILL_DAMAGE[skill]}
                </Text>
                <Text style={styles.skillGuideText}>{EXPRESSION_GUIDE[expr]}</Text>
                {isWeakness && (
                  <View style={styles.weaknessTag}>
                    <Text style={styles.weaknessTagText}>x2</Text>
                  </View>
                )}
                {!ready && (
                  <View style={styles.cardCdOverlay}>
                    <View style={[styles.cardCdBar, { height: `${cdPercent}%` }]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  shockwave: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#4fc3f7",
    backgroundColor: "rgba(79,195,247,0.15)",
    zIndex: 5,
  },
  hud: { paddingTop: 50, paddingHorizontal: 16 },
  playerHpRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  playerLabel: { color: "#4CAF50", fontSize: 12, fontWeight: "bold", width: 30 },
  hpBarOuter: { flex: 1, height: 22, backgroundColor: "#333", borderRadius: 11, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: "#555" },
  hpBarInner: { height: "100%", borderRadius: 10 },
  hpText: { position: "absolute", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 13, fontWeight: "bold", lineHeight: 22 },
  hudRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  scoreText: { color: "#ffd700", fontSize: 16, fontWeight: "bold" },
  comboText: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  pauseBtn: { color: "#fff", fontSize: 28 },
  barrierIndicator: {
    alignSelf: "center",
    backgroundColor: "rgba(79,195,247,0.2)",
    borderWidth: 1,
    borderColor: "#4fc3f7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 4,
  },
  barrierText: { color: "#4fc3f7", fontSize: 12, fontWeight: "bold" },
  // MediaPipe loading
  mpLoadingOverlay: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 15,
  },
  mpLoadingText: {
    color: "#4fc3f7",
    fontSize: 14,
    fontWeight: "bold",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  phaseTitle: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  phaseDesc: { color: "#aaa", fontSize: 16, marginTop: 8 },
  readyText: { color: "#ffd700", fontSize: 48, fontWeight: "bold" },
  warningText: { color: "#f44336", fontSize: 48, fontWeight: "bold", textShadowColor: "#f44336", textShadowRadius: 20 },
  warningSubtext: { color: "#fff", fontSize: 24, marginTop: 8 },
  pausedTitle: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 20 },
  resumeBtn: { backgroundColor: "#4CAF50", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25, marginBottom: 12 },
  resumeBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  quitBtn: { backgroundColor: "#555", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  quitBtnText: { color: "#fff", fontSize: 14 },
  winText: { color: "#ffd700", fontSize: 36, fontWeight: "bold" },
  loseText: { color: "#f44336", fontSize: 36, fontWeight: "bold" },
  enemyArea: { alignItems: "center", marginTop: 8 },
  enemyEmoji: { textAlign: "center" },
  enemyName: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 4 },
  bossName: { color: "#ffd700", fontSize: 24, textShadowColor: "#ffd700", textShadowRadius: 10 },
  enemyHpBarOuter: { width: 240, height: 18, backgroundColor: "#333", borderRadius: 9, marginTop: 6, overflow: "hidden", borderWidth: 1, borderColor: "#555", position: "relative" },
  enemyHpBarInner: { height: "100%", borderRadius: 8 },
  enemyHpValueText: { position: "absolute", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: "bold", lineHeight: 18 },
  enragedBadge: { color: "#FF1744", fontWeight: "bold", fontSize: 14, textAlign: "center", marginTop: 2 },
  weaknessRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  weaknessLabel: { color: "#aaa", fontSize: 13 },
  weaknessBadge: {
    backgroundColor: "rgba(79,195,247,0.15)",
    borderWidth: 1,
    borderColor: "#4fc3f7",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  weaknessBadgeText: { color: "#4fc3f7", fontSize: 13, fontWeight: "bold" },
  chargeWarningBox: {
    backgroundColor: "rgba(255,152,0,0.2)",
    borderWidth: 1,
    borderColor: "#ff9800",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  chargeWarning: { color: "#ff9800", fontSize: 16, fontWeight: "bold" },
  speechBubble: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    maxWidth: 250,
    position: "relative",
  },
  speechText: { color: "#333", fontSize: 14, fontWeight: "bold", textAlign: "center" },
  speechArrow: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
  damagePopup: {
    position: "absolute",
    top: -20,
    fontSize: 32,
    fontWeight: "bold",
    zIndex: 5,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 6,
  },
  promptBox: {
    alignSelf: "center",
    backgroundColor: "rgba(233,69,96,0.2)",
    borderWidth: 2,
    borderColor: "#e94560",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  promptText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  // Camera preview with expression meter
  cameraPreview: {
    alignSelf: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
    minWidth: 240,
  },
  cameraFrame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#0f3460",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cameraEmoji: { fontSize: 44 },
  cameraErrorText: {
    position: "absolute",
    bottom: 2,
    fontSize: 10,
    color: "#666",
  },
  cameraOverlayCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraCorner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: "#4fc3f7",
  },
  cornerTL: { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2 },
  cameraColorOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
  },
  skillRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 50,
    borderWidth: 4,
  },
  recBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f44336",
  },
  recText: {
    color: "#f44336",
    fontSize: 8,
    fontWeight: "bold",
  },
  cameraLabel: { color: "#aaa", fontSize: 13, marginTop: 4 },
  faceWarning: {
    color: "#ff9800",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 2,
  },
  // Expression meter (4 vertical bars)
  meterContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  meterCol: {
    alignItems: "center",
    gap: 2,
  },
  meterPct: {
    color: "#888",
    fontSize: 9,
    fontWeight: "bold",
  },
  meterBarOuterV: {
    width: 20,
    height: 60,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#444",
    padding: 1,
    overflow: "hidden",
  },
  meterBarBg: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 3,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  meterBarFill: {
    width: "100%",
    borderRadius: 3,
  },
  meterLabelV: {
    fontSize: 13,
  },
  // SVG skill effect overlay
  skillEffectOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 18,
    top: "40%",
    left: "50%",
    marginLeft: -50,
    marginTop: -50,
  },
  // 2x2 skill card grid
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  skillCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    maxWidth: 170,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2a2a4e",
    position: "relative",
    overflow: "hidden",
  },
  skillCardActive: {
    borderColor: "#e94560",
    backgroundColor: "#2a1a3e",
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  skillCardWeakness: {
    borderColor: "#4fc3f7",
    borderWidth: 3,
    shadowColor: "#4fc3f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  skillCardCooldown: {
    opacity: 0.6,
  },
  skillCardEmoji: {
    fontSize: 32,
  },
  skillCardName: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 1,
  },
  skillCardDamage: {
    color: "#e94560",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 1,
  },
  skillGuideText: {
    color: "#777",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  weaknessTag: {
    position: "absolute",
    top: 4,
    right: 6,
    backgroundColor: "#4fc3f7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  weaknessTagText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardCdOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    borderRadius: 14,
  },
  cardCdBar: {
    backgroundColor: "rgba(233,69,96,0.3)",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  tutorialBox: {
    backgroundColor: "#16213e",
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e94560",
  },
  tutorialTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  tutorialSub: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  tutorialDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  tutorialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  tutorialDotActive: {
    backgroundColor: "#e94560",
  },
  tutorialTap: {
    color: "#e94560",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "bold",
  },
});
