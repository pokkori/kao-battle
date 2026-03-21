import { STAGES, StageData } from "../data/stages";
import { ENEMIES } from "../data/enemies";
import { EnemyData } from "../../types/enemy";

export function getStage(stageId: string): StageData | undefined {
  return STAGES.find(s => s.id === stageId);
}

export function getStageEnemies(stage: StageData): EnemyData[] {
  const enemies: EnemyData[] = [];
  for (const eid of stage.enemies) {
    const e = ENEMIES.find(en => en.id === eid);
    if (e) enemies.push(e);
  }
  if (stage.bossId) {
    const boss = ENEMIES.find(en => en.id === stage.bossId);
    if (boss) enemies.push(boss);
  }
  return enemies;
}

export function getNextStageId(currentStageId: string): string | null {
  const idx = STAGES.findIndex(s => s.id === currentStageId);
  if (idx < 0 || idx >= STAGES.length - 1) return null;
  return STAGES[idx + 1].id;
}

export function getWorldName(world: number): string {
  const names: Record<number, string> = {
    1: "顔面道場",
    2: "怒りの火山",
    3: "笑いの遊園地",
    4: "驚きの宇宙",
    5: "感情の嵐",
  };
  return names[world] ?? `ワールド${world}`;
}
