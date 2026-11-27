export type DrawingPoint = { index: number; price: number };
export type DrawingKind =
  'level' | 'trend' | 'measure' | 'rectangle' | 'polygon';
export type DrawingTool = 'cursor' | DrawingKind;
export const drawingColors = [
  'blue',
  'green',
  'amber',
  'violet',
  'red',
  'slate',
] as const;
export type DrawingStyle = {
  color: (typeof drawingColors)[number];
  width: number;
  dash: 'solid' | 'dashed' | 'dotted';
  opacity: number;
};
export const defaultStyle: DrawingStyle = {
  color: 'blue',
  width: 2,
  dash: 'solid',
  opacity: 0.14,
};
export type Drawing = {
  id: string;
  kind: DrawingKind;
  a: DrawingPoint;
  b: DrawingPoint;
  vertices?: DrawingPoint[];
  style: DrawingStyle;
  text: string;
};
export type Pixel = [number, number];
export type Plot = { left: number; top: number; right: number; bottom: number };
export const anchors = (drawing: Drawing): DrawingPoint[] =>
  drawing.kind === 'polygon'
    ? (drawing.vertices ?? [drawing.a, drawing.b])
    : drawing.kind === 'level'
      ? [drawing.a]
      : [drawing.a, drawing.b];
export function segmentDistance(p: Pixel, a: Pixel, b: Pixel) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
export function outline(
  d: Drawing,
  project: (p: DrawingPoint) => Pixel,
  plot: Plot,
): Pixel[] {
  const a = project(d.a),
    b = project(d.b);
  if (d.kind === 'level')
    return [
      [plot.left, a[1]],
      [plot.right, a[1]],
    ];
  if (d.kind === 'rectangle') return [a, [b[0], a[1]], b, [a[0], b[1]]];
  return anchors(d).map(project);
}
function inside(p: Pixel, polygon: Pixel[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
}
export function hitDrawing(
  drawings: Drawing[],
  selected: string | null,
  xy: Pixel,
  project: (p: DrawingPoint) => Pixel,
  plot: Plot,
  cycle = false,
) {
  const active = drawings.find((d) => d.id === selected);
  if (active && !cycle) {
    const handle = anchors(active).findIndex(
      (p) => Math.hypot(project(p)[0] - xy[0], project(p)[1] - xy[1]) <= 10,
    );
    if (handle >= 0) return { drawing: active, handle };
  }
  const edges: { drawing: Drawing; handle: number; distance: number }[] = [];
  const fills: { drawing: Drawing; handle: number; distance: number }[] = [];
  for (const drawing of [...drawings].reverse()) {
    const points = outline(drawing, project, plot);
    const closed = drawing.kind === 'rectangle' || drawing.kind === 'polygon';
    const distances = points
      .slice(1)
      .map((p, i) => segmentDistance(xy, points[i]!, p));
    if (closed) distances.push(segmentDistance(xy, points.at(-1)!, points[0]!));
    const distance = Math.min(...distances);
    if (distance <= Math.max(8, drawing.style.width / 2 + 5))
      edges.push({ drawing, handle: -1, distance });
    else if (closed && inside(xy, points))
      fills.push({ drawing, handle: -1, distance });
  }
  // A filled area must not hide a closer line or another area's border.
  // Reverse creation order breaks equal-distance ties; Alt+click can reach every hit.
  // Half-pixel buckets avoid unstable ties after data/pixel round trips.
  edges.sort((a, b) => Math.round(a.distance * 2) - Math.round(b.distance * 2));
  const hits = [...edges, ...fills];
  if (cycle && hits.length) {
    const index = hits.findIndex((hit) => hit.drawing.id === selected);
    return hits[(index + 1) % hits.length]!;
  }
  if (edges.length) {
    const closest = Math.round(edges[0]!.distance * 2);
    return (
      edges.find(
        (hit) =>
          hit.drawing.id === selected &&
          Math.round(hit.distance * 2) === closest,
      ) ?? edges[0]!
    );
  }
  // An explicitly selected area remains draggable through other overlapping fills.
  if (selected)
    return fills.find((hit) => hit.drawing.id === selected) ?? fills[0] ?? null;
  return hits[0] ?? null;
}
export function moveDrawing(
  drawing: Drawing,
  start: DrawingPoint,
  end: DrawingPoint,
  handle: number,
  length: number,
): Drawing {
  const original = anchors(drawing);
  const shift = Math.max(
    -Math.min(...original.map((p) => p.index)),
    Math.min(
      length - 1 - Math.max(...original.map((p) => p.index)),
      end.index - start.index,
    ),
  );
  const points = original.map((point, i) =>
    handle < 0
      ? {
          index: point.index + shift,
          price: point.price + end.price - start.price,
        }
      : i === handle
        ? end
        : point,
  );
  return {
    ...drawing,
    a: points[0]!,
    b: points[1] ?? points[0]!,
    ...(drawing.kind === 'polygon' ? { vertices: points } : {}),
  };
}
