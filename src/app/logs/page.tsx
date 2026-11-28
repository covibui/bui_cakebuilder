'use client';

import Link from 'next/link';
import { AppBar, ButtonLink, Card, H1, Page, Tag } from '@/components/ui';
import { useBakeLogs, useProjects } from '@/lib/repo';

export default function LogsPage() {
  const logs = useBakeLogs();
  const projects = useProjects() ?? [];
  const title = (id: string) => projects.find((p) => p.id === id)?.title ?? 'Deleted cake';

  return (
    <>
      <AppBar>
        <ButtonLink href="/" small>Your cakes</ButtonLink>
      </AppBar>
      <Page className="max-w-3xl">
        <H1>Bake log</H1>
        {logs?.length === 0 && (
          <Card label="Nothing yet">
            <p className="text-espresso-muted">Bakes you log show here, and their notes lead the next bake.</p>
          </Card>
        )}
        <ul className="flex flex-col gap-5">
          {logs?.map((l, i) => (
            <li key={l.id}>
              <Card tape={(['pistachio', 'rose', 'latte'] as const)[i % 3]} className="flex flex-col gap-1">
                <span className="font-accent text-xs font-medium uppercase tracking-[.12em] text-espresso-muted">{l.bakedOn}</span>
                <Link href={`/project?id=${l.projectId}&step=build`} className="font-display text-xl font-bold hover:underline">{title(l.projectId)}</Link>
                <p className="flex flex-wrap gap-2 text-sm">
                  <Tag tone="rose">{l.results.filter((r) => r.verdict === 'change').length} changes</Tag>
                  <Tag>{l.measured.filter((m) => m.value).length} guesses tested</Tag>
                </p>
                {l.notes && <p className="mt-1 text-espresso-muted">“{l.notes}”</p>}
              </Card>
            </li>
          ))}
        </ul>
      </Page>
    </>
  );
}
