import type { Ingredient } from './types';
import { densityFor } from './units';

const UNICODE_FRAC: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };

const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', kg: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', l: 'l', liter: 'l', liters: 'l',
  cup: 'cup', cups: 'cup', c: 'cup',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbs: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  stick: 'stick', sticks: 'stick',
};

const NEEDS_SCALE = /chocolate|gelatin|baking soda|baking powder|yeast|agar/i;
const LIQUID = /juice|milk|cream|water|syrup|oil|extract|liqueur|coffee/i;

function parseNumber(s: string): number | null {
  let t = s.trim();
  let total = 0;
  for (const [ch, v] of Object.entries(UNICODE_FRAC)) {
    if (t.includes(ch)) {
      total += v;
      t = t.replace(ch, '').trim();
    }
  }
  if (!t) return total || null;
  const parts = t.split(/\s+/);
  for (const p of parts) {
    const frac = p.match(/^(\d+)\/(\d+)$/);
    if (frac) total += Number(frac[1]) / Number(frac[2]);
    else if (/^\d+(\.\d+)?$/.test(p)) total += Number(p);
    else return null;
  }
  return total;
}

export interface ParsedLine {
  ingredient: Ingredient | null;
  raw: string;
  converted: boolean; // true = cups/spoons converted with a density, so it's an assumption
}

/** "1 ½ cups sugar" → 300 g sugar. Unparseable lines come back with ingredient null. */
export function parseIngredientLine(raw: string): ParsedLine {
  const line = raw.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
  const m = line.match(/^([\d\s/.¼½¾⅓⅔⅛]+)\s*([a-zA-Z]+\.?)?\s+(.*)$/);
  if (!m) return { ingredient: null, raw, converted: false };
  const qty = parseNumber(m[1]);
  if (qty == null) return { ingredient: null, raw, converted: false };
  const unitWord = (m[2] ?? '').replace('.', '').toLowerCase();
  const unit = UNIT_ALIASES[unitWord];
  const name = (unit ? m[3] : `${m[2] ?? ''} ${m[3]}`).replace(/^of\s+/, '').trim();
  const needsScale = NEEDS_SCALE.test(name);
  const mk = (amount: number, u: Ingredient['unit']): Ingredient => ({ name, amount: Math.round(amount), unit: u, needsScale });

  switch (unit) {
    case undefined:
      return { ingredient: { name, amount: qty, unit: 'count', needsScale }, raw, converted: false };
    case 'g': return { ingredient: mk(qty, 'g'), raw, converted: false };
    case 'kg': return { ingredient: mk(qty * 1000, 'g'), raw, converted: false };
    case 'ml': return { ingredient: mk(qty, 'ml'), raw, converted: false };
    case 'l': return { ingredient: mk(qty * 1000, 'ml'), raw, converted: false };
    case 'oz': return { ingredient: mk(qty * 28.35, 'g'), raw, converted: false };
    case 'lb': return { ingredient: mk(qty * 453.6, 'g'), raw, converted: false };
    case 'stick': return { ingredient: mk(qty * 113, 'g'), raw, converted: false };
  }
  const cups = unit === 'cup' ? qty : unit === 'tbsp' ? qty / 16 : qty / 48;
  if (LIQUID.test(name)) return { ingredient: mk(cups * 236.6, 'ml'), raw, converted: false };
  const d = densityFor(name);
  if (d) return { ingredient: mk(cups * d, 'g'), raw, converted: true };
  // Unknown density: keep as ml so nothing is invented.
  return { ingredient: mk(cups * 236.6, 'ml'), raw, converted: true };
}
