import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useBattle } from "../hooks/useBattle";
import { useExpression } from "../hooks/useExpression";
import { usePlayerData } from "../hooks/useStorage";
import { useBattleSE } from "../hooks/useBattleSE";
import { useWebCamera } from "../hooks/useWebCamera";
import { getStage } from "../lib/battle/stageManager";
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

// Guide text for each expression button
const EXPRESSION_GUIDE: Record<ExpressionType, string> = {
  angry: "\u773C\u3092\u3064\u308A\u4E0A\u3052\u3066\uFF01",
  happy: "\u30CB\u30B3\u30C3\u3068\u7B11\u3063\u3066\uFF01",
  surprise: "\u53E3\u3092\u5927\u304D\u304F\u958B\u3051\u3066\uFF01",
  sad: "\u53E3\u89D2\u3092\u4E0B\u3052\u3066\uFF01",
  neutral: "",
};

// Enemy display emoji based on type
const ENEMY_EMOJIS: Record<string, string> = {
  e_slime: "\uD83D\uDFE2",
  e_wooden_dummy: "\uD83E\uDEAB",
  e_ninja: "\uD83E\uDD77",
  e_sumo: "\uD83D\uDCAA",
  e_boss_sensei: "\uD83E\uDD4B",
  e_fire_imp: "\uD83D\uDD25",
  e_lava_golem: "\uD83C\uDF0B",
  e_flame_dancer: "\uD83D\uDC83",
  e_boss_volcano_dragon: "\uD83D\uDC32",
  e_clown: "\uD83E\uDD21",
  e_puppet: "\uD83E\uDE86",
  e_mirror: "\uD83E\uDE9E",
  e_boss_ringmaster: "\uD83C\uDFA9",
  e_alien: "\uD83D\uDC7D",
  e_space_jellyfish: "\uD83E\uDEBC",
  e_boss_cosmos_emperor: "\uD83D\uDE80",
  e_emotion_ghost: "\uD83D\uDC7B",
  e_boss_emotion_king: "\uD83D\uDC51",
};

