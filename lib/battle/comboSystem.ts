/** Combo timeout in ms - if no skill in this time, combo resets */
export const COMBO_TIMEOUT = 3000;

/** Calculate combo bonus score when combo ends */
export function comboEndBonus(combo: number): number {
  return combo * combo * 10;
}
