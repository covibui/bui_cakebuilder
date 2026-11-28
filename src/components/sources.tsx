'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { importHandoff, importLink, saveManualRecipe, useFlavors } from '@/lib/repo';
import { buildPrompt, parseReply } from '@/lib/handoff';
import { newId } from '@/lib/db';
import { parseIngredientLine } from '@/lib/ingredientLine';
import type { BasePan, Component, Recipe, Shape } from '@/lib/types';
import { Button, Card, Field, H2, Input, Note, Select, TextArea } from './ui';

/** Copy-prompt handoff: copy → paste into Claude → paste the JSON back. */
export function HandoffPanel({ bundle }: { bundle: Bundle }) {
  const flavors = useFlavors() ?? [];
  const [reply, setReply] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const p = bundle.project;
  const byId = new Map(flavors.map((f) => [f.id, f.name]));
  const names = [p.flavors.primary, ...p.flavors.pairings].filter(Boolean).map((id) => byId.get(id!) ?? '').concat(p.flavors.custom).filter(Boolean);
  const wanted = bundle.components.filter((c) => c.included && !c.recipeId).map((c) => c.name);
  const prompt = buildPrompt(p, names, wanted);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('Copied. Paste it into Claude, then paste Claude’s reply below.');
    } catch {
      setStatus('Copy didn’t work here. Select the prompt text below and copy it.');
    }
  };

  const importIt = async () => {
    const r = parseReply(reply);
    setProblems(r.problems);
    if (!r.ok) return setStatus('Nothing was added. Fix the problems below, or ask Claude to resend.');
    await importHandoff(p.id, r.reply);
    setReply('');
    setStatus(`Added ${r.reply.components.length} recipe${r.reply.components.length === 1 ? '' : 's'}.`);
  };

  return (
    <Card tape="pistachio" label="Ask Claude" className="flex flex-col gap-3">
      <H2>Get the missing recipes</H2>
      <p className="text-espresso-muted">{wanted.length ? `For: ${wanted.join(', ')}.` : 'Every included part has a recipe. Copy again to replace them.'}</p>
      <div className="flex flex-wrap gap-2">
        <Button primary onClick={copy}>Copy prompt</Button>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-semibold">See the prompt</summary>
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-paper-warm p-3 font-accent text-xs">{prompt}</pre>
      </details>
      <Field label="Paste Claude’s reply">
        <TextArea rows={5} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Paste the whole reply; the JSON is found automatically." />
      </Field>
      <div><Button onClick={importIt} disabled={!reply.trim()}>Add recipes</Button></div>
      {status && <p role="status" className="text-sm">{status}</p>}
      {problems.map((x) => <Note key={x} tone="warn">{x}</Note>)}
    </Card>
  );
}

const SHAPES: Shape[] = ['round', 'square', 'sheet'];

function BasePanFields({ pan, setPan }: { pan: BasePan; setPan: (p: BasePan) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Field label="Recipe’s pan">
        <Select value={pan.shape} onChange={(e) => setPan({ ...pan, shape: e.target.value as Shape })}>
          {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Size (in)"><Input type="number" min={1} className="w-20" value={pan.sizeIn} onChange={(e) => setPan({ ...pan, sizeIn: Number(e.target.value) })} /></Field>
      <Field label="Layers"><Input type="number" min={1} className="w-20" value={pan.layers} onChange={(e) => setPan({ ...pan, layers: Number(e.target.value) })} /></Field>
    </div>
  );
}

/** For a component without a recipe: paste a link, or write it yourself. */
/** Add or change a component's recipe. With `recipe`, it edits: the current one is filled in, ready to change (Round 8 fix). */
export function RecipeSource({ component, recipe, onDone }: { component: Component; recipe?: Recipe; onDone?: () => void }) {
  const [mode, setMode] = useState<'link' | 'manual' | null>(recipe ? 'manual' : null);
  const [url, setUrl] = useState('');
  const [pan, setPan] = useState<BasePan>(recipe?.basePan ?? { shape: 'round', sizeIn: 8, layers: 2 });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ings, setIngs] = useState(recipe ? recipe.ingredients.map((i) => `${i.amount} ${i.unit === 'count' ? '' : i.unit + ' '}${i.name}`.replace(/\s+/g, ' ')).join('\n') : '');
  const [steps, setSteps] = useState(recipe ? recipe.steps.map((x) => x.text.replace(/\{\w+\|([^}]*)\}/g, '$1')).join('\n') : ''); // plain text: marks are app data, not something to type

  const fromLink = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/recipe-from-link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error ?? 'Could not read that link.');
      const skipped = await importLink(component, data.recipe, pan);
      setMsg(skipped.length ? `Added. Couldn’t read: ${skipped.join('; ')}. Add those by hand.` : 'Added.');
      if (!skipped.length) onDone?.();
    } catch {
      setMsg('You seem to be offline. Links need a connection.');
    } finally {
      setBusy(false);
    }
  };

  const manual = async () => {
    const parsed = ings.split('\n').map((l) => l.trim()).filter(Boolean).map(parseIngredientLine);
    const bad = parsed.filter((x) => !x.ingredient).map((x) => x.raw);
    if (bad.length) return setMsg(`Couldn’t read: ${bad.join('; ')}. Use “amount unit name”, e.g. 120 g sugar.`);
    const now = Date.now();
    await saveManualRecipe(component, {
      id: newId(), title: component.name, basePan: pan, yieldGrams: null,
      ingredients: parsed.map((x) => x.ingredient!), steps: steps.split('\n').map((s) => s.trim()).filter(Boolean).map((text) => ({ text })),
      origin: 'manual', sourceUrl: null, createdAt: now, updatedAt: now,
    });
    onDone?.();
  };

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-espresso-muted">{recipe ? 'Replace it:' : 'No recipe yet.'}</span>
        <Button onClick={() => setMode('link')}>Paste a recipe link</Button>
        <Button onClick={() => setMode('manual')}>Write it myself</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mode === 'link' ? (
        <Field label="Recipe link" hint="Most recipe sites work. It’s cited as a source.">
          <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </Field>
      ) : (
        <>
          <Field label="Ingredients, one per line" hint="e.g. 120 g sugar · 1 ½ cups flour · 3 eggs">
            <TextArea rows={5} value={ings} onChange={(e) => setIngs(e.target.value)} />
          </Field>
          <Field label="Steps, one per line"><TextArea rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} /></Field>
        </>
      )}
      <BasePanFields pan={pan} setPan={setPan} />
      {recipe && mode === 'manual' && <p className="text-xs text-espresso-muted">Your edits save as your own recipe; its marks become “written by you”.</p>}
      <div className="flex flex-wrap gap-2">
        <Button primary onClick={mode === 'link' ? fromLink : manual} disabled={busy || (mode === 'link' ? !url : !ings.trim())}>{busy ? 'Reading…' : 'Save recipe'}</Button>
        {recipe && mode === 'manual' && <Button onClick={() => setMode('link')}>Use a link instead</Button>}
        <Button quiet onClick={() => (recipe ? onDone?.() : setMode(null))}>Cancel</Button>
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </div>
  );
}
