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
  pattern?: IsoPattern; // scrapbook texture drawn in white over the fill
}

/** Café Scrapbook patterns. On cake faces only: never under text. */
export type IsoPattern = 'stripes' | 'chevron' | 'dots' | 'none'; // cake builder set: busier patterns stay on decoration only
/** Which plane a pattern lies in, so it is sheared to match the 3D face. */
export type IsoPlane = 'left' | 'right' | 'side' | 'top' | 'front' | 'sliceTop' | 'sliceSide';

export interface IsoShape {
  d: string;
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  bandId?: string;
  pattern?: { type: IsoPattern; plane: IsoPlane };
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
  tilt: number;
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
  const overlay = (d: string, type: IsoPattern | undefined, plane: IsoPlane) => {
    if (type && type !== 'none') shapes.push({ d, fill: 'none', pattern: { type, plane } });
  };

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
      overlay(side(t1, t2, 0, H), rows[0].pattern, 'side');
    } else {
      rows.forEach((row) => {
        shapes.push({ d: side(t1, t2, row.a, row.b), fill: row.fill });
        overlay(side(t1, t2, row.a, row.b), row.pattern, 'side');
      });
    }
    // Flat shading: one tone per side (left lit, right in shade).
    shapes.push({ d: side(t1, t2, 0, H), fill: 'var(--espresso)', opacity: t1 < 90 ? 0.16 : 0.06 });
  }
  // Top surface: the full disc minus the cut wedge.
  const topFill = rows[0]?.fill ?? 'var(--cake-vanilla)';
  const topD = path([[cx, top], ...arc(tL, tR + 360, R, top)]);
  shapes.push({ d: topD, fill: topFill });
  overlay(topD, rows[0]?.pattern, 'top');

  // Cut faces: strips from the center line out to the rim.
  const face = (t: number, r0: number, r1: number, a: number, b: number) => {
    const p0 = rim(t, r0, top + a), p1 = rim(t, r1, top + a), p2 = rim(t, r1, top + b), p3 = rim(t, r0, top + b);
    return path([p0, p1, p2, p3]);
  };
  for (const [t, dark] of [
    [tL, 0],
    [tR, 0.1],
  ] as [number, number][]) {
    const plane: IsoPlane = t === tL ? 'left' : 'right';
    rows.forEach((row, i) => {
      const full = frosted && i === 0; // top frosting runs to the rim
      const d = face(t, 0, full ? R : R - coat, row.a, row.b);
      shapes.push({ d, fill: row.fill, bandId: row.id });
      overlay(d, row.pattern, plane);
    });
    if (frosted) {
      const d = face(t, R - coat, R, rows[0].b, H);
      shapes.push({ d, fill: coatFill, bandId: rows[0].id });
      overlay(d, rows[0].pattern, plane);
    }
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

  return { width: Math.ceil(width), height: Math.ceil(Math.max(height, (labels.at(-1)?.at[1] ?? 0) + pad)), tilt: k, shapes, labels };
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Pattern tiles (white over the layer color), sheared per plane so they sit on the 3D faces. */
export function isoPatternDefs(prefix: string, tilt: number): string {
  const a = (Math.atan(tilt) * 180) / Math.PI;
  const planes: Record<IsoPlane, string> = {
    left: `skewY(${-a})`, right: `skewY(${a})`, side: '', top: `scale(1 ${tilt})`, front: '',
    sliceTop: 'matrix(1 0 0.87 -0.5 0 0)', sliceSide: 'matrix(0.87 -0.5 0 1 0 0)',
  };
  // Muted on purpose: patterns hint at texture, the layer colors carry the meaning.
  const tiles: Record<Exclude<IsoPattern, 'none'>, { w: number; h: number; body: string; rot?: number }> = {
    stripes: { w: 10, h: 10, body: '<rect width="4" height="10" fill="#fff" opacity=".2"/>' },
    chevron: { w: 12, h: 9, body: '<path d="M0,7 L6,2 L12,7" fill="none" stroke="#fff" stroke-width="1.8" opacity=".3"/>' },
    dots: { w: 10, h: 10, body: '<circle cx="2.5" cy="2.5" r="1.4" fill="#fff" opacity=".35"/><circle cx="7.5" cy="7.5" r="1.4" fill="#fff" opacity=".35"/>' },
  };
  let out = '';
  for (const [plane, tf] of Object.entries(planes)) {
    for (const [type, t] of Object.entries(tiles)) {
      const transform = [tf, t.rot ? `rotate(${t.rot})` : ''].filter(Boolean).join(' ');
      out += `<pattern id="${prefix}-${type}-${plane}" width="${t.w}" height="${t.h}" patternUnits="userSpaceOnUse"${transform ? ` patternTransform="${transform}"` : ''}>${t.body}</pattern>`;
    }
  }
  return out;
}

/** Inner SVG markup (defs, shapes, label-maker labels). One renderer for the app and the design system. */
export function isoCakeInner(cake: IsoCake, prefix = 'iso'): string {
  const shapes = cake.shapes
    .map((x) => {
      const fill = x.pattern ? `url(#${prefix}-${x.pattern.type}-${x.pattern.plane})` : x.fill;
      return `<path d="${x.d}" fill="${fill}"${x.opacity != null ? ` opacity="${x.opacity}"` : ''}${x.stroke ? ` stroke="${x.stroke}" stroke-width="${x.strokeWidth ?? 1}" stroke-linejoin="round"` : ''}/>`;
    })
    .join('');
  // Label tape: espresso strip, milk caps (Roboto Medium), a small tilt, dashed leader.
  const labels = cake.labels
    .map(({ text, anchor: [ax, ay], at: [x, y] }, i) => {
      const t = text.toUpperCase();
      const w = Math.round(t.length * 7.6 + 18);
      const tilt = i % 2 ? 0.8 : -1;
      return `<path d="M${P(ax)},${P(ay)} L${P(x - 20)},${P(y)} L${P(x - 4)},${P(y)}" fill="none" stroke="var(--espresso)" stroke-width="1" stroke-dasharray="3 3"/><circle cx="${P(ax)}" cy="${P(ay)}" r="3" fill="var(--paper)" stroke="var(--espresso)" stroke-width="1.2"/><g transform="rotate(${tilt} ${P(x)} ${P(y)})"><rect x="${P(x)}" y="${P(y - 9)}" width="${w}" height="18" rx="3" fill="var(--espresso)"/><rect x="${P(x)}" y="${P(y + 7)}" width="${w}" height="2" rx="1" fill="#000" opacity=".25"/><text x="${P(x + 8)}" y="${P(y + 3.5)}" font-family="var(--font-accent)" font-size="10" font-weight="500" letter-spacing="1.2" fill="var(--milk)">${esc(t)}</text></g>`;
    })
    .join('');
  return `<defs>${isoPatternDefs(prefix, cake.tilt)}</defs>${shapes}${labels}`;
}

/** Full SVG, for static previews. */
export function isoCakeSvg(cake: IsoCake, title = 'Cake cross-section', prefix = 'iso'): string {
  const extra = cake.labels.length ? 60 : 0; // room for label tape text
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cake.width + extra} ${cake.height}" width="${cake.width + extra}" height="${cake.height}" role="img" aria-label="${esc(title)}">${isoCakeInner(cake, prefix)}</svg>`;
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
  const overlay = (d: string, type: IsoPattern | undefined, plane: IsoPlane) => {
    if (type && type !== 'none') shapes.push({ d, fill: 'none', pattern: { type, plane } });
  };
  if (frosted) { shapes.push({ d: sideStrip(0, H), fill: rows[0].fill }); overlay(sideStrip(0, H), rows[0].pattern, 'sliceSide'); }
  else rows.forEach((r) => { shapes.push({ d: sideStrip(r.a, r.b), fill: r.fill }); overlay(sideStrip(r.a, r.b), r.pattern, 'sliceSide'); });
  shapes.push({ d: sideStrip(0, H), fill: 'var(--espresso)', opacity: 0.14 });
  // Top
  const sliceTop = path([[x0, top], [x0 + w, top], [x0 + w + dx, top - dy], [x0 + dx, top - dy]]);
  shapes.push({ d: sliceTop, fill: rows[0]?.fill ?? 'var(--cake-vanilla)' });
  overlay(sliceTop, rows[0]?.pattern, 'sliceTop');
  // Front face: layers, with the frosting coat at the outer (right) end.
  rows.forEach((r, i) => {
    const full = frosted && i === 0;
    const xr = full ? x0 + w : x0 + w - coat;
    const fd = path([[x0, top + r.a], [xr, top + r.a], [xr, top + r.b], [x0, top + r.b]]);
    shapes.push({ d: fd, fill: r.fill, bandId: r.id });
    overlay(fd, r.pattern, 'front');
    if (o.highlight === r.id) {
      const d = path([[x0, top + r.a], [xr, top + r.a], [xr, top + r.b], [x0, top + r.b]]);
      shapes.push({ d, fill: 'none', stroke: 'var(--paper)', strokeWidth: 6 });
      shapes.push({ d, fill: 'none', stroke: 'var(--ribbon)', strokeWidth: 2.5 });
    }
  });
  if (frosted) {
    const cd = path([[x0 + w - coat, top + rows[0].b], [x0 + w, top + rows[0].b], [x0 + w, top + H], [x0 + w - coat, top + H]]);
    shapes.push({ d: cd, fill: rows[0].fill });
    overlay(cd, rows[0].pattern, 'front');
  }
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
  return { width: Math.ceil(width), height: Math.ceil(height), tilt: 0.5, shapes, labels };
}
