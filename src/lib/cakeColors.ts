import type { ComponentKind, DessertType } from './types';

/**
 * Cake palette from the Café Scrapbook design system (cake-* tokens), muted 2026-11-28.
 * These colors only draw cake: cross-section layers, saved-cake minis, flavor chips. Never UI.
 * `ink` is the label color that passes 4.5:1 on that swatch.
 */
export const CAKE_COLORS = {
  'cake-vanilla': { hex: '#E6D9BD', ink: 'espresso', group: 'sponge' },
  'cake-golden': { hex: '#D0B889', ink: 'espresso', group: 'sponge' },
  'cake-spice': { hex: '#83634B', ink: 'milk', group: 'sponge' },
  'cake-red-velvet': { hex: '#934D52', ink: 'milk', group: 'sponge' },
  'cake-chocolate': { hex: '#61483E', ink: 'milk', group: 'sponge' },
  'cake-cookie': { hex: '#2C2928', ink: 'milk', group: 'sponge' },
  'cake-matcha': { hex: '#9AA87B', ink: 'espresso', group: 'sponge' },
  'cake-pistachio': { hex: '#BAC098', ink: 'espresso', group: 'sponge' },
  'cake-earl-grey': { hex: '#C2B8AC', ink: 'espresso', group: 'sponge' },
  'cake-strawberry': { hex: '#DB9FA6', ink: 'espresso', group: 'fruit' },
  'cake-raspberry': { hex: '#A95969', ink: 'milk', group: 'fruit' },
  'cake-cherry': { hex: '#773944', ink: 'milk', group: 'fruit' },
  'cake-blueberry': { hex: '#686A91', ink: 'milk', group: 'fruit' },
  'cake-lemon': { hex: '#D7C57A', ink: 'espresso', group: 'fruit' },
  'cake-lime': { hex: '#ABBA70', ink: 'espresso', group: 'fruit' },
  'cake-mango': { hex: '#CF9D5D', ink: 'espresso', group: 'fruit' },
  'cake-meringue': { hex: '#FEFCF9', ink: 'espresso', group: 'cream' },
  'cake-buttercream': { hex: '#F0E8D8', ink: 'espresso', group: 'cream' },
  'cake-cream-cheese': { hex: '#F0ECE4', ink: 'espresso', group: 'cream' },
  'cake-custard': { hex: '#DECE9E', ink: 'espresso', group: 'cream' },
  'cake-caramel': { hex: '#C09E77', ink: 'espresso', group: 'cream' },
  'cake-mocha': { hex: '#745D52', ink: 'milk', group: 'cream' },
  'cake-ganache': { hex: '#362825', ink: 'milk', group: 'cream' },
  'cake-pistachio-cream': { hex: '#CDD3B2', ink: 'espresso', group: 'cream' },
  'cake-graham': { hex: '#BB9D7C', ink: 'espresso', group: 'crust' },
  'cake-pastry': { hex: '#D3BF9D', ink: 'espresso', group: 'crust' },
  'cake-praline': { hex: '#795B3F', ink: 'milk', group: 'crust' },
  'cake-kataifi': { hex: '#C0A072', ink: 'espresso', group: 'crust' },
  'cake-basque-top': { hex: '#4F362B', ink: 'milk', group: 'crust' },
} as const satisfies Record<string, { hex: string; ink: 'espresso' | 'milk'; group: 'sponge' | 'fruit' | 'cream' | 'crust' }>;

export type CakeColor = keyof typeof CAKE_COLORS;

type Slot = 'sponge' | 'cream' | 'fill';

// Words that name a structure, not a flavor. Checked first.
const STRUCTURE: [RegExp, CakeColor][] = [
  [/graham|cookie crust/, 'cake-graham'],
  [/tart shell|shortbread|pastry shell/, 'cake-pastry'],
  [/kataifi/, 'cake-kataifi'],
  [/praline|feuilletine|nut crunch/, 'cake-praline'],
  [/whipped cream|meringue/, 'cake-meringue'],
  [/apricot/, 'cake-mango'],
  [/burnt|basque top/, 'cake-basque-top'],
];

