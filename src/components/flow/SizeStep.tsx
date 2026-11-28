'use client';

import type { Bundle } from '@/lib/repo';
import { saveProject } from '@/lib/repo';
import { suggestTiers } from '@/lib/scaling';
import type { Shape, Size } from '@/lib/types';
import { isSinglePan } from '@/lib/styles';
import { Button, Card, Field, H1, H2, Input, NextRow, Segmented } from '@/components/ui';
import type { StepProps } from './ProjectFlow';

const SHAPES: [Shape, string][] = [
  ['round', 'Round'], ['square', 'Square'], ['sheet', 'Sheet (9×13)'], ['oval', 'Oval'], ['dome', 'Dome'], ['cupcake', 'Cupcakes'],
  ['ring', 'Entremet ring'], ['bundt', 'Bundt'], ['tube', 'Tube'], ['jelly-roll', 'Jelly roll (10×15)'],
];

const SINGLE: Partial<Record<Shape, { sizeIn: number; layers: number }>> = {
  sheet: { sizeIn: 13, layers: 1 }, 'jelly-roll': { sizeIn: 15, layers: 1 }, bundt: { sizeIn: 10, layers: 1 }, tube: { sizeIn: 10, layers: 1 },
};

export default function SizeStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const setSize = (size: Partial<Size>) => saveProject({ ...p, size: { ...p.size, ...size } });
  const setServings = (n: number | null) => saveProject({ ...p, request: { ...p.request, servings: n } });
  const tiers = p.size.tiers;
  const cupcake = p.size.shape === 'cupcake';

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <H1>Size and servings</H1>
        <p className="text-espresso-muted">Form comes last. Pans are suggested from servings.</p>
      </div>
      <Field label="Servings" hint="Pans are suggested from this, then you can change them.">
        <div className="flex gap-2">
          <Input type="number" min={1} className="w-28" value={p.request.servings ?? ''} onChange={(e) => setServings(e.target.value ? Number(e.target.value) : null)} />
          <Button onClick={() => setSize({ tiers: suggestTiers(p.request.servings ?? 12) })}>Suggest pans</Button>
        </div>
      </Field>

      <div className="flex flex-col gap-2">
        <H2>Shape</H2>
        <Segmented label="Shape" value={p.size.shape} options={SHAPES} onChange={(s) => setSize({ shape: s, tiers: SINGLE[s] ? [SINGLE[s]!] : s === 'cupcake' ? [{ sizeIn: p.request.servings ?? 12, layers: 1 }] : s === 'ring' ? [{ sizeIn: 7, layers: 1 }] : tiers })} />
      </div>

      {isSinglePan(p.size.shape) && p.size.shape !== 'sheet' && p.size.shape !== 'jelly-roll' && (
        <Field label="Pan diameter (in)">
          <Input type="number" min={6} className="w-24" value={tiers[0]?.sizeIn ?? 10} onChange={(e) => setSize({ tiers: [{ sizeIn: Number(e.target.value), layers: 1 }] })} />
        </Field>
      )}

      {!isSinglePan(p.size.shape) && (
        <div className="flex flex-col gap-2">
          <H2>{cupcake ? 'How many' : 'Tiers, top to bottom'}</H2>
          {tiers.map((t, i) => (
            <Card key={i} className="flex flex-wrap items-end gap-3">
              <Field label={cupcake ? 'Cupcakes' : 'Pan size (in)'}>
                <Input type="number" min={1} className="w-24" value={t.sizeIn} onChange={(e) => setSize({ tiers: tiers.map((x, k) => (k === i ? { ...x, sizeIn: Number(e.target.value) } : x)) })} />
              </Field>
              {!cupcake && (
                <Field label="Layers">
                  <Input type="number" min={1} className="w-20" value={t.layers} onChange={(e) => setSize({ tiers: tiers.map((x, k) => (k === i ? { ...x, layers: Number(e.target.value) } : x)) })} />
                </Field>
              )}
              {tiers.length > 1 && <Button onClick={() => setSize({ tiers: tiers.filter((_, k) => k !== i) })}>Remove tier</Button>}
            </Card>
          ))}
          {!cupcake && <div><Button onClick={() => setSize({ tiers: [{ sizeIn: Math.max(4, (tiers.at(-1)?.sizeIn ?? 8) - 2), layers: 3 }, ...tiers] })}>+ Add a tier on top</Button></div>}
        </div>
      )}

      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-ribbon" checked={p.size.justEnough} onChange={() => setSize({ justEnough: !p.size.justEnough })} />
        <span>
          <b>Just enough</b>
          <span className="block text-espresso-muted">{p.size.justEnough ? 'Leftover: about one slice’s worth.' : 'Adds about 10% extra for safety.'}</span>
        </span>
      </label>

      <NextRow hint="Next: your full build, recipes and timeline.">
        <Button primary onClick={() => go('build')}>See your build →</Button>
      </NextRow>
    </section>
  );
}
