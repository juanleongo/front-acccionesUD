'use client';
import type { EChartsType } from 'echarts/core';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
/** The canvas export must include the editable SVG annotations too. */
export async function downloadChart(
  chart: EChartsType,
  overlay: Element | null,
) {
  const base = await loadImage(
    chart.getDataURL({ type: 'png', pixelRatio: 2 }),
  );
  const canvas = document.createElement('canvas');
  canvas.width = base.width;
  canvas.height = base.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(base, 0, 0);
  if (overlay) {
    const clone = overlay.cloneNode(true) as SVGElement;
    const sources = [overlay, ...overlay.querySelectorAll('*')];
    const targets = [clone, ...clone.querySelectorAll('*')];
    sources.forEach((source, i) => {
      const computed = getComputedStyle(source),
        target = targets[i] as SVGElement;
      for (const prop of [
        'fill',
        'stroke',
        'stroke-width',
        'stroke-dasharray',
        'font-family',
        'font-size',
        'font-weight',
        'paint-order',
        'opacity',
      ])
        target.style.setProperty(prop, computed.getPropertyValue(prop));
    });
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], {
        type: 'image/svg+xml',
      }),
    );
    try {
      const image = await loadImage(url);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Export unavailable');
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.download = 'acciones-ud.png';
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
