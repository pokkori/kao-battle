/** ショップアイテムカテゴリ */
export type ShopCategory =
  | "punch_effect"
  | "barrier_skin"
  | "beam_effect"
  | "title"
  | "consumable";

/** 通貨種別 */
export type CurrencyType = "coin" | "iap";

/** ショップアイテム定義 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  currency: CurrencyType;
  iapProductId?: string;
  previewImage: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockCondition?: string;
}

/** IAPプロダクト定義 */
export interface IAPProduct {
  id: string;
  iosProductId: string;
  androidProductId: string;
  priceLabel: string;
  type: "consumable" | "non_consumable" | "subscription";
}

/** IAP商品一覧 */
export const IAP_PRODUCTS: IAPProduct[] = [
  { id: "coin_pack_small", iosProductId: "com.pokkori.facefight.coins500", androidProductId: "coins_500", priceLabel: "\u00a5160", type: "consumable" },
  { id: "coin_pack_medium", iosProductId: "com.pokkori.facefight.coins1500", androidProductId: "coins_1500", priceLabel: "\u00a5480", type: "consumable" },
  { id: "coin_pack_large", iosProductId: "com.pokkori.facefight.coins5000", androidProductId: "coins_5000", priceLabel: "\u00a51,200", type: "consumable" },
  { id: "ad_free", iosProductId: "com.pokkori.facefight.adfree", androidProductId: "ad_free", priceLabel: "\u00a5600", type: "non_consumable" },
  { id: "starter_pack", iosProductId: "com.pokkori.facefight.starter", androidProductId: "starter_pack", priceLabel: "\u00a5320", type: "non_consumable" },
];
