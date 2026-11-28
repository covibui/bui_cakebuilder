'use client';

import type { Bundle } from '@/lib/repo';
import { db } from '@/lib/db';
import { deriveTitle, saveProject, useFlavors } from '@/lib/repo';
import type { BuildMode, CakeStyle, DessertType, Project, Variant } from '@/lib/types';
import { STYLES, defaultSize, styleOf } from '@/lib/styles';
import { DESSERT_LABEL } from '@/lib/templates';
import { Card, Chip, H1, H2 } from '@/components/ui';
import type { StepProps } from './ProjectFlow';

const MODES: { mode: BuildMode; title: string; text: string }[] = [
  { mode: 'know', title: 'I know what I want', text: 'Pick the flavors, then the app suggests what goes inside.' },
  { mode: 'inspire', title: 'Inspire me', text: 'Get flavor ideas from their request and popular pairings.' },
  { mode: 'blank', title: 'Blank builder', text: 'Start from an empty cake and add every part yourself.' },
];

export default function ForkStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const flavors = useFlavors() ?? [];

  const withPan = (next: Project): Project =>
    next.dessertType === 'cake' ? { ...next, size: { ...next.size, ...defaultSize(styleOf(next) as CakeStyle, next.request.servings) } } : next;

  const setType = (dessertType: DessertType) => {
    const next = withPan({ ...p, dessertType, variant: undefined });
    return saveProject({ ...next, title: p.titleIsCustom ? p.title : deriveTitle(next, flavors) });
  };

  const setStyle = (variant: Variant) => {
    const next = withPan({ ...p, variant });
    return saveProject({ ...next, title: p.titleIsCustom ? p.title : deriveTitle(next, flavors) });
  };
  const styles = STYLES[p.dessertType];

  const pick = async (buildMode: BuildMode) => {
    await saveProject({ ...p, buildMode });
    if (buildMode === 'blank') {
      await db().components.where('projectId').equals(p.id).delete();
      go('comp');
    } else go('flavor');
  };

  return (
    <section className="flex flex-col gap-6">
      <H1>How do you want to build?</H1>
      <div className="flex flex-col gap-2">
        <H2>What are you making?</H2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DESSERT_LABEL) as DessertType[]).map((t) => (
            <Chip key={t} on={p.dessertType === t} onClick={() => setType(t)}>{DESSERT_LABEL[t]}</Chip>
          ))}
        </div>
        {styles && (
          <div className="flex flex-col gap-2">
            <H2>What style?</H2>
            <div className="flex flex-wrap gap-2">
              {styles.map(([v, l]) => (
                <Chip key={v} on={styleOf(p) === v} onClick={() => setStyle(v)}>{l}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((m) => (
          <button key={m.mode} type="button" onClick={() => pick(m.mode)} className="text-left">
            <Card className={`h-full hover:border-neutral-800 ${p.buildMode === m.mode ? 'border-neutral-800' : ''}`}>
              <p className="text-lg font-semibold">{m.title}</p>
              <p className="mt-1 text-neutral-600">{m.text}</p>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
