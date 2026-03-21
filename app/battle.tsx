import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useBattle } from "../hooks/useBattle";
import { useExpression } from "../hooks/useExpression";
import { usePlayerData } from "../hooks/useStorage";
import { getStage } from "../lib/battle/stageManager";
import { ExpressionType } from "../types/expression";
import { SkillType } from "../types/battle";

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

const EXPRESSION_SKILL_LABELS: Record<ExpressionType, { skill: string; icon: string }> = {
  angry: { skill: "\u30D1\u30F3\u30C1", icon: "\uD83D\uDC4A" },
  happy: { skill: "\u30D0\u30EA\u30A2", icon: "\uD83D\uDEE1\uFE0F" },
  surprise: { skill: "\u30D3\u30FC\u30E0", icon: "\u26A1" },
  sad: { skill: "\u30D2\u30FC\u30EB", icon: "\uD83D\uDCA7" },
  neutral: { skill: "", icon: "" },
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

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Animation refs
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const damagePopAnim = useRef(new Animated.Value(0)).current;
  const damagePopOpacity = useRef(new Animated.Value(0)).current;
  const [damagePopText, setDamagePopText] = useState("");
  const [damagePopColor, setDamagePopColor] = useState("#fff");
  const enemyShakeAnim = useRef(new Animated.Value(0)).current;
  const playerHpAnim = useRef(new Animated.Value(100)).current;
  const enemyHpAnim = useRef(new Animated.Value(100)).current;

  // Enemy speech bubble
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track last enemy for enter/defeat lines
  const lastEnemyId = useRef<string | null>(null);

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

  // Animate HP bars
  useEffect(() => {
    const hpPercent = (state.playerHP / state.playerMaxHP) * 100;
    Animated.timing(playerHpAnim, {
      toValue: hpPercent,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state.playerHP]);

  useEffect(() => {
    const enemyHpPercent = state.currentEnemy ? (state.enemyHP / state.currentEnemy.hp) * 100 : 0;
    Animated.timing(enemyHpAnim, {
      toValue: Math.max(0, enemyHpPercent),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state.enemyHP, state.currentEnemy]);

  // Handle damage effects
  useEffect(() => {
    if (lastDamage) {
      if (lastDamage.type === "player_attack") {
        // Flash blue, show damage popup on enemy
        triggerFlash("#4fc3f7");
        showDamagePopup(`-${lastDamage.amount}${lastDamage.critical ? "!!" : ""}`, lastDamage.critical ? "#ffd700" : "#4fc3f7");
        triggerEnemyShake();
        triggerHaptic("impact");

        // Show defeat line if enemy defeated
        if (lastDamage.enemyDefeated && state.currentEnemy) {
          showSpeechBubble(lastDamage.defeatLine || "...");
        }
      } else if (lastDamage.type === "enemy_attack") {
        // Flash red
        triggerFlash("#e94560");
        showDamagePopup(`-${lastDamage.amount}`, "#e94560");
        triggerHaptic("warning");
      } else if (lastDamage.type === "heal") {
        showDamagePopup(`+${lastDamage.amount}`, "#4CAF50");
        triggerHaptic("light");
      }
    }
  }, [lastDamage]);

  // Navigate to result when battle ends
  useEffect(() => {
    if (battleResult && (state.phase === "win" || state.phase === "lose")) {
      const timeout = setTimeout(() => {
        // Save data
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
    { text: "\u30B3\u30F3\u30DC\u3092\u7E4B\u3052\u3066\u30C0\u30E1\u30FC\u30B8UP\uFF01", sub: "\u7D20\u65E9\u304F\u8868\u60C5\u3092\u5207\u308A\u66FF\u3048\u308D\uFF01" },
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

      {/* HUD */}
      <View style={styles.hud}>
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

      {/* Enemy area */}
      {state.currentEnemy && (state.phase === "fight" || state.phase === "boss_fight") && (
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

          <Animated.View style={{ transform: [{ translateX: enemyShakeAnim }] }}>
            <Text
              style={[
                styles.enemyEmoji,
                {
                  fontSize: state.currentEnemy.isBoss ? 72 : 48 * state.currentEnemy.scale,
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
          </View>
          <Text style={styles.enemyHpText}>{Math.max(0, state.enemyHP)}/{state.currentEnemy.hp}</Text>
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
      {state.requestedExpression && (state.phase === "fight" || state.phase === "boss_fight") && (
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>
            {`${EXPRESSION_EMOJI[state.requestedExpression]} ${EXPRESSION_LABELS[state.requestedExpression]}\u3063\u3066\uFF01`}
          </Text>
        </View>
      )}

      {/* Camera preview area */}
      {(state.phase === "fight" || state.phase === "boss_fight") && (
        <View style={styles.cameraPreview}>
          <View style={styles.cameraFrame}>
            <Text style={styles.cameraEmoji}>{EXPRESSION_EMOJI[expression.dominant]}</Text>
            <View style={styles.cameraOverlayCorners}>
              <View style={[styles.cameraCorner, styles.cornerTL]} />
              <View style={[styles.cameraCorner, styles.cornerTR]} />
              <View style={[styles.cameraCorner, styles.cornerBL]} />
              <View style={[styles.cameraCorner, styles.cornerBR]} />
            </View>
          </View>
          <Text style={styles.cameraLabel}>
            {`${EXPRESSION_EMOJI[expression.dominant]} ${EXPRESSION_LABELS[expression.dominant]} ${Math.round(expression.scores[expression.dominant] * 100)}%`}
          </Text>
          <View style={styles.detectionBar}>
            <View style={[styles.detectionFill, { width: `${expression.scores[expression.dominant] * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Expression control buttons (improved with labels) */}
      {(state.phase === "fight" || state.phase === "boss_fight") && (
        <View style={styles.expressionBtnRow}>
          {expressionButtons.map((expr) => {
            const isActive = expression.dominant === expr;
            const isWeakness = state.currentEnemy?.weakness === expr;
            return (
              <TouchableOpacity
                key={expr}
                style={[
                  styles.expressionBtn,
                  isActive && styles.expressionBtnActive,
                  isWeakness && styles.expressionBtnWeakness,
                ]}
                onPress={() => forceExpression(expr)}
              >
                <Text style={styles.expressionBtnEmoji}>
                  {EXPRESSION_EMOJI[expr]}
                </Text>
                <Text style={[styles.expressionBtnLabel, isActive && styles.expressionBtnLabelActive]}>
                  {EXPRESSION_SKILL_LABELS[expr].icon} {EXPRESSION_SKILL_LABELS[expr].skill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Skill cooldown bars */}
      {(state.phase === "fight" || state.phase === "boss_fight") && (
        <View style={styles.skillBar}>
          {(["punch", "barrier", "beam", "heal"] as SkillType[]).map((skill) => {
            const maxCd = skill === "punch" ? 800 : skill === "barrier" ? 1500 : skill === "beam" ? 2000 : 3000;
            const cd = state.cooldowns[skill];
            const ready = cd === 0;
            return (
              <View key={skill} style={styles.skillSlot}>
                <Text style={[styles.skillIcon, !ready && styles.skillOnCd]}>
                  {SKILL_ICONS[skill]}
                </Text>
                {!ready && (
                  <View style={styles.cdBarOuter}>
                    <View style={[styles.cdBarInner, { width: `${(cd / maxCd) * 100}%` }]} />
                  </View>
                )}
                {ready && <View style={styles.readyDot} />}
                <Text style={styles.skillName}>{SKILL_NAMES[skill]}</Text>
              </View>
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
  hud: { paddingTop: 50, paddingHorizontal: 16 },
  hpBarOuter: { height: 20, backgroundColor: "#333", borderRadius: 10, overflow: "hidden", position: "relative" },
  hpBarInner: { height: "100%", borderRadius: 10 },
  hpText: { position: "absolute", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: "bold", lineHeight: 20 },
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
  enemyArea: { alignItems: "center", marginTop: 12 },
  enemyEmoji: { textAlign: "center" },
  enemyName: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  bossName: { color: "#ffd700", fontSize: 22, textShadowColor: "#ffd700", textShadowRadius: 8 },
  enemyHpBarOuter: { width: 200, height: 14, backgroundColor: "#333", borderRadius: 7, marginTop: 6, overflow: "hidden", borderWidth: 1, borderColor: "#555" },
  enemyHpBarInner: { height: "100%", borderRadius: 6 },
  enemyHpText: { color: "#aaa", fontSize: 12, marginTop: 2 },
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
    fontSize: 28,
    fontWeight: "bold",
    zIndex: 5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  promptBox: {
    alignSelf: "center",
    backgroundColor: "rgba(233,69,96,0.2)",
    borderWidth: 2,
    borderColor: "#e94560",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  promptText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  cameraPreview: {
    alignSelf: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
    minWidth: 200,
  },
  cameraFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0f3460",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cameraEmoji: { fontSize: 42 },
  cameraOverlayCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraCorner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: "#4fc3f7",
  },
  cornerTL: { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2 },
  cameraLabel: { color: "#aaa", fontSize: 13, marginTop: 6 },
  detectionBar: {
    width: 140,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  detectionFill: {
    height: "100%",
    backgroundColor: "#4fc3f7",
    borderRadius: 2,
  },
  expressionBtnRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  expressionBtn: {
    flex: 1,
    maxWidth: 90,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  expressionBtnActive: { borderColor: "#e94560", backgroundColor: "#2a1a3e" },
  expressionBtnWeakness: { borderColor: "#4fc3f7" },
  expressionBtnEmoji: { fontSize: 28 },
  expressionBtnLabel: { color: "#888", fontSize: 10, marginTop: 2, fontWeight: "bold" },
  expressionBtnLabelActive: { color: "#e94560" },
  skillBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 10,
    paddingBottom: 30,
  },
  skillSlot: { alignItems: "center", width: 60 },
  skillIcon: { fontSize: 28 },
  skillOnCd: { opacity: 0.3 },
  cdBarOuter: { width: 50, height: 4, backgroundColor: "#333", borderRadius: 2, marginTop: 2 },
  cdBarInner: { height: "100%", backgroundColor: "#e94560", borderRadius: 2 },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginTop: 2,
  },
  skillName: { color: "#aaa", fontSize: 10, marginTop: 2 },
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
