import type { ComponentKind, ComponentTag, DessertType } from './types';

export interface ComponentTemplate {
  kind: ComponentKind;
  name: string;
  why: string;
  tag: ComponentTag;
  included: boolean;
  makeAheadDay: number;
}

/**
 * Starting components per dessert type, before any AI help.
 * Names take the primary flavor ("Lemon sponge"). Make-ahead days follow v6.
 * Cheesecake and ice cream cake rules are placeholders until their research pass.
 */
const BASE: Record<DessertType, ComponentTemplate[]> = {
  cake: [
    { kind: 'sponge', name: '{f} sponge', why: 'The base layer of any layer cake', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'soak', name: '{f} syrup soak', why: 'Keeps the sponge moist', tag: 'suggested', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{f} filling', why: 'Adds flavor between layers', tag: 'suggested', included: true, makeAheadDay: -2 },
    { kind: 'insert', name: '{p} insert', why: 'A second flavor in the middle', tag: 'suggested', included: false, makeAheadDay: -2 },
    { kind: 'frosting', name: '{f} buttercream', why: 'Covers and holds the cake together', tag: 'suggested', included: true, makeAheadDay: 0 },
    { kind: 'crunch', name: 'Crunch layer', why: 'Optional texture between layers', tag: 'optional', included: false, makeAheadDay: -1 },
  ],
  cheesecake: [
    { kind: 'crust', name: 'Cookie crust', why: 'The base of most cheesecakes (Basque has none)', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'base', name: '{f} cheesecake filling', why: 'Baked or set the day before so it can chill overnight', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'insert', name: '{p} topping', why: 'Fruit or sauce to cut the richness', tag: 'suggested', included: true, makeAheadDay: 0 },
  ],
  tart: [
    { kind: 'crust', name: 'Tart shell', why: 'Holds the filling', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{f} filling', why: 'The main layer', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'frosting', name: '{p} topping', why: 'Finish and contrast', tag: 'suggested', included: true, makeAheadDay: 0 },
  ],
  'ice-cream-cake': [
    { kind: 'sponge', name: '{f} chiffon layer', why: 'Oil-based chiffon stays softer frozen than butter cake', tag: 'base', included: true, makeAheadDay: -2 },
    { kind: 'base', name: '{f} ice cream', why: 'The main layer; softened, then frozen between layers', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'crunch', name: 'Fudge crunch layer', why: 'Fudge glues the cake and ice cream together', tag: 'suggested', included: true, makeAheadDay: -1 },
    { kind: 'frosting', name: 'Whipped cream finish', why: 'Frosted on a frozen plate, then frozen at least 12 hours', tag: 'suggested', included: true, makeAheadDay: -1 },
  ],
};

export function componentTemplates(type: DessertType, primary: string, pairing: string, variant?: string): ComponentTemplate[] {
  const f = primary || 'Vanilla';
  const p = pairing || 'Fruit';
  return BASE[type]
    .map((t) => ({ ...t, name: t.name.replace('{f}', f).replace('{p}', p) }))
    .map((t) => (type === 'cheesecake' && variant === 'basque' && t.kind === 'crust' ? { ...t, included: false, why: 'Basque cheesecake has no crust' } : t));
}

export const DESSERT_LABEL: Record<DessertType, string> = {
  cake: 'Layer cake',
  cheesecake: 'Cheesecake',
  tart: 'Tart',
  'ice-cream-cake': 'Ice cream cake',
};

export const KIND_LABEL: Record<ComponentKind, string> = {
  sponge: 'Sponge', soak: 'Soak', filling: 'Filling', insert: 'Insert', frosting: 'Frosting',
  crunch: 'Crunch', crust: 'Crust', base: 'Base', other: 'Other',
};
