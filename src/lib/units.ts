import type { Ingredient } from './types';

export type UnitPref = 'cups' | 'grams';

/** Grams per US cup. Small v1 table; unknown dry ingredients fall back to grams. */
const DENSITY_G_PER_CUP: Record<string, number> = {
  'all-purpose flour': 125,
  flour: 125,
  'cake flour': 115,
  sugar: 200,
  'granulated sugar': 200,
  'brown sugar': 213,
  'powdered sugar': 120,
  butter: 227,
  'cocoa powder': 85,
  'heavy cream': 238,
  milk: 240,
  water: 236,
  'cream cheese': 232,
  'sour cream': 242,
  raspberries: 125,
  blueberries: 148,
  strawberries: 152,
  'lemon juice': 240,
  oil: 218,
  honey: 340,
};

const ML_PER_CUP = 236.6;
const TBSP_PER_CUP = 16;
const TSP_PER_TBSP = 3;

const FRACTIONS: [number, string][] = [
  [0, ''],
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
  [1, ''],
];

function nearestFraction(x: number): { whole: number; frac: string } {
  let whole = Math.floor(x);
  const rest = x - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  if (best[0] === 1) whole += 1;
  return { whole, frac: best[1] };
}

function fmtFraction(x: number): string {
  const { whole, frac } = nearestFraction(x);
  if (whole === 0 && !frac) return '';
  return `${whole || ''}${frac}`;
}

function cupsLabel(cups: number): string {
  if (cups >= 0.25) return `${fmtFraction(cups)} cup${cups > 1.1 ? 's' : ''}`;
  const tbsp = cups * TBSP_PER_CUP;
  if (tbsp >= 1) return `${fmtFraction(tbsp)} tbsp`;
  return `${fmtFraction(tbsp * TSP_PER_TBSP) || '⅛'} tsp`;
}

export function densityFor(name: string): number | null {
  const key = name.toLowerCase().split(',')[0].trim();
  return DENSITY_G_PER_CUP[key] ?? null;
}

/**
 * Display rule from the data model:
 * cups by default, grams toggle, needsScale always grams, counts stay counts.
 */
export function displayAmount(ing: Ingredient, amount: number, pref: UnitPref): string {
  if (ing.unit === 'count') return String(Math.ceil(amount));
  const metric = `${amount} ${ing.unit}`;
  if (pref === 'grams' || ing.needsScale) return metric;
  if (ing.unit === 'ml') return cupsLabel(amount / ML_PER_CUP);
  const d = densityFor(ing.name);
  return d ? cupsLabel(amount / d) : metric;
}

/** Temperatures are always shown in °F. */
export const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
export const fmtTempF = (f: number) => `${Math.round(f)}°F`;
