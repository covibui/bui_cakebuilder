import type { Component, ComponentKind, Size } from './types';

export interface Band {
  componentId: string;
  kind: ComponentKind;
  label: string;
  height: number; // display px at scale 1
}

const HEIGHT: Record<ComponentKind, number> = {
  crust: 12, base: 40, sponge: 40, soak: 8, filling: 18, insert: 18, crunch: 12, frosting: 12, other: 14,
};

const BETWEEN: ComponentKind[] = ['soak', 'filling', 'insert', 'crunch', 'other'];

/**
 * Cross-section for one tier, top to bottom, derived from included components.
 * Cake: frosting, then per layer [sponge, soak, filling, insert, crunch], last layer gets sponge + soak only.
 * Others: frosting/topping on top, base, crust at the bottom.
 */
export function crossSection(components: Component[], size: Size, tier = 0): Band[] {
  const on = components.filter((c) => c.included);
  const of = (k: ComponentKind) => on.filter((c) => c.kind === k);
  const band = (c: Component): Band => ({ componentId: c.id, kind: c.kind, label: c.name, height: HEIGHT[c.kind] });
  const out: Band[] = [];
  of('frosting').forEach((c) => out.push(band(c)));
  const sponges = of('sponge');
  if (sponges.length) {
    const layers = Math.max(1, size.tiers[tier]?.layers ?? 3);
    for (let i = 0; i < layers; i++) {
      sponges.forEach((c) => out.push(band(c)));
      of('soak').forEach((c) => out.push(band(c)));
      if (i < layers - 1) BETWEEN.filter((k) => k !== 'soak').forEach((k) => of(k).forEach((c) => out.push(band(c))));
    }
  } else {
    BETWEEN.forEach((k) => of(k).forEach((c) => out.push(band(c))));
  }
  of('base').forEach((c) => out.push(band(c)));
  of('crust').forEach((c) => out.push(band(c)));
  return out;
}
