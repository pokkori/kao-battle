import { Achievement } from "../../types/achievement";

export const ACHIEVEMENTS: Achievement[] = [
  // Battle (7)
  { id: "ach_first_win", name: "はじめての勝利", description: "初めてステージをクリアする", category: "battle", iconId: "ach_icon_sword", coinReward: 50, conditionKey: "totalEnemiesDefeated", conditionValue: 1, hidden: false },
  { id: "ach_defeat_50", name: "50体撃破", description: "敵を50体倒す", category: "battle", iconId: "ach_icon_skull", coinReward: 100, conditionKey: "totalEnemiesDefeated", conditionValue: 50, hidden: false },
  { id: "ach_defeat_200", name: "200体撃破", description: "敵を200体倒す", category: "battle", iconId: "ach_icon_skull_gold", coinReward: 300, conditionKey: "totalEnemiesDefeated", conditionValue: 200, hidden: false },
  { id: "ach_combo_10", name: "コンボマスター", description: "10コンボを達成する", category: "battle", iconId: "ach_icon_combo", coinReward: 100, conditionKey: "overallMaxCombo", conditionValue: 10, hidden: false },
  { id: "ach_combo_30", name: "コンボレジェンド", description: "30コンボを達成する", category: "battle", iconId: "ach_icon_combo_gold", coinReward: 500, conditionKey: "overallMaxCombo", conditionValue: 30, hidden: false },
  { id: "ach_no_damage", name: "無傷の勝利", description: "ノーダメージでステージをクリアする", category: "battle", iconId: "ach_icon_shield", coinReward: 200, conditionKey: "special_no_damage", conditionValue: 1, hidden: false },
  { id: "ach_all_s_rank", name: "パーフェクト表情", description: "全ステージでSランクを獲得する", category: "battle", iconId: "ach_icon_crown", coinReward: 1000, conditionKey: "special_all_s", conditionValue: 1, hidden: false },
  // Expression (5)
  { id: "ach_punch_100", name: "怒りの拳", description: "パンチを100回使用する", category: "expression", iconId: "ach_icon_fist", coinReward: 100, conditionKey: "special_punch_count", conditionValue: 100, hidden: false },
  { id: "ach_barrier_100", name: "笑顔の盾", description: "バリアを100回使用する", category: "expression", iconId: "ach_icon_barrier", coinReward: 100, conditionKey: "special_barrier_count", conditionValue: 100, hidden: false },
  { id: "ach_beam_100", name: "驚きの光", description: "ビームを100回使用する", category: "expression", iconId: "ach_icon_beam", coinReward: 100, conditionKey: "special_beam_count", conditionValue: 100, hidden: false },
  { id: "ach_heal_50", name: "涙の癒し", description: "ヒールを50回使用する", category: "expression", iconId: "ach_icon_tear", coinReward: 100, conditionKey: "special_heal_count", conditionValue: 50, hidden: false },
  { id: "ach_all_expression", name: "表情コンプリート", description: "1バトルで全4表情を使用する", category: "expression", iconId: "ach_icon_face", coinReward: 150, conditionKey: "special_all_expression", conditionValue: 1, hidden: false },
  // Collection (5)
  { id: "ach_coins_5000", name: "小金持ち", description: "累計5,000コイン獲得", category: "collection", iconId: "ach_icon_coin", coinReward: 100, conditionKey: "totalCoins", conditionValue: 5000, hidden: false },
  { id: "ach_coins_50000", name: "大富豪", description: "累計50,000コイン獲得", category: "collection", iconId: "ach_icon_coin_gold", coinReward: 500, conditionKey: "totalCoins", conditionValue: 50000, hidden: false },
  { id: "ach_items_5", name: "コレクター", description: "ショップアイテムを5つ購入する", category: "collection", iconId: "ach_icon_bag", coinReward: 100, conditionKey: "special_items_purchased", conditionValue: 5, hidden: false },
  { id: "ach_items_15", name: "コンプリーター", description: "ショップアイテムを15個購入する", category: "collection", iconId: "ach_icon_bag_gold", coinReward: 300, conditionKey: "special_items_purchased", conditionValue: 15, hidden: false },
  { id: "ach_world_clear", name: "冒険者", description: "全ワールドをクリアする", category: "collection", iconId: "ach_icon_world", coinReward: 500, conditionKey: "special_all_worlds", conditionValue: 1, hidden: false },
  // Challenge (4)
  { id: "ach_daily_7", name: "週間チャレンジャー", description: "デイリーチャレンジを7日連続で完了する", category: "challenge", iconId: "ach_icon_calendar", coinReward: 200, conditionKey: "dailyStreak", conditionValue: 7, hidden: false },
  { id: "ach_daily_30", name: "皆勤賞", description: "デイリーチャレンジを30日連続で完了する", category: "challenge", iconId: "ach_icon_calendar_gold", coinReward: 1000, conditionKey: "dailyStreak", conditionValue: 30, hidden: false },
  { id: "ach_play_50", name: "顔トレ中毒", description: "50回プレイする", category: "challenge", iconId: "ach_icon_play", coinReward: 100, conditionKey: "totalPlays", conditionValue: 50, hidden: false },
  { id: "ach_play_time_3600", name: "表情マラソン", description: "累計プレイ時間1時間", category: "challenge", iconId: "ach_icon_clock", coinReward: 200, conditionKey: "totalPlayTime", conditionValue: 3600, hidden: false },
  // Social (2)
  { id: "ach_share_1", name: "初シェア", description: "リザルトを初めてシェアする", category: "social", iconId: "ach_icon_share", coinReward: 50, conditionKey: "special_share_count", conditionValue: 1, hidden: false },
  { id: "ach_screenshot_50", name: "変顔コレクター", description: "変顔スクリーンショットを50枚保存する", category: "social", iconId: "ach_icon_camera", coinReward: 200, conditionKey: "special_screenshot_count", conditionValue: 50, hidden: false },
  // Hidden (2)
  { id: "ach_hidden_boss_rush", name: "ボスラッシュ", description: "全ボスを連続で撃破する（W1〜W5）", category: "battle", iconId: "ach_icon_boss", coinReward: 2000, conditionKey: "special_boss_rush", conditionValue: 1, hidden: true },
  { id: "ach_hidden_emotion_king_nodamage", name: "感情を超えし者", description: "感情王カオスをノーダメージで撃破する", category: "battle", iconId: "ach_icon_god", coinReward: 3000, conditionKey: "special_final_boss_no_damage", conditionValue: 1, hidden: true },
];
