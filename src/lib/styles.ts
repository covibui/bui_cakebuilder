import type { CakeStyle, DessertType, Project, Shape, Tier, TartStyle, Variant } from './types';
import { suggestTiers } from './scaling';

/**
 * Styles within a dessert type (from the pies, tarts & other cakes research, 2026-11-27).
 * Each style picks its own pan, so choosing a style also sets the shape.
 */
export const STYLES: Partial<Record<DessertType, [Variant, string][]>> = {
  cake: [
    ['layer', 'Layer cake'],
    ['entremet', 'Entremet'],
    ['cupcake', 'Cupcakes'],
    ['bundt', 'Bundt or pound'],
    ['chiffon', 'Chiffon'],
    ['angel-food', 'Angel food'],
    ['roll', 'Roll cake'],
  ],
  cheesecake: [
    ['baked', 'Baked (New York)'],
    ['no-bake', 'No-bake'],
    ['basque', 'Basque (burnt)'],
  ],
  tart: [
    ['set', 'Filling in a baked shell'],
    ['baked', 'Filling baked in the shell'],
  ],
};

const DEFAULT_VARIANT: Partial<Record<DessertType, Variant>> = { cake: 'layer', cheesecake: 'baked', tart: 'set' };

/** The project's style, falling back to the type's default (unset = layer / baked / set). */
export function styleOf(p: Pick<Project, 'dessertType' | 'variant'>): Variant | undefined {
  const allowed = STYLES[p.dessertType]?.map(([v]) => v) ?? [];
  if (p.variant && allowed.includes(p.variant)) return p.variant;
  return DEFAULT_VARIANT[p.dessertType];
}

export function cakeStyle(p: Pick<Project, 'dessertType' | 'variant'>): CakeStyle | null {
  return p.dessertType === 'cake' ? (styleOf(p) as CakeStyle) : null;
}

export function tartStyle(p: Pick<Project, 'dessertType' | 'variant'>): TartStyle | null {
  return p.dessertType === 'tart' ? (styleOf(p) as TartStyle) : null;
}

/** Pan for a cake style. Sizes marked (assumed) have no source yet. */
export function defaultSize(style: CakeStyle, servings: number | null): { shape: Shape; tiers: Tier[] } {
  switch (style) {
    case 'entremet':
      return { shape: 'ring', tiers: [{ sizeIn: 7, layers: 1 }] }; // (assumed) a common 18 cm ring
    case 'cupcake':
      return { shape: 'cupcake', tiers: [{ sizeIn: servings || 12, layers: 1 }] };
    case 'bundt':
      return { shape: 'bundt', tiers: [{ sizeIn: 10, layers: 1 }] };
    case 'chiffon':
    case 'angel-food':
      return { shape: 'tube', tiers: [{ sizeIn: 10, layers: 1 }] }; // King Arthur: 10" angel food pan
    case 'roll':
      return { shape: 'jelly-roll', tiers: [{ sizeIn: 15, layers: 1 }] };
    case 'layer':
    default:
      return { shape: 'round', tiers: suggestTiers(servings ?? 12) };
  }
}

/** Single-pan styles: no tiers or layer counts to edit. */
export function isSinglePan(shape: Shape): boolean {
  return shape === 'bundt' || shape === 'tube' || shape === 'jelly-roll' || shape === 'sheet';
}

/** How the cross-section is drawn: a stack of bands, or a swirl for roll cakes. */
export function sectionForm(p: Pick<Project, 'dessertType' | 'variant'>): 'stack' | 'swirl' {
  return cakeStyle(p) === 'roll' ? 'swirl' : 'stack';
}
