import { useState, useRef, useCallback, useEffect } from "react";
import { BattleState, BattlePhase, SkillType, SKILLS, EXPRESSION_SKILL_MAP, COMBO_MULTIPLIER } from "../types/battle";
import { ExpressionResult, ExpressionType } from "../types/expression";
import { EnemyData, EnemyInstance, EnemyAttack } from "../types/enemy";
import { StageData } from "../lib/data/stages";
import { ENEMIES } from "../lib/data/enemies";
import { calculatePlayerDamage, calculateEnemyDamage } from "../lib/battle/damageCalculator";
import { pickAttack } from "../lib/battle/enemyAI";
import { COMBO_TIMEOUT, comboEndBonus } from "../lib/battle/comboSystem";
import { RankGrade, RANK_THRESHOLDS } from "../types/player";

const INITIAL_STATE: BattleState = {
  phase: "intro",
  playerHP: 100,
  playerMaxHP: 100,
  currentEnemy: null,
  enemyHP: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  defeatedCount: 0,
  totalEnemies: 0,
  elapsedTime: 0,
  totalDamageTaken: 0,
  totalDamageDealt: 0,
  skillUseCounts: { punch: 0, barrier: 0, beam: 0, heal: 0, idle: 0 },
  cooldowns: { punch: 0, barrier: 0, beam: 0, heal: 0, idle: 0 },
  barrierActive: false,
  barrierRemaining: 0,
  enemyAttackTimer: 3000,
  requestedExpression: null,
  snapshots: [],
  enragedKillCount: 0,
};

function makeEnemyInstance(data: EnemyData): EnemyInstance {
  return { ...data, currentHP: data.hp, nextAttack: null, isCharging: false };
}

export interface BattleActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  processExpression: (result: ExpressionResult) => void;
}

export interface BattleResult {
  won: boolean;
  score: number;
  maxCombo: number;
  defeatedCount: number;
  totalEnemies: number;
  elapsedTime: number;
  rank: RankGrade;
  coins: number;
  totalDamageTaken: number;
  dominantSkill: SkillType;
  enragedKills: number;
}

export interface DamageEvent {
  type: "player_attack" | "enemy_attack" | "heal" | "barrier";
  amount: number;
  critical?: boolean;
  timestamp: number;
  enemyDefeated?: boolean;
  defeatLine?: string;
  skill?: SkillType;
  isEnraged?: boolean;
}