export default function BattleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stageId: string }>();
  const stageId = params.stageId ?? "stage_1_1";
  const stage = getStage(stageId) ?? null;
  const { player, update } = usePlayerData();
  const { state, battleResult, lastDamage, actions } = useBattle(stage, player.equippedPunchEffect, player.equippedBeamEffect);
  const { expression, forceExpression } = useExpression(
    state.phase === "fight" || state.phase === "boss_fight"
  );
  const { playSE } = useBattleSE();

  const isFighting = state.phase === "fight" || state.phase === "boss_fight";

  // Web camera
  const { videoRef: setVideoRef, cameraReady, cameraError, captureFrame } = useWebCamera(isFighting);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Captured face for result
  const capturedFaceRef = useRef<string | null>(null);

  // Animation refs
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const damagePopAnim = useRef(new Animated.Value(0)).current;
  const damagePopOpacity = useRef(new Animated.Value(0)).current;
  const [damagePopText, setDamagePopText] = useState("");
  const [damagePopColor, setDamagePopColor] = useState("#fff");
  const enemyShakeAnim = useRef(new Animated.Value(0)).current;
  const playerHpAnim = useRef(new Animated.Value(100)).current;
  const enemyHpAnim = useRef(new Animated.Value(100)).current;

  // Enemy bounce animation (attack)
  const enemyBounceAnim = useRef(new Animated.Value(0)).current;
  // Shockwave animation (player attack)
  const shockwaveScale = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  // REC blink animation
  const recBlink = useRef(new Animated.Value(1)).current;
  // Camera overlay color animation
  const cameraOverlayOpacity = useRef(new Animated.Value(0)).current;
  const [cameraOverlayColor, setCameraOverlayColor] = useState("#4fc3f7");

  // Enemy speech bubble
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track last enemy for enter/defeat lines
  const lastEnemyId = useRef<string | null>(null);

  // Track last combo for combo SE
  const lastCombo = useRef(0);

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
    Animated.timing(playerHpAnim, {
      toValue: hpPct,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state.playerHP]);

  useEffect(() => {
    const enemyHpPct = state.currentEnemy ? (state.enemyHP / state.currentEnemy.hp) * 100 : 0;
    Animated.timing(enemyHpAnim, {
      toValue: Math.max(0, enemyHpPct),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state.enemyHP, state.currentEnemy]);

  // Handle damage effects + SE
  useEffect(() => {
    if (lastDamage) {
      if (lastDamage.type === "player_attack") {
        triggerFlash("#4fc3f7");
        showDamagePopup(`-${lastDamage.amount}${lastDamage.critical ? "!!" : ""}`, lastDamage.critical ? "#ffd700" : "#4fc3f7");
        triggerEnemyShake();
        triggerShockwave();
        triggerCameraOverlay("#4fc3f7");
        triggerHaptic("impact");

        // Determine skill SE from current expression
        const skill = EXPRESSION_TO_SKILL[expression.dominant];
        if (skill === "punch") playSE("punch");
        else if (skill === "beam") playSE("beam");
        else playSE("punch");

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
      }
    }
  }, [lastDamage]);

  // Win/Lose SE + capture face on win
  useEffect(() => {
    if (state.phase === "win") {
      playSE("win");
      // Capture face screenshot on victory
      const frame = captureFrame();
      if (frame) {
        capturedFaceRef.current = frame;
      }
    } else if (state.phase === "lose") {
      playSE("gameOver");
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

  // Effect helpers
  const triggerFlash = (color: string) => {
    flashOpacity.setValue(0.4);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const showDamagePopup = (text: string, color: string) => {
    setDamagePopText(text);
    setDamagePopColor(color);
    damagePopAnim.setValue(0);
    damagePopOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(damagePopAnim, {
        toValue: -60,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(damagePopOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
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
    Animated.timing(cameraOverlayOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
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

  // Expression buttons for web testing
  const expressionButtons: ExpressionType[] = ["angry", "happy", "surprise", "sad"];

  // Get enemy color based on HP percentage
  const getHpColor = (percent: number) => {
    if (percent > 60) return "#4CAF50";
    if (percent > 30) return "#FFC107";
    return "#f44336";
  };

  // Tutorial content
  const tutorialSteps = [
    { text: "\u8868\u60C5\u3067\u6226\u304A\u3046\uFF01", sub: "\uD83D\uDE21=\u30D1\u30F3\u30C1  \uD83D\uDE0A=\u30D0\u30EA\u30A2  \uD83D\uDE32=\u30D3\u30FC\u30E0  \uD83D\uDE22=\u30D2\u30FC\u30EB" },
    { text: "\u6575\u306E\u5F31\u70B9\u8868\u60C5\u3092\u898B\u3064\u3051\u3066\u653B\u6483\uFF01", sub: "\u5F31\u70B9\u8868\u60C5\u3067\u30C0\u30E1\u30FC\u30B82\u500D\uFF01" },
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

  return (
    <View style={styles.container}>
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
        {/* Barrier indicator */}
        {state.barrierActive && (
          <View style={styles.barrierIndicator}>
            <Text style={styles.barrierText}>{"\uD83D\uDEE1\uFE0F \u30D0\u30EA\u30A2\u5C55\u958B\u4E2D"}</Text>
          </View>
        )}
      </View>

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
          <TouchableOpacity style={styles.quitBtn} onPress={() => router.replace("/stage-select")}>
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

      {/* Enemy area - enlarged */}
      {state.currentEnemy && isFighting && (
        <View style={styles.enemyArea}>
          {/* Speech bubble */}
          {speechBubble && (
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>{speechBubble}</Text>
              <View style={styles.speechArrow} />
            </View>
          )}

          {/* Damage popup */}
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
          <Text style={[
            styles.enemyName,
            state.currentEnemy.isBoss && styles.bossName,
          ]}>
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
                  backgroundColor: getHpColor(enemyHpPercent),
                },
              ]}
            />
            <Text style={styles.enemyHpValueText}>{Math.max(0, state.enemyHP)}/{state.currentEnemy.hp}</Text>
          </View>
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

      {/* Camera preview area with real camera (web) or emoji fallback */}
      {isFighting && (
        <View style={styles.cameraPreview}>
          <View style={styles.cameraFrame}>
            {/* Web: real camera feed */}
            {Platform.OS === "web" ? (
              <>
                {cameraReady ? (
                  <video
                    ref={(el: any) => setVideoRef(el)}
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
            {/* REC indicator */}
            <Animated.View style={[styles.recBadge, { opacity: recBlink }]}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC</Text>
            </Animated.View>
          </View>
          <Text style={styles.cameraLabel}>
            {`${EXPRESSION_EMOJI[expression.dominant]} ${EXPRESSION_LABELS[expression.dominant]} ${Math.round(expression.scores[expression.dominant] * 100)}%`}
          </Text>
          <View style={styles.detectionBar}>
            <View style={[styles.detectionFill, { width: `${expression.scores[expression.dominant] * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Expression control cards - 2x2 grid with guide text */}
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
                {/* Face guide text */}
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
  // Camera preview with REC
  cameraPreview: {
    alignSelf: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
    minWidth: 200,
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
  detectionBar: {
    width: 160,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginTop: 3,
    overflow: "hidden",
  },
  detectionFill: {
    height: "100%",
    backgroundColor: "#4fc3f7",
    borderRadius: 2,
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
  // Tutorial styles
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
