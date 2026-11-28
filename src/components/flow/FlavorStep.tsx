'use client';

import { useState } from 'react';
import { flavorColor } from '@/lib/cakeColors';
import type { Bundle } from '@/lib/repo';
import { deriveTitle, resetComponents, saveProject, useFlavors } from '@/lib/repo';
import { db, newId } from '@/lib/db';
import { balanceWarnings } from '@/lib/balance';
import type { Flavor, Project } from '@/lib/types';
import { Button, Card, Chip, FieldLabel, H1, H2, Input, NextRow, Note } from '@/components/ui';
import type { StepProps } from './ProjectFlow';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, '').trim();

export default function FlavorStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const flavors = useFlavors() ?? [];
  const [custom, setCustom] = useState('');

  const pool = flavors.filter((f) => f.category === p.dessertType || (p.dessertType === 'ice-cream-cake' && f.category === 'cake'));
  const byId = new Map(flavors.map((f) => [f.id, f]));
  const primary = p.flavors.primary ? byId.get(p.flavors.primary) : undefined;
  const words = norm(p.request.words);
  const heard = pool.filter((f) => words.includes(norm(f.name).split(' ')[0]));

  const save = (next: Project) => saveProject({ ...next, title: next.titleIsCustom ? next.title : deriveTitle(next, flavors) });

  const setPrimary = (f: Flavor) => save({ ...p, flavors: { ...p.flavors, primary: f.id, pairings: [] } });

  // A pairing that matches a library flavor is stored by id, otherwise as free text.
  const pairingOn = (name: string) => {
    const lib = flavors.find((f) => norm(f.name) === norm(name));
    return lib ? p.flavors.pairings.includes(lib.id) : p.flavors.custom.includes(name);
  };
  const togglePairing = (name: string) => {
    const lib = flavors.find((f) => norm(f.name) === norm(name));
    const fl = { ...p.flavors };
    if (lib) fl.pairings = fl.pairings.includes(lib.id) ? fl.pairings.filter((x) => x !== lib.id) : [...fl.pairings, lib.id];
    else fl.custom = fl.custom.includes(name) ? fl.custom.filter((x) => x !== name) : [...fl.custom, name];
    save({ ...p, flavors: fl });
  };

  const addCustom = async () => {
    const name = custom.trim();
    if (!name) return;
    // "Fill in your own": added to the library unresearched, so it shows as an assumption.
    if (!flavors.some((f) => norm(f.name) === norm(name))) {
      await db().flavors.add({
        id: `custom-${newId()}`, name, category: p.dessertType, pairsWith: [], profile: { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 0 },
        profileIsAssumed: true, watchOut: 'Not researched yet', origin: 'custom', sources: [],
        color: flavorColor(name, p.dessertType), // closest existing cake color until researched
      });
    }
    if (!p.flavors.custom.includes(name)) await save({ ...p, flavors: { ...p.flavors, custom: [...p.flavors.custom, name] } });
    setCustom('');
  };

  const picked = [primary, ...p.flavors.pairings.map((id) => byId.get(id))].filter(Boolean) as Flavor[];
  const warnings = balanceWarnings(picked, p.request);

  // Inspire me: flavors they mentioned first, then the rest, each with its top two pairings.
  const ideas = [...heard, ...pool.filter((f) => !heard.includes(f))].slice(0, 6);

  const next = async () => {
    if (bundle.components.length === 0) await resetComponents(p, flavors);
    go('comp');
  };

  const taste = (['sweet', 'sour', 'salty', 'bitter', 'umami'] as const).map((k) => ({
    k,
    v: picked.length ? Math.round((picked.reduce((n, f) => n + f.profile[k], 0) / picked.length) * 20) : 0,
  }));
  const dot = (f?: Flavor) => (f ? `var(--${f.color})` : undefined);
  const byName = (name: string) => flavors.find((f) => norm(f.name) === norm(name));

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <H1>Flavors first</H1>
        {p.request.words && (
          <p className="text-espresso-muted">They said: “{p.request.words}”{heard.length > 0 && <> · heard <b className="text-espresso">{heard.map((f) => f.name).join(', ')}</b></>}</p>
        )}
      </div>

      {p.buildMode === 'inspire' && (
        <div className="grid gap-6 pt-2 sm:grid-cols-3">
          {ideas.map((f, i) => (
            <Card key={f.id} tape={(['rose', 'pistachio', 'latte'] as const)[i % 3]} selected={p.flavors.primary === f.id} className="flex flex-col gap-2">
              <span aria-hidden className="h-2 w-12 rounded-pill" style={{ background: dot(f) }} />
              <H2>{f.name}</H2>
              <p className="text-sm">with {f.pairsWith.slice(0, 2).join(' and ') || 'your pick'}</p>
              {f.watchOut && <p className="text-xs text-espresso-muted">{f.watchOut}</p>}
              <div className="mt-auto pt-1">
                <Button small onClick={() => save({ ...p, flavors: { primary: f.id, pairings: [], custom: f.pairsWith.slice(0, 1) } })}>Use this idea</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,18rem)]">
        <Card tape="latte" label="Flavor library" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <FieldLabel>Main flavor</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {pool.map((f) => (
                <Chip key={f.id} dot={dot(f)} on={p.flavors.primary === f.id} onClick={() => setPrimary(f)}>{f.name}</Chip>
              ))}
            </div>
          </div>

          {primary && (
            <div className="flex flex-col gap-2">
              <FieldLabel>Goes well with {primary.name}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {primary.pairsWith.map((name) => (
                  <Chip key={name} dot={dot(byName(name))} on={pairingOn(name)} onClick={() => togglePairing(name)}>{name}</Chip>
                ))}
              </div>
              {primary.watchOut && <Note>{primary.watchOut}</Note>}
            </div>
          )}

          <div className="flex max-w-md flex-col gap-2">
            <FieldLabel>Add your own</FieldLabel>
            <div className="flex gap-2">
              <Input className="flex-1" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Passion fruit" aria-label="Your own flavor" onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
              <Button onClick={addCustom}>Add</Button>
            </div>
            <p className="text-xs text-espresso-muted">We research it and add it to the library.</p>
            {p.flavors.custom.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.flavors.custom.map((c) => <Chip key={c} dot={dot(byName(c))} on onClick={() => togglePairing(c)}>{c} ×</Chip>)}
              </div>
            )}
          </div>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card label="Taste balance">
            {picked.length === 0 ? (
              <p className="text-sm text-espresso-muted">Pick a main flavor to see the balance.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {taste.map(({ k, v }) => (
                  <li key={k} className="grid grid-cols-[56px_1fr_28px] items-center gap-2 text-xs font-bold capitalize">
                    <span>{k}</span>
                    <span className="h-2.5 overflow-hidden rounded-pill bg-latte-light">
                      <span className="block h-full rounded-pill" style={{ width: `${v}%`, background: `var(--taste-${k})` }} />
                    </span>
                    <span className="text-right">{v}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-espresso-muted">Estimates until sourced.</p>
          </Card>
          {warnings.map((w) => <Note key={w} tone="warn">{w}</Note>)}
        </aside>
      </div>

      <NextRow hint={primary ? `Main flavor: ${primary.name}` : 'Pick a main flavor to continue.'}>
        <Button primary onClick={next} disabled={!primary && p.flavors.custom.length === 0}>Next: what goes inside →</Button>
      </NextRow>
    </section>
  );
}
