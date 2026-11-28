import type { Component, ComponentKind, Size } from './types';

export interface Band {
  componentId: string;
  kind: ComponentKind;
  label: string;
  height: number; // display px at scale 1
}

const HEIGHT: Record<ComponentKind, number> = {
  crust: 12, base: 40, sponge: 40, soak: 8, filling: 18, insert: 18, crunch: 12, frosting: 12,
  mousse: 30, glaze: 6, topping: 12, other: 14,
};

const BETWEEN: ComponentKind[] = ['soak', 'filling', 'insert', 'crunch', 'other'];

/**
 * Cross-section for one tier, top to bottom, derived from included components.
 * Cake: frosting, then per layer [sponge, soak, filling, insert, crunch], last layer gets sponge + soak only.
 * Glaze, topping and frosting always sit on top. Entremet: mousse around the insert.
 * Others: base, then crust at the bottom. Roll cakes use rollSpiral instead.
 */
export function crossSection(components: Component[], size: Size, tier = 0): Band[] {
  const on = components.filter((c) => c.included);
  const of = (k: ComponentKind) => on.filter((c) => c.kind === k);
  const band = (c: Component): Band => ({ componentId: c.id, kind: c.kind, label: c.name, height: HEIGHT[c.kind] });
  const out: Band[] = [];
  ['glaze', 'topping', 'frosting'].forEach((k) => of(k as ComponentKind).forEach((c) => out.push(band(c))));
  const mousse = of('mousse');
  if (mousse.length) {
    // Entremet: insert set in the middle of the mousse, sponge and crunch underneath.
    mousse.forEach((c) => out.push(band(c)));
    of('insert').forEach((c) => out.push(band(c)));
    mousse.forEach((c) => out.push(band(c)));
    ['sponge', 'soak', 'filling', 'crunch', 'other', 'base', 'crust'].forEach((k) => of(k as ComponentKind).forEach((c) => out.push(band(c))));
    return out;
  }
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

/** Roll cake: the sponge and filling alternate as turns of a spiral, outside in. */
export function rollSpiral(components: Component[], turns = 3): Band[] {
  const on = components.filter((c) => c.included);
  const sponge = on.find((c) => c.kind === 'sponge');
  const fills = on.filter((c) => c.kind === 'filling' || c.kind === 'frosting' || c.kind === 'insert');
  if (!sponge) return [];
  const out: Band[] = [];
  for (let i = 0; i < turns; i++) {
    out.push({ componentId: sponge.id, kind: 'sponge', label: sponge.name, height: HEIGHT.sponge });
    fills.forEach((c) => out.push({ componentId: c.id, kind: c.kind, label: c.name, height: HEIGHT[c.kind] }));
  }
  return out;
}
