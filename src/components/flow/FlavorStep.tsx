'use client';

import { useState } from 'react';
import { flavorColor } from '@/lib/cakeColors';
import type { Bundle } from '@/lib/repo';
import { deriveTitle, resetComponents, saveProject, useFlavors } from '@/lib/repo';
import { db, newId } from '@/lib/db';
import { balanceWarnings } from '@/lib/balance';
import type { Flavor, Project } from '@/lib/types';
import { Button, Card, Chip, H1, H2, Input, Note } from '@/components/ui';
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

  return (
    <section className="flex flex-col gap-6">
      <H1>Flavors</H1>
      {p.request.words && (
        <p className="text-neutral-600">They said: “{p.request.words}”{heard.length > 0 && <> · heard <b>{heard.map((f) => f.name).join(', ')}</b></>}</p>
      )}

      {p.buildMode === 'inspire' && (
        <div className="flex flex-col gap-2">
          <H2>Ideas to start from</H2>
          <div className="grid gap-3 sm:grid-cols-3">
            {ideas.map((f) => (
              <button key={f.id} type="button" className="text-left" onClick={() => save({ ...p, flavors: { primary: f.id, pairings: [], custom: f.pairsWith.slice(0, 1) } })}>
                <Card className={`h-full hover:border-neutral-800 ${p.flavors.primary === f.id ? 'border-neutral-800' : ''}`}>
                  <p className="font-semibold">{f.name} with {f.pairsWith.slice(0, 2).join(' and ') || 'your pick'}</p>
                  {f.watchOut && <p className="text-sm text-neutral-600">{f.watchOut}</p>}
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <H2>Main flavor</H2>
        <div className="flex flex-wrap gap-2">
          {pool.map((f) => (
            <Chip key={f.id} on={p.flavors.primary === f.id} onClick={() => setPrimary(f)}>{f.name}</Chip>
          ))}
        </div>
      </div>

      {primary && (
        <div className="flex flex-col gap-2">
          <H2>Goes well with {primary.name}</H2>
          <div className="flex flex-wrap gap-2">
            {primary.pairsWith.map((name) => (
              <Chip key={name} on={pairingOn(name)} onClick={() => togglePairing(name)}>{name}</Chip>
            ))}
          </div>
          {primary.watchOut && <p className="text-sm text-neutral-600">Watch out: {primary.watchOut}</p>}
        </div>
      )}

      <div className="flex max-w-md flex-col gap-2">
        <H2>Fill in your own</H2>
        <div className="flex gap-2">
          <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Passion fruit" aria-label="Your own flavor" onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <Button onClick={addCustom}>Add</Button>
        </div>
        {p.flavors.custom.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.flavors.custom.map((c) => <Chip key={c} on onClick={() => togglePairing(c)}>{c} ×</Chip>)}
          </div>
        )}
      </div>

      {warnings.map((w) => <Note key={w} tone="warn">{w}</Note>)}

      <div><Button primary onClick={next} disabled={!primary && p.flavors.custom.length === 0}>Next: what goes inside</Button></div>
    </section>
  );
}
