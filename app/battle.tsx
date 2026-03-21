import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
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

export default function BattleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stageId: string }>();
  const stageId = params.stageId ?? "stage_1_1";
  const stage = getStage(stageId) ?? null;
  const { player, update } = usePlayerData();
  const { state, battleResult, actions } = useBattle(stage, player.equippedPunchEffect, player.equippedBeamEffect);
  const { expression, forceExpression } = useExpression(
    state.phase === "fight" || state.phase === "boss_fight"
  );

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

  const hpPercent = (state.playerHP / state.playerMaxHP) * 100;
  const enemyHpPercent = state.currentEnemy ? (state.enemyHP / state.currentEnemy.hp) * 100 : 0;

  // Expression buttons for web testing
  const expressionButtons: ExpressionType[] = ["angry", "happy", "surprise", "sad"];

  return (
    <View style={styles.container}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hpBarOuter}>
          <View style={[styles.hpBarInner, { width: `${hpPercent}%`, backgroundColor: hpPercent > 30 ? "#4CAF50" : "#f44336" }]} />
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
      </View>

      {/* Phase overlays */}
      {state.phase === "intro" && stage && (
        <View style={styles.overlay}>
          <Text style={styles.phaseTitle}>{stage.name}</Text>
          <Text style={styles.phaseDesc}>{stage.description}</Text>
        </View>
      )}

      {state.phase === "ready" && (
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
          <Text style={[styles.enemyEmoji, { fontSize: 48 * state.currentEnemy.scale }]}>
            {state.currentEnemy.isBoss ? "\uD83D\uDC79" : "\uD83D\uDC7E"}
          </Text>
          <Text style={styles.enemyName}>{state.currentEnemy.name}</Text>
          <View style={styles.enemyHpBarOuter}>
            <View style={[styles.enemyHpBarInner, { width: `${Math.max(0, enemyHpPercent)}%` }]} />
          </View>
          <Text style={styles.enemyHpText}>{Math.max(0, state.enemyHP)}/{state.currentEnemy.hp}</Text>
          <Text style={styles.weakness}>
            {`\u5F31\u70B9: ${EXPRESSION_EMOJI[state.currentEnemy.weakness]} ${EXPRESSION_LABELS[state.currentEnemy.weakness]}`}
          </Text>
          {state.currentEnemy.isCharging && (
            <Text style={styles.chargeWarning}>{"\u26A0\uFE0F \u653B\u6483\u304C\u304F\u308B\uFF01"}</Text>
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

      {/* Camera preview mock (expression status) */}
      {(state.phase === "fight" || state.phase === "boss_fight") && (
        <View style={styles.cameraPreview}>
          <Text style={styles.cameraEmoji}>{EXPRESSION_EMOJI[expression.dominant]}</Text>
          <Text style={styles.cameraLabel}>
            {`\u691C\u51FA: ${EXPRESSION_EMOJI[expression.dominant]} ${EXPRESSION_LABELS[expression.dominant]} ${Math.round(expression.scores[expression.dominant] * 100)}%`}
          </Text>
        </View>
      )}

      {/* Expression control buttons (for web testing) */}
      {(state.phase === "fight" || state.phase === "boss_fight") && (
        <View style={styles.expressionBtnRow}>
          {expressionButtons.map((expr) => (
            <TouchableOpacity
              key={expr}
              style={[
                styles.expressionBtn,
                expression.dominant === expr && styles.expressionBtnActive,
              ]}
              onPress={() => forceExpression(expr)}
            >
              <Text style={styles.expressionBtnText}>
                {EXPRESSION_EMOJI[expr]}
              </Text>
            </TouchableOpacity>
          ))}
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
  hud: { paddingTop: 50, paddingHorizontal: 16 },
  hpBarOuter: { height: 20, backgroundColor: "#333", borderRadius: 10, overflow: "hidden", position: "relative" },
  hpBarInner: { height: "100%", borderRadius: 10 },
  hpText: { position: "absolute", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: "bold", lineHeight: 20 },
  hudRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  scoreText: { color: "#ffd700", fontSize: 16, fontWeight: "bold" },
  comboText: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  pauseBtn: { color: "#fff", fontSize: 28 },
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
  enemyArea: { alignItems: "center", marginTop: 20 },
  enemyEmoji: { textAlign: "center" },
  enemyName: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  enemyHpBarOuter: { width: 200, height: 12, backgroundColor: "#333", borderRadius: 6, marginTop: 6, overflow: "hidden" },
  enemyHpBarInner: { height: "100%", backgroundColor: "#e94560", borderRadius: 6 },
  enemyHpText: { color: "#aaa", fontSize: 12, marginTop: 2 },
  weakness: { color: "#4fc3f7", fontSize: 14, marginTop: 4 },
  chargeWarning: { color: "#ff9800", fontSize: 16, fontWeight: "bold", marginTop: 6 },
  promptBox: {
    alignSelf: "center",
    backgroundColor: "rgba(233,69,96,0.2)",
    borderWidth: 2,
    borderColor: "#e94560",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  promptText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  cameraPreview: {
    alignSelf: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
    minWidth: 200,
  },
  cameraEmoji: { fontSize: 48 },
  cameraLabel: { color: "#aaa", fontSize: 14, marginTop: 8 },
  expressionBtnRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  expressionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  expressionBtnActive: { borderColor: "#e94560", backgroundColor: "#2a1a3e" },
  expressionBtnText: { fontSize: 24 },
  skillBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
    paddingBottom: 30,
  },
  skillSlot: { alignItems: "center", width: 60 },
  skillIcon: { fontSize: 28 },
  skillOnCd: { opacity: 0.3 },
  cdBarOuter: { width: 50, height: 4, backgroundColor: "#333", borderRadius: 2, marginTop: 2 },
  cdBarInner: { height: "100%", backgroundColor: "#e94560", borderRadius: 2 },
  skillName: { color: "#aaa", fontSize: 10, marginTop: 2 },
});
