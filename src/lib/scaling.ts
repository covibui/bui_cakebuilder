import type { BasePan, IngredientUnit, Shape, Size, Tier } from './types';

const SHEET_AREA = 9 * 13;

export function panArea(shape: Shape, sizeIn: number): number {
  switch (shape) {
    case 'square':
      return sizeIn * sizeIn;
    case 'sheet':
      return SHEET_AREA;
    case 'cupcake':
      return Math.PI * (2.5 / 2) ** 2 * sizeIn; // sizeIn = cupcake count for this shape
    case 'round':
    case 'oval': // v1 treats oval like round of the same width
    case 'dome':
    default:
      return Math.PI * (sizeIn / 2) ** 2;
  }
}

/** Total batter "volume" of a plan: area × layers summed over tiers. */
export function planVolume(shape: Shape, tiers: Tier[]): number {
  return tiers.reduce((sum, t) => sum + panArea(shape, t.sizeIn) * t.layers, 0);
}

/** Multiply every recipe amount by this to fit the project's pans. */
export function scaleFactor(base: BasePan, size: Size): number {
  const baseVol = panArea(base.shape, base.sizeIn) * base.layers;
  const target = planVolume(size.shape, size.tiers);
  const f = target / baseVol;
  return size.justEnough ? f : f * 1.1;
}

/** Weights and volumes round up to the nearest 5; counts round up to whole. */
export function roundAmount(raw: number, unit: IngredientUnit): number {
  if (unit === 'count') return Math.ceil(raw - 1e-9);
  return Math.ceil(raw / 5 - 1e-9) * 5;
}

/** Suggested tiers from servings (as in v6), editable afterwards. */
export function suggestTiers(servings: number): Tier[] {
  const n = Math.max(4, Math.min(40, servings || 12));
  if (n <= 12) return [{ sizeIn: 8, layers: 3 }];
  if (n <= 24) return [{ sizeIn: 8, layers: 3 }, { sizeIn: 6, layers: 3 }];
  return [{ sizeIn: 10, layers: 3 }, { sizeIn: 8, layers: 3 }, { sizeIn: 6, layers: 3 }];
}
