/**
 * Isometric round cake with the front quarter cut away, so both cut faces show the layers.
 * Pure geometry: takes the cross-section bands (top to bottom) and returns SVG shapes.
 * Self-contained (no imports) so it can also generate the design system preview.
 */

export interface IsoBand {
  id: string; // component id; repeated layers share it
  label: string;
  height: number; // relative thickness
  fill: string; // CSS color, e.g. var(--cake-raspberry)
  isFrosting?: boolean;
}

export interface IsoShape {
  d: string;
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  bandId?: string;
}

export interface IsoLabel {
  id: string;
  text: string;
  anchor: [number, number];
  at: [number, number];
}

export interface IsoCakeOptions {
  radius?: number; // px
  tilt?: number; // ellipse ratio (ry / rx); 0.5 = true isometric look
  height?: number; // target cake height in px
  cut?: number; // wedge angle removed, degrees
  labels?: boolean;
  highlight?: string; // band id drawn with a ribbon outline
}

export interface IsoCake {
  width: number;
  height: number;
  shapes: IsoShape[];
  labels: IsoLabel[];
}

const P = (n: number) => Math.round(n * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function buildIsoCake(bands: IsoBand[], o: IsoCakeOptions = {}): IsoCake {
  const R = o.radius ?? 120;
  const k = o.tilt ?? 0.42;
  const cut = o.cut ?? 90;
  const withLabels = o.labels ?? true;
  const shapes: IsoShape[] = [];
  const labels: IsoLabel[] = [];

  const total = bands.reduce((s, b) => s + b.height, 0) || 1;
  const H = o.height ?? Math.min(200, Math.max(110, total * 1.5));
  const scale = H / total;

  const pad = 16;
  const cx = pad + R * 1.2;
  const top = pad + R * k + 6;
  const bottom = top + H;
  const width = cx + R * 1.2 + (withLabels ? 220 : pad);
  const height = bottom + R * k * 1.2 + pad + 8;

  // Rim point at angle t (degrees; 90 = toward the viewer), radius r, at screen height y.
  const rim = (t: number, r: number, y: number): [number, number] => [cx + r * Math.cos(rad(t)), y + r * k * Math.sin(rad(t))];
  const arc = (t1: number, t2: number, r: number, y: number) => {
    const n = Math.max(2, Math.ceil(Math.abs(t2 - t1) / 4));
    return Array.from({ length: n + 1 }, (_, i) => rim(t1 + ((t2 - t1) * i) / n, r, y));
  };
  const path = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${P(x)},${P(y)}`).join(' L') + ' Z';

  const tR = 90 - cut / 2; // right cut face
  const tL = 90 + cut / 2; // left cut face

  // Layer offsets from the top.
  let acc = 0;
  const rows = bands.map((b) => {
    const a = acc;
    acc += b.height * scale;
    return { ...b, a, b: acc };
  });

  const frosted = rows.length > 0 && !!rows[0].isFrosting;
  const coat = frosted ? Math.min(10, Math.max(4, rows[0].b - rows[0].a)) : 0;
  const coatFill = frosted ? rows[0].fill : '';

  // Plate and shadow.
  const plate = (r: number, y: number) => path(arc(0, 360, r, y));
  shapes.push({ d: plate(R * 1.22, bottom + 7), fill: 'var(--espresso)', opacity: 0.1 });
  shapes.push({ d: plate(R * 1.18, bottom + 3), fill: 'var(--latte)' });
  shapes.push({ d: plate(R * 1.18, bottom), fill: 'var(--paper)' });

  // Outer side: visible where the side faces the viewer (0–180°), minus the cut.
  const sideRanges: [number, number][] = [
    [0, tR],
    [tL, 180],
  ];
  const side = (t1: number, t2: number, a: number, b: number) => path([...arc(t1, t2, R, top + a), ...arc(t2, t1, R, top + b)]);
  for (const [t1, t2] of sideRanges) {
    if (t2 <= t1) continue;
    if (frosted) {
      shapes.push({ d: side(t1, t2, 0, H), fill: coatFill });
    } else {
      rows.forEach((row) => shapes.push({ d: side(t1, t2, row.a, row.b), fill: row.fill }));
    }
    // Roundness: darker toward the edges of the visible side.
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const s1 = t1 + ((t2 - t1) * i) / steps;
      const s2 = t1 + ((t2 - t1) * (i + 1)) / steps;
      const mid = (s1 + s2) / 2;
      const shade = Math.abs(Math.cos(rad(mid))) * 0.16;
      shapes.push({ d: side(s1, s2, 0, H), fill: 'var(--espresso)', opacity: P(shade * 100) / 100 });
    }
  }

  // Top surface: the full disc minus the cut wedge.
  const topFill = rows[0]?.fill ?? 'var(--cake-vanilla)';
  shapes.push({ d: path([[cx, top], ...arc(tL, tR + 360, R, top)]), fill: topFill });
  shapes.push({ d: path([[cx, top], ...arc(tL, tR + 360, R, top)]), fill: 'var(--paper)', opacity: 0.1 });

  // Cut faces: strips from the center line out to the rim.
  const face = (t: number, r0: number, r1: number, a: number, b: number) => {
    const p0 = rim(t, r0, top + a), p1 = rim(t, r1, top + a), p2 = rim(t, r1, top + b), p3 = rim(t, r0, top + b);
    return path([p0, p1, p2, p3]);
  };
  for (const [t, dark] of [
    [tL, 0],
    [tR, 0.1],
  ] as [number, number][]) {
    rows.forEach((row, i) => {
      const full = frosted && i === 0; // top frosting runs to the rim
      shapes.push({ d: face(t, 0, full ? R : R - coat, row.a, row.b), fill: row.fill, bandId: row.id });
    });
    if (frosted) shapes.push({ d: face(t, R - coat, R, rows[0].b, H), fill: coatFill, bandId: rows[0].id });
    if (dark) shapes.push({ d: face(t, 0, R, 0, H), fill: 'var(--espresso)', opacity: dark });
    // Thin seams between layers.
    rows.slice(1).forEach((row) => {
      const [x0, y0] = rim(t, 0, top + row.a), [x1, y1] = rim(t, frosted ? R - coat : R, top + row.a);
      shapes.push({ d: `M${P(x0)},${P(y0)} L${P(x1)},${P(y1)}`, fill: 'none', stroke: 'var(--espresso)', strokeWidth: 0.5, opacity: 0.25 });
    });
  }

  // Highlight the selected layer on both faces.
  if (o.highlight) {
    rows.forEach((row, i) => {
      if (row.id !== o.highlight) return;
      for (const t of [tL, tR]) {
        const full = frosted && i === 0;
        const d = face(t, 0, full ? R : R - coat, row.a, row.b);
        shapes.push({ d, fill: 'none', stroke: 'var(--paper)', strokeWidth: 6 }); // paper gap, then ribbon, like LayerBand
        shapes.push({ d, fill: 'none', stroke: 'var(--ribbon)', strokeWidth: 2.5 });
      }
    });
  }

  // Center line where the faces meet.
  shapes.push({ d: `M${P(cx)},${P(top)} L${P(cx)},${P(bottom)}`, fill: 'none', stroke: 'var(--espresso)', strokeWidth: 0.75, opacity: 0.35 });

  // Labels: one per component, pointing at its first layer on the right face.
  if (withLabels) {
    const seen = new Set<string>();
    const lx = cx + R * 1.2 + 34;
    let lastY = -Infinity;
    rows.forEach((row) => {
      if (seen.has(row.id)) return;
      seen.add(row.id);
      const mid = (row.a + row.b) / 2;
      const anchor = rim(tR, (frosted ? R - coat : R) * 0.62, top + mid);
      const y = Math.max(anchor[1], lastY + 18);
      lastY = y;
      labels.push({ id: row.id, text: row.label, anchor, at: [lx, y] });
    });
  }

  return { width: Math.ceil(width), height: Math.ceil(Math.max(height, (labels.at(-1)?.at[1] ?? 0) + pad)), shapes, labels };
}

/** SVG markup, for static previews. */
export function isoCakeSvg(cake: IsoCake, title = 'Cake cross-section'): string {
  const s = cake.shapes
    .map((x) => `<path d="${x.d}" fill="${x.fill}"${x.opacity != null ? ` opacity="${x.opacity}"` : ''}${x.stroke ? ` stroke="${x.stroke}" stroke-width="${x.strokeWidth ?? 1}" stroke-linejoin="round"` : ''}/>`)
    .join('');
  const l = cake.labels
    .map(({ text, anchor: [ax, ay], at: [x, y] }) => `<circle cx="${P(ax)}" cy="${P(ay)}" r="2.5" fill="var(--espresso)"/><path d="M${P(ax)},${P(ay)} L${P(x - 22)},${P(y)} L${P(x - 6)},${P(y)}" fill="none" stroke="var(--espresso)" stroke-width="1"/><text x="${P(x)}" y="${P(y + 4)}" font-family="var(--font-body)" font-size="12" font-weight="700" fill="var(--espresso)">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cake.width} ${cake.height}" width="${cake.width}" height="${cake.height}" role="img" aria-label="${title}">${s}${l}</svg>`;
}

