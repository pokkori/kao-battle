import { EnemyData } from "../../types/enemy";

export const ENEMIES: EnemyData[] = [
  // W1: 顔面道場
  {
    id: "e_slime", name: "顔なしスライム", description: "のっぺらぼうのスライム。攻撃は弱いが油断禁物。",
    hp: 60, spriteId: "enemy_slime", scale: 0.8,
    attacks: [{ type: "normal", damage: 5, interval: 3000, weight: 1.0 }],
    isBoss: false, coinReward: 10, scoreReward: 100, weakness: "angry", resistance: "neutral",
    enterLine: "ぷるぷる...", defeatLine: "ぷしゅ〜...",
  },
  {
    id: "e_wooden_dummy", name: "木人形", description: "道場に置いてある練習用の木人形。反撃してくる。",
    hp: 80, spriteId: "enemy_wooden_dummy", scale: 1.0,
    attacks: [
      { type: "normal", damage: 8, interval: 2500, weight: 0.7 },
      { type: "heavy", damage: 15, interval: 4000, weight: 0.3 },
    ],
    isBoss: false, coinReward: 15, scoreReward: 150, weakness: "surprise", resistance: "sad",
    enterLine: "ギギギ...", defeatLine: "バキッ！",
  },
  {
    id: "e_ninja", name: "見習い忍者", description: "素早い連続攻撃が得意。笑顔バリアで防ごう。",
    hp: 70, spriteId: "enemy_ninja", scale: 0.9,
    attacks: [
      { type: "normal", damage: 6, interval: 2000, weight: 0.4 },
      { type: "rapid", damage: 4, interval: 2500, weight: 0.6, hitCount: 3 },
    ],
    isBoss: false, coinReward: 20, scoreReward: 200, weakness: "happy", resistance: "angry",
    enterLine: "参る！", defeatLine: "ぐっ...修行不足...",
  },
  {
    id: "e_sumo", name: "小結スモウ", description: "重い張り手に注意。溜め攻撃の予告を見逃すな。",
    hp: 120, spriteId: "enemy_sumo", scale: 1.2,
    attacks: [
      { type: "normal", damage: 10, interval: 3000, weight: 0.4 },
      { type: "heavy", damage: 20, interval: 4000, weight: 0.3 },
      { type: "charge", damage: 30, interval: 6000, weight: 0.3, warningDuration: 2000 },
    ],
    isBoss: false, coinReward: 25, scoreReward: 250, weakness: "surprise", resistance: "happy",
    enterLine: "どすこーい！", defeatLine: "ごっつぁんです...",
  },
  {
    id: "e_boss_sensei", name: "鉄拳師範", description: "道場の師範。全ての技を使いこなす。表情を使い分けろ！",
    hp: 250, spriteId: "enemy_boss_sensei", scale: 1.3,
    attacks: [
      { type: "normal", damage: 12, interval: 2000, weight: 0.3 },
      { type: "heavy", damage: 22, interval: 3000, weight: 0.2 },
      { type: "rapid", damage: 8, interval: 2500, weight: 0.2, hitCount: 3 },
      { type: "charge", damage: 35, interval: 5000, weight: 0.2, warningDuration: 1800 },
      { type: "heal", damage: 0, interval: 8000, weight: 0.1, healAmount: 30 },
    ],
    isBoss: true, coinReward: 100, scoreReward: 1000, weakness: "angry", resistance: "sad",
    enterLine: "お前の表情...まだまだ甘い！", defeatLine: "見事だ...卒業を認めよう。",
  },
  // W2: 怒りの火山
  {
    id: "e_fire_imp", name: "炎小鬼", description: "怒りに燃える小さな鬼。素早い攻撃に注意。",
    hp: 90, spriteId: "enemy_fire_imp", scale: 0.8,
    attacks: [
      { type: "normal", damage: 10, interval: 2000, weight: 0.6 },
      { type: "rapid", damage: 6, interval: 2500, weight: 0.4, hitCount: 2 },
    ],
    isBoss: false, coinReward: 20, scoreReward: 200, weakness: "happy", resistance: "angry",
    enterLine: "メラメラ〜！", defeatLine: "ジュワッ...",
  },
  {
    id: "e_lava_golem", name: "溶岩ゴーレム", description: "溶岩でできた巨体。重攻撃が痛い。",
    hp: 150, spriteId: "enemy_lava_golem", scale: 1.3,
    attacks: [
      { type: "heavy", damage: 20, interval: 3500, weight: 0.5 },
      { type: "charge", damage: 40, interval: 5000, weight: 0.3, warningDuration: 2000 },
      { type: "normal", damage: 12, interval: 2500, weight: 0.2 },
    ],
    isBoss: false, coinReward: 30, scoreReward: 300, weakness: "surprise", resistance: "angry",
    enterLine: "ゴゴゴ...", defeatLine: "ガラガラ...",
  },
  {
    id: "e_flame_dancer", name: "炎舞師", description: "炎を操る踊り子。デバフ攻撃でクールダウンを延長してくる。",
    hp: 100, spriteId: "enemy_flame_dancer", scale: 1.0,
    attacks: [
      { type: "normal", damage: 10, interval: 2200, weight: 0.4 },
      { type: "rapid", damage: 7, interval: 2800, weight: 0.3, hitCount: 2 },
      { type: "debuff", damage: 5, interval: 4000, weight: 0.3 },
    ],
    isBoss: false, coinReward: 25, scoreReward: 250, weakness: "sad", resistance: "happy",
    enterLine: "踊れ、炎よ！", defeatLine: "美しく...散る...",
  },
  {
    id: "e_boss_volcano_dragon", name: "火山龍イグニス", description: "火山の主。灼熱のブレスは笑顔バリアで防げ！",
    hp: 350, spriteId: "enemy_boss_volcano_dragon", scale: 1.5,
    attacks: [
      { type: "normal", damage: 15, interval: 2000, weight: 0.2 },
      { type: "heavy", damage: 25, interval: 2800, weight: 0.25 },
      { type: "charge", damage: 50, interval: 5000, weight: 0.25, warningDuration: 1500 },
      { type: "rapid", damage: 10, interval: 2500, weight: 0.15, hitCount: 3 },
      { type: "heal", damage: 0, interval: 10000, weight: 0.15, healAmount: 40 },
    ],
    isBoss: true, coinReward: 150, scoreReward: 1500, weakness: "happy", resistance: "angry",
    enterLine: "この火山から生きて帰れると思うな！", defeatLine: "グオオ...まさか人間の笑顔に...",
  },
  // W3: 笑いの遊園地
  {
    id: "e_clown", name: "ダークピエロ", description: "不気味な笑みを浮かべるピエロ。笑顔が通用しない。",
    hp: 110, spriteId: "enemy_clown", scale: 1.0,
    attacks: [
      { type: "normal", damage: 12, interval: 2200, weight: 0.5 },
      { type: "debuff", damage: 8, interval: 3500, weight: 0.3 },
      { type: "rapid", damage: 6, interval: 2800, weight: 0.2, hitCount: 3 },
    ],
    isBoss: false, coinReward: 25, scoreReward: 250, weakness: "angry", resistance: "happy",
    enterLine: "アハハハハ！笑え笑え！", defeatLine: "笑えない...",
  },
  {
    id: "e_puppet", name: "操り人形", description: "誰かに操られている人形。糸を断つには驚きビームだ。",
    hp: 80, spriteId: "enemy_puppet", scale: 0.9,
    attacks: [
      { type: "normal", damage: 8, interval: 1800, weight: 0.5 },
      { type: "rapid", damage: 5, interval: 2200, weight: 0.5, hitCount: 4 },
    ],
    isBoss: false, coinReward: 20, scoreReward: 200, weakness: "surprise", resistance: "sad",
    enterLine: "カタカタ...", defeatLine: "プツン...",
  },
  {
    id: "e_mirror", name: "ミラーフェイス", description: "プレイヤーの表情をコピーする鏡。真逆の表情で攻撃しろ。",
    hp: 130, spriteId: "enemy_mirror", scale: 1.0,
    attacks: [
      { type: "normal", damage: 14, interval: 2500, weight: 0.4 },
      { type: "heavy", damage: 22, interval: 3500, weight: 0.3 },
      { type: "heal", damage: 0, interval: 6000, weight: 0.3, healAmount: 20 },
    ],
    isBoss: false, coinReward: 30, scoreReward: 300, weakness: "angry", resistance: "surprise",
    enterLine: "お前の顔が...映る...", defeatLine: "パリーン！",
  },
  {
    id: "e_boss_ringmaster", name: "闇団長ジョーカー", description: "遊園地の支配者。全表情に対する耐性を持つ厄介なボス。",
    hp: 400, spriteId: "enemy_boss_ringmaster", scale: 1.4,
    attacks: [
      { type: "normal", damage: 14, interval: 1800, weight: 0.2 },
      { type: "heavy", damage: 28, interval: 3000, weight: 0.2 },
      { type: "rapid", damage: 9, interval: 2200, weight: 0.2, hitCount: 3 },
      { type: "charge", damage: 45, interval: 4500, weight: 0.2, warningDuration: 1500 },
      { type: "debuff", damage: 10, interval: 3500, weight: 0.2 },
    ],
    isBoss: true, coinReward: 200, scoreReward: 2000, weakness: "sad", resistance: "happy",
    enterLine: "さあ、最高のショーの始まりだ！", defeatLine: "こんな...観客に負けるとは...",
  },
  // W4: 驚きの宇宙
  {
    id: "e_alien", name: "グレイ星人", description: "宇宙からの侵略者。ビーム攻撃が強力。",
    hp: 120, spriteId: "enemy_alien", scale: 0.9,
    attacks: [
      { type: "normal", damage: 12, interval: 2000, weight: 0.4 },
      { type: "charge", damage: 35, interval: 4000, weight: 0.4, warningDuration: 1800 },
      { type: "debuff", damage: 8, interval: 3500, weight: 0.2 },
    ],
    isBoss: false, coinReward: 30, scoreReward: 300, weakness: "angry", resistance: "surprise",
    enterLine: "ワレワレハ....", defeatLine: "マサカ...チキュウジンニ...",
  },
  {
    id: "e_space_jellyfish", name: "宇宙クラゲ", description: "触手で連続攻撃。HPが減ると攻撃が激化する。",
    hp: 100, spriteId: "enemy_space_jellyfish", scale: 1.1,
    attacks: [
      { type: "rapid", damage: 7, interval: 2000, weight: 0.6, hitCount: 3 },
      { type: "normal", damage: 10, interval: 2500, weight: 0.2 },
      { type: "heal", damage: 0, interval: 7000, weight: 0.2, healAmount: 15 },
    ],
    isBoss: false, coinReward: 25, scoreReward: 250, weakness: "happy", resistance: "sad",
    enterLine: "フワフワ〜", defeatLine: "プシュ〜...",
  },
  {
    id: "e_boss_cosmos_emperor", name: "宇宙皇帝ネビュラ", description: "銀河を支配する皇帝。全ての攻撃パターンを持つ最強の敵。",
    hp: 500, spriteId: "enemy_boss_cosmos_emperor", scale: 1.5,
    attacks: [
      { type: "normal", damage: 16, interval: 1500, weight: 0.15 },
      { type: "heavy", damage: 30, interval: 2500, weight: 0.2 },
      { type: "rapid", damage: 10, interval: 2000, weight: 0.2, hitCount: 3 },
      { type: "charge", damage: 55, interval: 4000, weight: 0.2, warningDuration: 1200 },
      { type: "debuff", damage: 12, interval: 3000, weight: 0.15 },
      { type: "heal", damage: 0, interval: 8000, weight: 0.1, healAmount: 50 },
    ],
    isBoss: true, coinReward: 250, scoreReward: 2500, weakness: "surprise", resistance: "angry",
    enterLine: "ひれ伏せ、顔面戦士よ！", defeatLine: "この表情...それが宇宙最強の武器だと言うのか...",
  },
  // W5: 感情の嵐
  {
    id: "e_emotion_ghost", name: "感情亡霊", description: "全ての感情を吸収する亡霊。弱点が毎ターン変わる。",
    hp: 140, spriteId: "enemy_emotion_ghost", scale: 1.0,
    attacks: [
      { type: "normal", damage: 14, interval: 2000, weight: 0.3 },
      { type: "heavy", damage: 24, interval: 3000, weight: 0.3 },
      { type: "debuff", damage: 10, interval: 3500, weight: 0.2 },
      { type: "heal", damage: 0, interval: 6000, weight: 0.2, healAmount: 25 },
    ],
    isBoss: false, coinReward: 35, scoreReward: 350, weakness: "angry", resistance: "neutral",
    enterLine: "全ての感情を...いただく...", defeatLine: "感情が...溢れる...",
  },
  {
    id: "e_boss_emotion_king", name: "感情王カオス", description: "全感情を統べる最終ボス。フェーズ毎に弱点が変化する。",
    hp: 700, spriteId: "enemy_boss_emotion_king", scale: 1.6,
    attacks: [
      { type: "normal", damage: 18, interval: 1500, weight: 0.15 },
      { type: "heavy", damage: 35, interval: 2500, weight: 0.2 },
      { type: "rapid", damage: 12, interval: 1800, weight: 0.2, hitCount: 3 },
      { type: "charge", damage: 60, interval: 3500, weight: 0.2, warningDuration: 1000 },
      { type: "debuff", damage: 15, interval: 3000, weight: 0.15 },
      { type: "heal", damage: 0, interval: 7000, weight: 0.1, healAmount: 60 },
    ],
    isBoss: true, coinReward: 500, scoreReward: 5000, weakness: "happy", resistance: "sad",
    enterLine: "感情など...無意味だ！", defeatLine: "バカな...人間の感情がこれほどの力を持つとは...",
  },
];
