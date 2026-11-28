'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppBar, Button, ButtonLink, Card, H1, Page, Tag } from '@/components/ui';
import { IsoPreview } from '@/components/recipe';
import { createProject, useFlavors, useProjects } from '@/lib/repo';
import { DESSERT_LABEL } from '@/lib/templates';
import type { Flavor, Project } from '@/lib/types';

const STATUS = { planning: 'Planning', baking: 'Baking', baked: 'Baked' } as const;
const TAPES = ['gingham', 'rose', 'pistachio', 'latte'] as const;

function SavedCake({ p, flavor, i }: { p: Project; flavor?: Flavor; i: number }) {
  const fresh = p.status === 'planning' && p.title.startsWith('New');
  const build = `/project?id=${p.id}&step=${fresh ? 'request' : 'build'}`;
  const color = flavor ? `var(--${flavor.color})` : 'var(--cake-vanilla)';
  return (
    <Card tape={TAPES[i % TAPES.length]} className="flex h-full flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        {p.request.occasion ? <Tag tone="soft">{p.request.occasion}</Tag> : <span />}
        <Tag tone={p.status === 'baked' ? 'pistachio' : p.status === 'baking' ? 'butter' : 'rose'}>{STATUS[p.status]}</Tag>
      </div>
      {/* A saved cake leads back to its build (I23). */}
      <Link href={build} className="font-display text-xl font-bold leading-[30px] tracking-[-.22px] hover:underline">{p.title}</Link>
      <p className="text-xs text-espresso-muted">
        {[DESSERT_LABEL[p.dessertType], p.request.servings ? `${p.request.servings} servings` : null, p.request.forWho ? `for ${p.request.forWho}` : null, p.request.date].filter(Boolean).join(' · ')}
      </p>
      <div aria-hidden className="my-3 flex flex-col gap-[2px]">
        <span className="h-2 rounded-[2px] bg-cake-buttercream shadow-[inset_0_0_0_1px_var(--latte)]" />
        <span className="h-3.5 rounded-[2px]" style={{ background: color }} />
        <span className="h-2 rounded-[2px] bg-cake-raspberry/80" />
        <span className="h-3.5 rounded-[2px]" style={{ background: color }} />
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink href={build} primary small>{fresh ? 'Keep planning' : 'Open build'}</ButtonLink>
        {!fresh && <ButtonLink href={`/project?id=${p.id}&step=cook`} small>Bake again</ButtonLink>}
      </div>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const projects = useProjects();
  const flavors = useFlavors() ?? [];

  const start = async () => {
    const id = await createProject();
    router.push(`/project?id=${id}&step=request`);
  };

  return (
    <>
      <AppBar>
        <ButtonLink href="/logs" small>Bake log</ButtonLink>
        <Button primary small onClick={start}>+ New cake</Button>
      </AppBar>
      <Page>
        {projects === undefined ? null : projects.length === 0 ? (
          <section className="grid min-h-[70vh] items-center gap-8 py-6 md:grid-cols-[1fr_minmax(0,22rem)]">
            <div className="flex flex-col gap-3">
              <p className="font-display text-[50px] font-bold leading-[57px] tracking-[-.16px]">Let&apos;s build a cake</p>
              <p className="max-w-md text-espresso-muted">Start with who it&apos;s for and what they asked for. Flavor first, form last. Every amount shows where it came from.</p>
              <div><Button primary onClick={start}>+ New cake</Button></div>
            </div>
            <figure className="relative mx-auto w-full max-w-xs -rotate-2 bg-paper p-3.5 pb-12 shadow-polaroid">
              <IsoPreview />
              <figcaption className="absolute inset-x-0 bottom-3 text-center font-display text-[15px] font-medium">your next cake</figcaption>
              <span aria-hidden className="absolute -left-3 -top-2 block h-5 w-20 -rotate-12 [background:repeating-linear-gradient(90deg,rgba(255,255,255,.4)_0_5px,transparent_5px_10px),var(--pistachio)]" />
              <span aria-hidden className="absolute -right-3 -top-2 block h-5 w-20 rotate-12 [background:repeating-linear-gradient(90deg,rgba(255,255,255,.4)_0_5px,transparent_5px_10px),var(--rose)]" />
            </figure>
          </section>
        ) : (
          <>
            <H1>Your cakes</H1>
            <ul className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <li key={p.id}>
                  <SavedCake p={p} i={i} flavor={flavors.find((f) => f.id === p.flavors.primary)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Page>
    </>
  );
}
