import { ShopItem } from "../../types/shop";

export const PUNCH_EFFECTS: ShopItem[] = [
  { id: "default_punch", name: "ノーマルパンチ", description: "標準的なパンチエフェクト。", category: "punch_effect", price: 0, currency: "coin", previewImage: "punch_default", rarity: "common" },
  { id: "fire_punch", name: "炎パンチ", description: "燃え上がる拳！ダメージ+5%。", category: "punch_effect", price: 500, currency: "coin", previewImage: "punch_fire", rarity: "rare" },
  { id: "thunder_punch", name: "雷パンチ", description: "稲妻が走る！ダメージ+5%。", category: "punch_effect", price: 800, currency: "coin", previewImage: "punch_thunder", rarity: "rare" },
  { id: "ice_punch", name: "氷パンチ", description: "凍てつく拳！ダメージ+5%。", category: "punch_effect", price: 800, currency: "coin", previewImage: "punch_ice", rarity: "rare" },
  { id: "galaxy_punch", name: "銀河パンチ", description: "星屑が舞う！ダメージ+10%。", category: "punch_effect", price: 2000, currency: "coin", previewImage: "punch_galaxy", rarity: "epic" },
  { id: "dragon_punch", name: "龍拳", description: "龍が飛び出す！ダメージ+15%。", category: "punch_effect", price: 0, currency: "iap", iapProductId: "com.pokkori.facefight.punch_dragon", previewImage: "punch_dragon", rarity: "legendary" },
];

export const BARRIER_SKINS: ShopItem[] = [
  { id: "default_barrier", name: "ノーマルバリア", description: "標準的な青いバリア。", category: "barrier_skin", price: 0, currency: "coin", previewImage: "barrier_default", rarity: "common" },
  { id: "flower_barrier", name: "花びらバリア", description: "桜の花びらが舞うバリア。持続+200ms。", category: "barrier_skin", price: 600, currency: "coin", previewImage: "barrier_flower", rarity: "rare" },
  { id: "crystal_barrier", name: "水晶バリア", description: "水晶の壁が守る。持続+200ms。", category: "barrier_skin", price: 900, currency: "coin", previewImage: "barrier_crystal", rarity: "rare" },
  { id: "rainbow_barrier", name: "虹バリア", description: "七色に輝くバリア。持続+400ms。", category: "barrier_skin", price: 2500, currency: "coin", previewImage: "barrier_rainbow", rarity: "epic" },
  { id: "cosmos_barrier", name: "宇宙バリア", description: "星空が広がるバリア。持続+500ms。軽減率+5%。", category: "barrier_skin", price: 0, currency: "iap", iapProductId: "com.pokkori.facefight.barrier_cosmos", previewImage: "barrier_cosmos", rarity: "legendary" },
];

export const BEAM_EFFECTS: ShopItem[] = [
  { id: "default_beam", name: "ノーマルビーム", description: "標準的なビーム。", category: "beam_effect", price: 0, currency: "coin", previewImage: "beam_default", rarity: "common" },
  { id: "laser_beam", name: "レーザービーム", description: "赤いレーザー！ダメージ+5%。", category: "beam_effect", price: 500, currency: "coin", previewImage: "beam_laser", rarity: "rare" },
  { id: "plasma_beam", name: "プラズマビーム", description: "紫色のプラズマ！ダメージ+5%。", category: "beam_effect", price: 800, currency: "coin", previewImage: "beam_plasma", rarity: "rare" },
  { id: "rainbow_beam", name: "虹ビーム", description: "虹色のビーム！ダメージ+10%。", category: "beam_effect", price: 2000, currency: "coin", previewImage: "beam_rainbow", rarity: "epic" },
  { id: "blackhole_beam", name: "ブラックホールビーム", description: "全てを飲み込む！ダメージ+15%。", category: "beam_effect", price: 0, currency: "iap", iapProductId: "com.pokkori.facefight.beam_blackhole", previewImage: "beam_blackhole", rarity: "legendary" },
];

export const TITLES: ShopItem[] = [
  { id: "title_beginner", name: "顔面初心者", description: "全ての始まり。", category: "title", price: 0, currency: "coin", previewImage: "title_beginner", rarity: "common" },
  { id: "title_warrior", name: "表情戦士", description: "W1クリアで解放。", category: "title", price: 0, currency: "coin", previewImage: "title_warrior", rarity: "common", unlockCondition: "W1クリア" },
  { id: "title_master", name: "表情マスター", description: "W3クリアで解放。", category: "title", price: 0, currency: "coin", previewImage: "title_master", rarity: "rare", unlockCondition: "W3クリア" },
  { id: "title_legend", name: "顔面伝説", description: "W5クリアで解放。", category: "title", price: 0, currency: "coin", previewImage: "title_legend", rarity: "epic", unlockCondition: "W5クリア" },
  { id: "title_god", name: "表情神", description: "全ステージSランクで解放。", category: "title", price: 0, currency: "coin", previewImage: "title_god", rarity: "legendary", unlockCondition: "全ステージSランク" },
  { id: "title_funny", name: "変顔王", description: "スクリーンショット50枚保存で解放。", category: "title", price: 0, currency: "coin", previewImage: "title_funny", rarity: "rare", unlockCondition: "スクショ50枚" },
];

export const ALL_SHOP_ITEMS: ShopItem[] = [
  ...PUNCH_EFFECTS,
  ...BARRIER_SKINS,
  ...BEAM_EFFECTS,
  ...TITLES,
];