export function useBattle(stage: StageData | null, equippedPunch: string, equippedBeam: string, dailyConstraint?: string) {
  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [lastDamage, setLastDamage] = useState<DamageEvent | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const enemyQueueRef = useRef<EnemyData[]>([]);
  const lastSkillTimeRef = useRef(0);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chargeTimerRef = useRef<Record<SkillType, number>>({ punch: 0, barrier: 0, beam: 0, heal: 0, idle: 0 });
  const turnCountRef = useRef(0);

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const spawnNextEnemy = useCallback(() => {
    if (enemyQueueRef.current.length === 0) return null;
    const data = enemyQueueRef.current.shift()!;
    return makeEnemyInstance(data);
  }, []);

  const calculateRank = useCallback((s: BattleState, maxScore: number): RankGrade => {
    const scorePercent = (s.score / maxScore) * 100;
    const damagePercent = (s.totalDamageTaken / s.playerMaxHP) * 100;
    for (const t of RANK_THRESHOLDS) {
      if (scorePercent >= t.scorePercent && damagePercent <= t.maxDamagePercent && s.maxCombo >= t.minCombo) {
        return t.grade;
      }
    }
    return "D";
  }, []);

  const start = useCallback(() => {
    if (!stage) return;

    const allEnemyIds = [...stage.enemies];
    if (stage.bossId) allEnemyIds.push(stage.bossId);

    const queue: EnemyData[] = [];
    for (const eid of allEnemyIds) {
      const e = ENEMIES.find((en) => en.id === eid);
      if (e) queue.push(e);
    }

    enemyQueueRef.current = queue.slice(1);
    const first = queue[0] ? makeEnemyInstance(queue[0]) : null;

    setState({
      ...INITIAL_STATE,
      phase: "intro",
      totalEnemies: queue.length,
      currentEnemy: first,
      enemyHP: first?.hp ?? 0,
      enemyAttackTimer: first ? (pickAttack(first).interval) : 3000,
    });
    setBattleResult(null);
    setLastDamage(null);

    // Start intro sequence
    setTimeout(() => {
      setState((prev) => ({ ...prev, phase: "ready" }));
      setTimeout(() => {
        setState((prev) => {
          const isBoss = prev.currentEnemy?.isBoss;
          return { ...prev, phase: isBoss ? "boss_fight" : "fight" };
        });
      }, 1300);
    }, 1500);
  }, [stage]);

  // Game loop
  useEffect(() => {
    const s = stateRef.current;
    if (s.phase !== "fight" && s.phase !== "boss_fight") {
      stopLoop();
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== "fight" && prev.phase !== "boss_fight") return prev;
        const next = { ...prev };
        const dt = 50; // 50ms tick

        next.elapsedTime += dt;

        // Cooldown reduction
        const newCooldowns = { ...next.cooldowns };
        for (const key of Object.keys(newCooldowns) as SkillType[]) {
          if (newCooldowns[key] > 0) newCooldowns[key] = Math.max(0, newCooldowns[key] - dt);
        }
        next.cooldowns = newCooldowns;

        // Barrier timer
        if (next.barrierActive) {
          next.barrierRemaining -= dt;
          if (next.barrierRemaining <= 0) {
            next.barrierActive = false;
            next.barrierRemaining = 0;
          }
        }

        // Combo timeout
        if (next.combo > 0 && Date.now() - lastSkillTimeRef.current > COMBO_TIMEOUT) {
          next.score += comboEndBonus(next.combo);
          next.combo = 0;
        }

        // Enemy attack timer
        if (next.currentEnemy) {
          next.enemyAttackTimer -= dt;
          if (next.enemyAttackTimer <= 0) {
            const enemyHpRatio = next.enemyHP / (next.currentEnemy?.hp ?? 100);
            turnCountRef.current += 1;
            const attack = pickAttack(next.currentEnemy, enemyHpRatio, turnCountRef.current);
            const dmg = calculateEnemyDamage(attack, next.barrierActive, SKILLS.barrier.basePower);

            if (attack.type === "heal" && attack.healAmount) {
              const healed = Math.min(next.currentEnemy.hp, next.currentEnemy.currentHP + attack.healAmount);
              next.currentEnemy = { ...next.currentEnemy, currentHP: healed };
              next.enemyHP = healed;
            } else if (attack.type === "rapid" && attack.hitCount) {
              let totalDmg = 0;
              for (let i = 0; i < attack.hitCount; i++) {
                const hitDmg = calculateEnemyDamage({ ...attack, damage: attack.damage }, next.barrierActive, SKILLS.barrier.basePower);
                next.playerHP -= hitDmg;
                next.totalDamageTaken += hitDmg;
                totalDmg += hitDmg;
                if (!next.barrierActive && hitDmg > 0) next.combo = 0;
              }
              if (totalDmg > 0) {
                setLastDamage({ type: "enemy_attack", amount: totalDmg, timestamp: Date.now() });
              }
            } else {
              next.playerHP -= dmg;
              next.totalDamageTaken += dmg;
              if (!next.barrierActive && dmg > 0) next.combo = 0;
              if (dmg > 0) {
                setLastDamage({ type: "enemy_attack", amount: dmg, timestamp: Date.now() });
              }
            }

            if (attack.type === "debuff" && !next.barrierActive) {
              const dc = { ...next.cooldowns };
              for (const key of Object.keys(dc) as SkillType[]) {
                dc[key] += 500;
              }
              next.cooldowns = dc;
            }

            next.enemyAttackTimer = attack.interval;
            next.playerHP = Math.max(0, next.playerHP);

            if (next.playerHP <= 0) {
              next.phase = "lose";
            }
          }
        }

        return next;
      });
    }, 50);

    return stopLoop;
  }, [state.phase, stopLoop]);

  const processExpression = useCallback((result: ExpressionResult) => {
    if (!result.faceDetected) return;

    setState((prev) => {
      if (prev.phase !== "fight" && prev.phase !== "boss_fight") return prev;
      if (!prev.currentEnemy) return prev;

      const next = { ...prev };
      const expr = result.dominant;
      const skill = EXPRESSION_SKILL_MAP[expr];
      const skillData = SKILLS[skill];

      // Check threshold
      const threshold = 0.40;
      if (result.scores[expr] < threshold) return prev;

      // Daily constraint check
      if (dailyConstraint && expr !== dailyConstraint && expr !== "neutral" && expr !== "idle") {
        return prev; // 縛り外の表情は不発
      }

      // Check cooldown
      if (next.cooldowns[skill] > 0) return prev;
      if (skill === "idle") return prev;

      // Apply skill
      const newCooldowns = { ...next.cooldowns };
      newCooldowns[skill] = skillData.cooldown;
      next.cooldowns = newCooldowns;

      const counts = { ...next.skillUseCounts };
      counts[skill] += 1;
      next.skillUseCounts = counts;

      lastSkillTimeRef.current = Date.now();
      next.combo += 1;
      if (next.combo > next.maxCombo) next.maxCombo = next.combo;

      if (skill === "barrier") {
        next.barrierActive = true;
        next.barrierRemaining = 2000;
        setLastDamage({ type: "barrier", amount: 0, timestamp: Date.now(), skill: "barrier" });
      } else if (skill === "heal") {
        const healAmount = skillData.basePower;
        next.playerHP = Math.min(next.playerMaxHP, next.playerHP + healAmount);
        setLastDamage({ type: "heal", amount: healAmount, timestamp: Date.now(), skill: "heal" });
      } else if (skill === "punch" || skill === "beam") {
        const effect = skill === "punch" ? equippedPunch : equippedBeam;
        const enemyHpRatioNow = next.currentEnemy
          ? next.enemyHP / (next.currentEnemy.hp ?? 100)
          : 1;
        const isEnragedNow = enemyHpRatioNow <= 0.30 && next.enemyHP > 0;

        const dmgResult = calculatePlayerDamage(skillData, result.scores[expr], next.combo, next.currentEnemy!, effect);
        const finalDamage = isEnragedNow ? Math.round(dmgResult.damage * 2) : dmgResult.damage;

        next.enemyHP -= finalDamage;
        next.totalDamageDealt += finalDamage;
        next.score += dmgResult.critical ? 50 : 0;

        if (next.currentEnemy) {
          next.currentEnemy = { ...next.currentEnemy, currentHP: Math.max(0, next.enemyHP) };
        }

        const enemyDefeated = next.enemyHP <= 0;

        setLastDamage({
          type: "player_attack",
          amount: finalDamage,
          critical: dmgResult.critical,
          timestamp: Date.now(),
          enemyDefeated,
          defeatLine: enemyDefeated ? next.currentEnemy?.defeatLine : undefined,
          skill,
          isEnraged: isEnragedNow,
        });

        if (enemyDefeated && isEnragedNow) {
          next.enragedKillCount += 1;
        }

        if (enemyDefeated) {
          // Enemy defeated
          next.score += next.currentEnemy!.scoreReward;
          next.defeatedCount += 1;

          if (next.totalDamageTaken === 0) {
            next.score += 200; // No damage bonus
          }

          const nextEnemy = enemyQueueRef.current.length > 0 ? enemyQueueRef.current.shift()! : null;
          if (nextEnemy) {
            const inst = makeEnemyInstance(nextEnemy);
            if (inst.isBoss) {
              next.phase = "boss_warning";
              turnCountRef.current = 0;
              setTimeout(() => {
                setState((p) => ({
                  ...p,
                  phase: "boss_fight",
                  currentEnemy: inst,
                  enemyHP: inst.hp,
                  enemyAttackTimer: pickAttack(inst).interval,
                }));
              }, 2000);
              next.currentEnemy = null;
              next.enemyHP = 0;
            } else {
              turnCountRef.current = 0;
              next.currentEnemy = inst;
              next.enemyHP = inst.hp;
              next.enemyAttackTimer = pickAttack(inst).interval;
            }
          } else {
            // Stage clear!
            next.phase = "win";

            // Time bonus
            const secs = next.elapsedTime / 1000;
            if (secs <= 60) next.score += 2000;
            else if (secs <= 90) next.score += 1000;
            else if (secs <= 120) next.score += 500;

            // Perfect bonus
            if (next.totalDamageTaken === 0) next.score += 3000;

            // Combo end bonus
            if (next.combo > 0) {
              next.score += comboEndBonus(next.combo);
            }

            const rank = calculateRank(next, stage?.maxScore ?? 10000);
            const rankMultiplier = rank === "S" ? 2.0 : rank === "A" ? 1.5 : rank === "B" ? 1.2 : rank === "C" ? 1.0 : 0.8;
            let totalCoins = 0;
            // Sum coin rewards of all defeated enemies (approximate)
            if (stage) {
              const allIds = [...stage.enemies];
              if (stage.bossId) allIds.push(stage.bossId);
              for (const eid of allIds) {
                const e = ENEMIES.find((en) => en.id === eid);
                if (e) totalCoins += e.coinReward;
              }
            }
            totalCoins = Math.round(totalCoins * rankMultiplier);

            const skillEntries = Object.entries(next.skillUseCounts) as [SkillType, number][];
            const dominantSkill = skillEntries
              .filter(([k]) => k !== "idle")
              .sort(([,a],[,b]) => b - a)[0]?.[0] ?? "punch";

            setBattleResult({
              won: true,
              score: next.score,
              maxCombo: next.maxCombo,
              defeatedCount: next.defeatedCount,
              totalEnemies: next.totalEnemies,
              elapsedTime: next.elapsedTime,
              rank,
              coins: totalCoins,
              totalDamageTaken: next.totalDamageTaken,
              dominantSkill,
              enragedKills: next.enragedKillCount,
            });
          }
        }
      }

      // Set requested expression randomly for guidance
      const expressions: ExpressionType[] = ["angry", "happy", "surprise", "sad"];
      next.requestedExpression = expressions[Math.floor(Math.random() * expressions.length)];

      return next;
    });
  }, [equippedPunch, equippedBeam, stage, calculateRank]);

  const pause = useCallback(() => {
    setState((prev) => (prev.phase === "fight" || prev.phase === "boss_fight" ? { ...prev, phase: "paused" } : prev));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "paused") return prev;
      const wasInBoss = prev.currentEnemy?.isBoss;
      return { ...prev, phase: wasInBoss ? "boss_fight" : "fight" };
    });
  }, []);

  // Handle lose result
  useEffect(() => {
    if (state.phase === "lose" && !battleResult) {
      const rank = calculateRank(state, stage?.maxScore ?? 10000);
      const skillEntries = Object.entries(state.skillUseCounts) as [SkillType, number][];
      const dominantSkill = skillEntries
        .filter(([k]) => k !== "idle")
        .sort(([,a],[,b]) => b - a)[0]?.[0] ?? "punch";
      setBattleResult({
        won: false,
        score: state.score,
        maxCombo: state.maxCombo,
        defeatedCount: state.defeatedCount,
        totalEnemies: state.totalEnemies,
        elapsedTime: state.elapsedTime,
        rank,
        coins: 0,
        totalDamageTaken: state.totalDamageTaken,
        dominantSkill,
        enragedKills: state.enragedKillCount,
      });
    }
  }, [state.phase, battleResult, state, stage, calculateRank]);

  return {
    state,
    battleResult,
    lastDamage,
    actions: { start, pause, resume, processExpression },
  };
}
