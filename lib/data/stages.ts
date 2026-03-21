export interface StageData {
  id: string;
  name: string;
  world: number;
  stageNumber: number;
  enemies: string[];
  bossId: string | null;
  backgroundId: string;
  bgmId: string;
  unlockRequirement: string | null;
  maxScore: number;
  description: string;
}

export const STAGES: StageData[] = [
  // W1: 顔面道場
  { id: "stage_1_1", name: "入門の間", world: 1, stageNumber: 1, enemies: ["e_slime", "e_slime", "e_slime"], bossId: null, backgroundId: "bg_dojo", bgmId: "bgm_dojo", unlockRequirement: null, maxScore: 3000, description: "まずはスライムで練習だ！" },
  { id: "stage_1_2", name: "修行の間", world: 1, stageNumber: 2, enemies: ["e_slime", "e_wooden_dummy", "e_slime", "e_wooden_dummy"], bossId: null, backgroundId: "bg_dojo", bgmId: "bgm_dojo", unlockRequirement: "stage_1_1", maxScore: 5000, description: "木人形の重攻撃に気をつけろ。" },
  { id: "stage_1_3", name: "忍の間", world: 1, stageNumber: 3, enemies: ["e_ninja", "e_wooden_dummy", "e_ninja", "e_ninja"], bossId: null, backgroundId: "bg_dojo", bgmId: "bgm_dojo", unlockRequirement: "stage_1_2", maxScore: 6500, description: "忍者の連続攻撃をバリアで防げ！" },
  { id: "stage_1_4", name: "力士の間", world: 1, stageNumber: 4, enemies: ["e_sumo", "e_ninja", "e_sumo"], bossId: null, backgroundId: "bg_dojo", bgmId: "bgm_dojo", unlockRequirement: "stage_1_3", maxScore: 7000, description: "重量級の攻撃を見切れるか？" },
  { id: "stage_1_boss", name: "師範の間", world: 1, stageNumber: 5, enemies: ["e_ninja", "e_sumo"], bossId: "e_boss_sensei", backgroundId: "bg_dojo_boss", bgmId: "bgm_boss_1", unlockRequirement: "stage_1_4", maxScore: 12000, description: "鉄拳師範との最終試験！" },
  // W2: 怒りの火山
  { id: "stage_2_1", name: "火口の入口", world: 2, stageNumber: 1, enemies: ["e_fire_imp", "e_fire_imp", "e_fire_imp", "e_fire_imp"], bossId: null, backgroundId: "bg_volcano", bgmId: "bgm_volcano", unlockRequirement: "stage_1_boss", maxScore: 6000, description: "炎小鬼が群れで襲ってくる！" },
  { id: "stage_2_2", name: "溶岩洞窟", world: 2, stageNumber: 2, enemies: ["e_fire_imp", "e_lava_golem", "e_fire_imp"], bossId: null, backgroundId: "bg_volcano", bgmId: "bgm_volcano", unlockRequirement: "stage_2_1", maxScore: 7500, description: "溶岩ゴーレムの重撃に要注意。" },
  { id: "stage_2_3", name: "炎の舞台", world: 2, stageNumber: 3, enemies: ["e_flame_dancer", "e_lava_golem", "e_flame_dancer"], bossId: null, backgroundId: "bg_volcano", bgmId: "bgm_volcano", unlockRequirement: "stage_2_2", maxScore: 8000, description: "デバフ攻撃でクールダウンが延びる！" },
  { id: "stage_2_4", name: "噴火口", world: 2, stageNumber: 4, enemies: ["e_lava_golem", "e_flame_dancer", "e_lava_golem", "e_fire_imp"], bossId: null, backgroundId: "bg_volcano", bgmId: "bgm_volcano", unlockRequirement: "stage_2_3", maxScore: 9000, description: "過酷な連戦を乗り越えろ。" },
  { id: "stage_2_boss", name: "火山の心臓", world: 2, stageNumber: 5, enemies: ["e_lava_golem", "e_flame_dancer"], bossId: "e_boss_volcano_dragon", backgroundId: "bg_volcano_boss", bgmId: "bgm_boss_2", unlockRequirement: "stage_2_4", maxScore: 15000, description: "火山龍イグニスが目覚めた！" },
  // W3: 笑いの遊園地
  { id: "stage_3_1", name: "歪んだ入口", world: 3, stageNumber: 1, enemies: ["e_clown", "e_puppet", "e_clown"], bossId: null, backgroundId: "bg_amusement", bgmId: "bgm_amusement", unlockRequirement: "stage_2_boss", maxScore: 7000, description: "不気味な遊園地に足を踏み入れろ。" },
  { id: "stage_3_2", name: "鏡の迷宮", world: 3, stageNumber: 2, enemies: ["e_mirror", "e_puppet", "e_mirror"], bossId: null, backgroundId: "bg_amusement", bgmId: "bgm_amusement", unlockRequirement: "stage_3_1", maxScore: 8000, description: "鏡に映った自分と戦え。" },
  { id: "stage_3_3", name: "大テント", world: 3, stageNumber: 3, enemies: ["e_clown", "e_mirror", "e_puppet", "e_clown"], bossId: null, backgroundId: "bg_amusement", bgmId: "bgm_amusement", unlockRequirement: "stage_3_2", maxScore: 9500, description: "ピエロと人形の連携攻撃。" },
  { id: "stage_3_4", name: "暗黒メリーゴーラウンド", world: 3, stageNumber: 4, enemies: ["e_mirror", "e_clown", "e_mirror", "e_puppet"], bossId: null, backgroundId: "bg_amusement", bgmId: "bgm_amusement", unlockRequirement: "stage_3_3", maxScore: 10000, description: "回転する恐怖に立ち向かえ。" },
  { id: "stage_3_boss", name: "グランドステージ", world: 3, stageNumber: 5, enemies: ["e_clown", "e_mirror"], bossId: "e_boss_ringmaster", backgroundId: "bg_amusement_boss", bgmId: "bgm_boss_3", unlockRequirement: "stage_3_4", maxScore: 18000, description: "闇団長ジョーカーのショーが始まる！" },
  // W4: 驚きの宇宙
  { id: "stage_4_1", name: "衛星軌道", world: 4, stageNumber: 1, enemies: ["e_alien", "e_alien", "e_space_jellyfish"], bossId: null, backgroundId: "bg_space", bgmId: "bgm_space", unlockRequirement: "stage_3_boss", maxScore: 8500, description: "宇宙空間での初戦闘。" },
  { id: "stage_4_2", name: "小惑星帯", world: 4, stageNumber: 2, enemies: ["e_space_jellyfish", "e_alien", "e_space_jellyfish", "e_alien"], bossId: null, backgroundId: "bg_space", bgmId: "bgm_space", unlockRequirement: "stage_4_1", maxScore: 10000, description: "クラゲの連続攻撃ラッシュ。" },
  { id: "stage_4_3", name: "宇宙要塞", world: 4, stageNumber: 3, enemies: ["e_alien", "e_space_jellyfish", "e_alien", "e_alien", "e_space_jellyfish"], bossId: null, backgroundId: "bg_space", bgmId: "bgm_space", unlockRequirement: "stage_4_2", maxScore: 12000, description: "要塞内部は敵だらけ。" },
  { id: "stage_4_4", name: "ブラックホール付近", world: 4, stageNumber: 4, enemies: ["e_space_jellyfish", "e_alien", "e_space_jellyfish", "e_alien", "e_space_jellyfish"], bossId: null, backgroundId: "bg_space", bgmId: "bgm_space", unlockRequirement: "stage_4_3", maxScore: 13000, description: "ブラックホールの重力の中で戦え。" },
  { id: "stage_4_boss", name: "銀河の玉座", world: 4, stageNumber: 5, enemies: ["e_alien", "e_space_jellyfish"], bossId: "e_boss_cosmos_emperor", backgroundId: "bg_space_boss", bgmId: "bgm_boss_4", unlockRequirement: "stage_4_4", maxScore: 22000, description: "宇宙皇帝ネビュラとの最終決戦！" },
  // W5: 感情の嵐
  { id: "stage_5_1", name: "嵐の前兆", world: 5, stageNumber: 1, enemies: ["e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost"], bossId: null, backgroundId: "bg_storm", bgmId: "bgm_storm", unlockRequirement: "stage_4_boss", maxScore: 10000, description: "弱点が変わる亡霊との戦い。" },
  { id: "stage_5_2", name: "感情の渦", world: 5, stageNumber: 2, enemies: ["e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost"], bossId: null, backgroundId: "bg_storm", bgmId: "bgm_storm", unlockRequirement: "stage_5_1", maxScore: 12000, description: "渦巻く感情に翻弄されるな。" },
  { id: "stage_5_3", name: "崩壊の城門", world: 5, stageNumber: 3, enemies: ["e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost"], bossId: null, backgroundId: "bg_storm", bgmId: "bgm_storm", unlockRequirement: "stage_5_2", maxScore: 14000, description: "城門を守る亡霊の群れ。" },
  { id: "stage_5_4", name: "感情の回廊", world: 5, stageNumber: 4, enemies: ["e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost"], bossId: null, backgroundId: "bg_storm", bgmId: "bgm_storm", unlockRequirement: "stage_5_3", maxScore: 16000, description: "最後の回廊。全ての表情を使いこなせ。" },
  { id: "stage_5_boss", name: "感情の玉座", world: 5, stageNumber: 5, enemies: ["e_emotion_ghost", "e_emotion_ghost", "e_emotion_ghost"], bossId: "e_boss_emotion_king", backgroundId: "bg_storm_boss", bgmId: "bgm_boss_final", unlockRequirement: "stage_5_4", maxScore: 30000, description: "全ての感情を統べる王との最終決戦！" },
];
