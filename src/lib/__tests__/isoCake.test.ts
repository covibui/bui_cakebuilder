import { describe, expect, it } from 'vitest';
import { buildIsoCake, buildIsoSlice, type IsoBand } from '../isoCake';
import { sectionForm } from '../styles';

const bands: IsoBand[] = [
  { id: 'f', label: 'Buttercream', height: 12, fill: 'var(--cake-buttercream)', isFrosting: true },
  { id: 's', label: 'Sponge', height: 40, fill: 'var(--cake-vanilla)' },
  { id: 'j', label: 'Jam', height: 18, fill: 'var(--cake-raspberry)' },
  { id: 's', label: 'Sponge', height: 40, fill: 'var(--cake-vanilla)' },
];

describe('iso cake', () => {
  it('draws every layer on both cut faces', () => {
    const cake = buildIsoCake(bands, { labels: false });
    for (const id of ['f', 's', 'j']) expect(cake.shapes.filter((s) => s.bandId === id).length).toBeGreaterThanOrEqual(2);
  });
  it('labels each component once', () => {
    expect(buildIsoCake(bands).labels.map((l) => l.text)).toEqual(['Buttercream', 'Sponge', 'Jam']);
    expect(buildIsoSlice(bands).labels.map((l) => l.text)).toEqual(['Buttercream', 'Sponge', 'Jam']);
  });
  it('keeps labels at least 18px apart', () => {
    const ys = buildIsoCake([...bands, { id: 'k', label: 'Soak', height: 2, fill: 'var(--cake-golden)' }]).labels.map((l) => l.at[1]);
    ys.slice(1).forEach((y, i) => expect(y - ys[i]).toBeGreaterThanOrEqual(18));
  });
  it('fades every layer but the highlighted one', () => {
    const fades = buildIsoCake(bands, { highlight: 'j' }).shapes.filter((s) => s.fill === 'var(--paper)' && s.opacity === 0.55);
    expect(fades.length).toBe(6); // 3 other layers × 2 faces
  });
  it('gets taller with more layers', () => {
    const tall = buildIsoCake([...bands, ...bands.slice(1)], { labels: false });
    expect(tall.height).toBeGreaterThan(buildIsoCake(bands, { labels: false }).height);
  });
  it('is the cross-section for round cakes; rolls still swirl', () => {
    expect(sectionForm({ dessertType: 'cake', size: { shape: 'round' } })).toBe('iso');
    expect(sectionForm({ dessertType: 'cake', size: { shape: 'square' } })).toBe('stack');
  });
});

describe('iso cake patterns', () => {
  it('overlays each band pattern on the faces, sheared per plane', async () => {
    const { isoCakeInner } = await import('../isoCake');
    const cake = buildIsoCake(bands.map((b, i) => ({ ...b, pattern: i === 0 ? 'dots' : 'stripes' })), { labels: false });
    const svg = isoCakeInner(cake, 't');
    expect(svg).toContain('url(#t-dots-top)');
    expect(svg).toContain('url(#t-stripes-left)');
    expect(svg).toContain('url(#t-stripes-right)');
    expect(svg).toContain('id="t-stripes-right"');
  });
  it('draws no pattern for solid layers', () => {
    const cake = buildIsoCake(bands.map((b) => ({ ...b, pattern: 'none' as const })), { labels: false });
    expect(cake.shapes.some((s) => s.pattern)).toBe(false);
  });
});