/**
 * Slice view: one slice as an isometric block (front face shows the layers, top and outer end
 * on the right), with labels. Matches the "cake sizes" reference: layer detail at a glance.
 */
export function buildIsoSlice(bands: IsoBand[], o: { width?: number; depth?: number; height?: number; labels?: boolean; highlight?: string } = {}): IsoCake {
  const w = o.width ?? 150;
  const depth = o.depth ?? 60;
  const dx = depth * 0.87, dy = depth * 0.5;
  const withLabels = o.labels ?? true;
  const total = bands.reduce((s, b) => s + b.height, 0) || 1;
  const H = o.height ?? Math.min(170, Math.max(70, total * 1.2));
  const scale = H / total;
  const pad = 16;
  const x0 = pad, top = pad + dy;
  const shapes: IsoShape[] = [];
  const labels: IsoLabel[] = [];
  const path = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${P(x)},${P(y)}`).join(' L') + ' Z';

  let acc = 0;
  const rows = bands.map((b) => { const a = acc; acc += b.height * scale; return { ...b, a, b: acc }; });
  const frosted = rows.length > 0 && !!rows[0].isFrosting;
  const coat = frosted ? Math.min(9, Math.max(4, rows[0].b - rows[0].a)) : 0;

  // Shadow
  shapes.push({ d: path([[x0 + 6, top + H + 4], [x0 + w + 6, top + H + 4], [x0 + w + dx + 6, top + H + 4 - dy], [x0 + dx + 6, top + H + 4 - dy]]), fill: 'var(--espresso)', opacity: 0.08 });
  // Outer end (right side): frosting coat, or the layers if naked.
  const sideStrip = (a: number, b: number) => path([[x0 + w, top + a], [x0 + w + dx, top + a - dy], [x0 + w + dx, top + b - dy], [x0 + w, top + b]]);
  if (frosted) shapes.push({ d: sideStrip(0, H), fill: rows[0].fill });
  else rows.forEach((r) => shapes.push({ d: sideStrip(r.a, r.b), fill: r.fill }));
  shapes.push({ d: sideStrip(0, H), fill: 'var(--espresso)', opacity: 0.14 });
  // Top
  shapes.push({ d: path([[x0, top], [x0 + w, top], [x0 + w + dx, top - dy], [x0 + dx, top - dy]]), fill: rows[0]?.fill ?? 'var(--cake-vanilla)' });
  shapes.push({ d: path([[x0, top], [x0 + w, top], [x0 + w + dx, top - dy], [x0 + dx, top - dy]]), fill: 'var(--paper)', opacity: 0.1 });
  // Front face: layers, with the frosting coat at the outer (right) end.
  rows.forEach((r, i) => {
    const full = frosted && i === 0;
    const xr = full ? x0 + w : x0 + w - coat;
    shapes.push({ d: path([[x0, top + r.a], [xr, top + r.a], [xr, top + r.b], [x0, top + r.b]]), fill: r.fill, bandId: r.id });
    if (o.highlight === r.id) {
      const d = path([[x0, top + r.a], [xr, top + r.a], [xr, top + r.b], [x0, top + r.b]]);
      shapes.push({ d, fill: 'none', stroke: 'var(--paper)', strokeWidth: 6 });
      shapes.push({ d, fill: 'none', stroke: 'var(--ribbon)', strokeWidth: 2.5 });
    }
  });
  if (frosted) shapes.push({ d: path([[x0 + w - coat, top + rows[0].b], [x0 + w, top + rows[0].b], [x0 + w, top + H], [x0 + w - coat, top + H]]), fill: rows[0].fill });
  rows.slice(1).forEach((r) => shapes.push({ d: `M${P(x0)},${P(top + r.a)} L${P(x0 + w - coat)},${P(top + r.a)}`, fill: 'none', stroke: 'var(--espresso)', strokeWidth: 0.5, opacity: 0.25 }));

  if (withLabels) {
    const seen = new Set<string>();
    const lx = x0 + w + dx + 40;
    let lastY = -Infinity;
    rows.forEach((r) => {
      if (seen.has(r.id)) return;
      seen.add(r.id);
      const anchor: [number, number] = [x0 + (w - coat) * 0.7, top + (r.a + r.b) / 2];
      const y = Math.max(anchor[1], lastY + 18);
      lastY = y;
      labels.push({ id: r.id, text: r.label, anchor, at: [lx, y] });
    });
  }
  const width = x0 + w + dx + (withLabels ? 200 : pad);
  const height = Math.max(top + H + pad + 6, (labels.at(-1)?.at[1] ?? 0) + pad);
  return { width: Math.ceil(width), height: Math.ceil(height), shapes, labels };
}
