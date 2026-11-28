'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { bakeTimeline, componentGaps, planComponents, shoppingList } from '@/lib/plan';
import { displayAmount } from '@/lib/units';
import { DESSERT_LABEL } from '@/lib/templates';
import { processTips } from '@/lib/processRules';
import { Button, Card, FieldLabel, H1, H2, NextRow, Note, Segmented } from '@/components/ui';
import { closestCakeColor } from '@/lib/cakeColors';
import type { Component } from '@/lib/types';
import { sectionForm } from '@/lib/styles';
import { CitationKey, CitationProvider, CitedText, CrossSection, Mark, UnitToggle, useUnitPref } from '@/components/recipe';
import { HandoffPanel, RecipeSource } from '@/components/sources';
import type { StepProps } from './ProjectFlow';

type Tab = 'recipe' | 'shop' | 'time';

export default function BuildStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const [tab, setTab] = useState<Tab>('recipe');
  const [editing, setEditing] = useState<string | null>(null);
  const [pref, setPref] = useUnitPref();
  const plans = planComponents(p, bundle.components, bundle.recipes);
  const included = bundle.components.filter((c) => c.included).sort((a, b) => a.makeAheadDay - b.makeAheadDay);
  const gaps = componentGaps(p, bundle.components);
  const shop = shoppingList(plans);
  const days = bakeTimeline(p, bundle.components);
  const missing = included.filter((c) => !c.recipeId);
  const tips = processTips(p);
  const pans = p.size.shape === 'sheet' ? '9×13 in sheet' : p.size.shape === 'jelly-roll' ? '10×15 in jelly roll pan' : p.size.shape === 'bundt' || p.size.shape === 'tube' ? `${p.size.tiers[0]?.sizeIn ?? 10} in ${p.size.shape} pan` : p.size.tiers.map((t) => (p.size.shape === 'cupcake' ? `${t.sizeIn} cupcakes` : `${t.sizeIn} in ${p.size.shape} × ${t.layers}`)).join(' + ');

  const dayLabel = (c: Component) => days.find((d) => d.offset === c.makeAheadDay)?.label;

  return (
    <CitationProvider>
      <section className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <H1>{p.title}</H1>
            <p className="font-accent text-sm font-medium text-espresso-muted">
              {DESSERT_LABEL[p.dessertType]} for {p.request.forWho || 'someone'} · {p.request.servings ?? '?'} servings · {pans}
              {p.request.date && ` · ${p.request.date}`}
            </p>
          </div>
          <UnitToggle pref={pref} setPref={setPref} />
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
            <Card tape="rose" label="Cross-section">
              <CrossSection components={bundle.components} size={p.size} form={sectionForm(p)} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button small onClick={() => go('comp')}>Edit what’s inside</Button>
                <Button small onClick={() => go('size')}>Edit size</Button>
              </div>
            </Card>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            <Segmented label="View" value={tab} onChange={setTab} options={[['recipe', 'Written recipe'], ['shop', 'Shopping list'], ['time', 'Bake timeline']]} />

            {gaps.map((g) => <Note key={g} tone="warn">{g}</Note>)}
            {tips.length > 0 && (
              <Card label="Before you start">
                <ul className="flex flex-col gap-1.5">
                  {tips.map((t) => (
                    <li key={t.text}>
                      {t.text} <a className="text-sm text-espresso-muted underline" href={t.source.url} target="_blank" rel="noreferrer">source</a><Mark kind="source" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {plans.flatMap((x) => x.warnings).map((w) => <Note key={w} tone="warn">{w}</Note>)}

            {tab === 'recipe' && (
              <div className="flex flex-col gap-6">
                {missing.length > 0 && <HandoffPanel bundle={bundle} />}
                <CitationKey />
                {included.map((c, i) => {
                  const plan = plans.find((x) => x.component.id === c.id);
                  const isEditing = editing === c.id;
                  return (
                    <Card key={c.id} tape={i === 0 ? 'gingham' : undefined} className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span aria-hidden className="h-8 w-3 shrink-0 rounded-pill shadow-[inset_0_0_0_1px_rgba(74,52,44,.15)]" style={{ background: `var(--${closestCakeColor(c.name, c.kind)})` }} />
                          <div>
                            <H2>{c.name}</H2>
                            <p className="font-accent text-xs font-medium uppercase tracking-[.12em] text-espresso-muted">{dayLabel(c)}</p>
                          </div>
                        </div>
                        {/* Round 8 fix: changing a recipe is a labeled action in the card, not hidden. */}
                        {plan && !isEditing && <Button small onClick={() => setEditing(c.id)}>✎ Change recipe</Button>}
                      </div>
                      {plan && !isEditing ? (
                        <>
                          <FieldLabel>Ingredients · scaled for your pans</FieldLabel>
                          <ul className="grid gap-x-8 sm:grid-cols-2">
                            {plan.ingredients.map((ing) => (
                              <li key={ing.name} className="flex justify-between gap-3 border-b border-dashed border-latte py-1.5">
                                <span>{ing.name}</span>
                                <span className="font-accent font-medium">{displayAmount(ing, ing.scaled, pref)}</span>
                              </li>
                            ))}
                          </ul>
                          <FieldLabel>Method</FieldLabel>
                          <ol className="flex list-decimal flex-col gap-1 pl-5 leading-7">
                            {plan.recipe.steps.map((st, k) => (
                              <li key={k}><CitedText text={st.text} recipeId={plan.recipe.id} citations={bundle.citations} /></li>
                            ))}
                          </ol>
                          {/* Round 8 fix: feedback sits where problems are noticed. */}
                          <p className="flex flex-wrap items-center gap-1 self-start rounded-pill bg-butter py-1 pl-3 pr-1 text-xs font-bold">
                            Something off in this recipe?
                            <Button quiet small className="min-h-7 text-[13px]" onClick={() => setEditing(c.id)}>Fix it</Button>
                          </p>
                        </>
                      ) : (
                        <RecipeSource component={c} recipe={plan?.recipe} onDone={() => setEditing(null)} />
                      )}
                    </Card>
                  );
                })}
                {missing.length === 0 && included.length > 0 && <HandoffPanel bundle={bundle} />}
              </div>
            )}

            {tab === 'shop' && (
              <Card tape="latte" label="Shopping list">
                {shop.length === 0 ? (
                  <p className="text-espresso-muted">Add recipes to build the shopping list.</p>
                ) : (
                  <ul>
                    {shop.map((it) => (
                      <li key={`${it.name}|${it.unit}`} className="flex flex-wrap justify-between gap-3 border-b border-dashed border-latte py-2.5">
                        <span>
                          <b>{it.name}</b>
                          <span className="block text-xs text-espresso-muted">{it.usedBy.join(', ')}</span>
                        </span>
                        <span className="font-accent font-medium">{displayAmount({ name: it.name, amount: it.total, unit: it.unit, needsScale: it.needsScale }, it.total, pref)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {tab === 'time' && (
              <ol className="flex flex-col gap-5">
                {days.map((d, i) => (
                  <li key={d.offset}>
                    <Card tape={(['pistachio', 'latte', 'rose'] as const)[i % 3]} label={d.label}>
                      <ul className="flex flex-col gap-1.5">
                        {d.tasks.map((t) => (
                          <li key={t.text} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ribbon" />
                            <span>
                              {t.text}
                              {t.sourceUrl && <> <a className="text-sm text-espresso-muted underline" href={t.sourceUrl} target="_blank" rel="noreferrer">source</a><Mark kind="source" /></>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </li>
                ))}
              </ol>
            )}

            <NextRow hint={plans.length === 0 ? 'Add recipes to start baking.' : `Next: cook mode, step by step${days[0] ? `, starting ${days[0].label.toLowerCase()}` : ''}.`}>
              <Button primary onClick={() => go('cook')} disabled={plans.length === 0}>Start baking →</Button>
            </NextRow>
          </div>
        </div>
      </section>
    </CitationProvider>
  );
}