// Flavor words → [sponge, cream, fill]. Order matters: specific before general
// ("white chocolate" before "chocolate", fruit before "white chocolate").
const FLAVOR: [RegExp, [CakeColor, CakeColor, CakeColor]][] = [
  [/cookies? (and|&|n) cre(me|am)|oreo/, ['cake-cookie', 'cake-buttercream', 'cake-cookie']],
  [/red velvet/, ['cake-red-velvet', 'cake-cream-cheese', 'cake-red-velvet']],
  [/macadamia/, ['cake-vanilla', 'cake-buttercream', 'cake-praline']],
  [/strawberr/, ['cake-vanilla', 'cake-strawberry', 'cake-strawberry']],
  [/raspberr/, ['cake-vanilla', 'cake-strawberry', 'cake-raspberry']],
  [/cherr|currant/, ['cake-vanilla', 'cake-strawberry', 'cake-cherry']],
  [/blueberr/, ['cake-vanilla', 'cake-buttercream', 'cake-blueberry']],
  [/mango|passion|pineapple/, ['cake-golden', 'cake-custard', 'cake-mango']],
  [/white chocolate|blond/, ['cake-vanilla', 'cake-buttercream', 'cake-buttercream']],
  [/espresso|mocha|coffee/, ['cake-chocolate', 'cake-mocha', 'cake-mocha']],
  [/chocolate|fudge|ganache|cocoa/, ['cake-chocolate', 'cake-mocha', 'cake-ganache']],
  [/matcha/, ['cake-matcha', 'cake-pistachio-cream', 'cake-matcha']],
  [/pistachio/, ['cake-pistachio', 'cake-pistachio-cream', 'cake-pistachio-cream']],
  [/earl grey|bergamot/, ['cake-earl-grey', 'cake-buttercream', 'cake-lemon']],
  [/lime/, ['cake-golden', 'cake-custard', 'cake-lime']],
  [/lemon|yuzu/, ['cake-golden', 'cake-custard', 'cake-lemon']],
  [/olive oil|brown butter/, ['cake-golden', 'cake-buttercream', 'cake-golden']],
  [/carrot|pumpkin|gingerbread|spice|cinnamon/, ['cake-spice', 'cake-cream-cheese', 'cake-spice']],
  [/caramel|maple|dulce|toffee/, ['cake-golden', 'cake-caramel', 'cake-caramel']],
  [/coconut/, ['cake-vanilla', 'cake-meringue', 'cake-buttercream']],
  [/almond/, ['cake-vanilla', 'cake-buttercream', 'cake-praline']],
  [/cheesecake|cream cheese|plain \(classic\)|new york/, ['cake-vanilla', 'cake-cream-cheese', 'cake-cream-cheese']],
  [/funfetti|vanilla/, ['cake-vanilla', 'cake-buttercream', 'cake-custard']],
];

const SLOT_DEFAULT: Record<Slot, CakeColor> = { sponge: 'cake-vanilla', cream: 'cake-buttercream', fill: 'cake-custard' };
const KIND_DEFAULT: Partial<Record<ComponentKind, CakeColor>> = { crust: 'cake-graham', crunch: 'cake-praline' };

function slotFor(kind: ComponentKind): Slot {
  if (kind === 'sponge' || kind === 'soak') return 'sponge';
  if (kind === 'frosting' || kind === 'mousse' || kind === 'glaze') return 'cream';
  return 'fill';
}

/**
 * Closest cake color by ingredient (designer decision 2026-11-28: custom flavors borrow the
 * closest existing color rather than a neutral). Works on component names, which carry the
 * flavor ("Lemon sponge", "Raspberry insert").
 */
export function closestCakeColor(text: string, kind: ComponentKind = 'sponge'): CakeColor {
  const t = text.toLowerCase();
  // A cheesecake filling is cream-colored whatever its flavor.
  if (kind === 'base' && /cheesecake/.test(t)) return 'cake-cream-cheese';
  for (const [re, c] of STRUCTURE) if (re.test(t)) return c;
  if (kind === 'crust' || kind === 'crunch') {
    if (/chocolate|fudge|cookie/.test(t)) return kind === 'crust' ? 'cake-cookie' : 'cake-ganache';
    return KIND_DEFAULT[kind]!;
  }
  const slot = slotFor(kind);
  const i = slot === 'sponge' ? 0 : slot === 'cream' ? 1 : 2;
  for (const [re, cs] of FLAVOR) if (re.test(t)) return cs[i];
  return KIND_DEFAULT[kind] ?? SLOT_DEFAULT[slot];
}

/** A flavor's chip color: cake flavors show their sponge; other desserts show their main layer. */
export function flavorColor(name: string, category: DessertType): CakeColor {
  return closestCakeColor(name, category === 'cake' ? 'sponge' : 'filling');
}

/** CSS for a layer band or chip in this color. */
export function cakeColorStyle(c: CakeColor): { background: string; color: string } {
  return { background: `var(--${c})`, color: CAKE_COLORS[c].ink === 'milk' ? 'var(--milk)' : 'var(--espresso)' };
}
