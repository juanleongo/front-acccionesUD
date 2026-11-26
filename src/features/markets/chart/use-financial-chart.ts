'use client';
import { useEffect, useRef, useState } from 'react';
import type { EChartsType } from 'echarts/core';
import { financialOption, type ViewRange } from './chart-options';
import {
  formatChartTime,
  latestRange,
  type ChartBar,
  type ChartMode,
} from './chart-data';
import {
  anchors,
  hitDrawing,
  moveDrawing,
  outline,
  type Drawing,
  type DrawingPoint,
  type DrawingStyle,
  type DrawingTool,
  type Pixel,
  type Plot,
} from './drawing-model';
import type { Indicator } from './indicators';
export type { DrawingTool } from './drawing-model';
export type DrawingFrame = {
  width: number;
  height: number;
  plot: Plot;
  shapes: { drawing: Drawing; points: Pixel[]; handles: Pixel[] }[];
  draft: { drawing: Drawing; points: Pixel[]; handles: Pixel[] } | null;
};
export function useFinancialChart(props: {
  bars: ChartBar[];
  mode: ChartMode;
  locale: string;
  daily: boolean;
  datasetKey: string;
  indicator: Indicator;
  volume: boolean;
  drawings: Drawing[];
  tool: DrawingTool;
  selectedId: string | null;
  drawingStyle: DrawingStyle;
  onRange: (range: ViewRange) => void;
  onDraw: (drawing: Drawing) => void;
  onUpdate: (drawing: Drawing) => void;
  onSelect: (id: string | null) => void;
  onDelete: () => void;
  onPending: (point: DrawingPoint | null) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const { bars, mode, locale, daily, datasetKey, indicator, volume } = props;
  const container = useRef<HTMLDivElement>(null),
    context = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [frame, setFrame] = useState<DrawingFrame | null>(null);
  const current = useRef(props);
  const refresh = useRef<(() => void) | null>(null);
  const viewport = useRef<ViewRange>(latestRange(bars.length, 60));
  const key = useRef('');
  useEffect(() => {
    current.current = props;
  });
  useEffect(() => {
    refresh.current?.();
  }, [props.drawings, props.selectedId, props.tool, props.drawingStyle]);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let canceled = false,
      cleanup = () => {};
    void import('./echarts-engine')
      .then(({ init }) => {
        if (canceled) return;
        const instance =
          chart.current ?? init(host, undefined, { renderer: 'canvas' });
        chart.current = instance;
        if (key.current !== datasetKey) {
          key.current = datasetKey;
          viewport.current = latestRange(bars.length, 60);
        }
        current.current.onPending(null);
        let draft: Drawing | null = null,
          vertices: DrawingPoint[] = [],
          animation = 0;
        let press: {
          point: DrawingPoint;
          xy: Pixel;
          moved: boolean;
          original?: Drawing;
          handle: number;
        } | null = null;
        const apply = () =>
          instance.setOption(
            financialOption(
              host,
              bars,
              mode,
              locale,
              daily,
              indicator,
              volume,
              viewport.current,
            ),
            { notMerge: true, lazyUpdate: false },
          );
        const project = (p: DrawingPoint) =>
          instance.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            p.index,
            p.price,
          ]) as Pixel;
        const plot = (): Plot => {
          const height = instance.getHeight(),
            lower = indicator === 'rsi' || indicator === 'macd';
          return {
            left: 12,
            top: 20,
            right: instance.getWidth() - 85,
            bottom: height * (1 - (lower ? 0.46 : volume ? 0.33 : 0.15)),
          };
        };
        let transient: Drawing | null = null;
        const redraw = () => {
          cancelAnimationFrame(animation);
          animation = requestAnimationFrame(() => {
            if (canceled || instance.isDisposed()) return;
            const bounds = plot();
            const shape = (drawing: Drawing) => ({
              drawing,
              points: outline(drawing, project, bounds),
              handles: anchors(drawing).map(project),
            });
            const p = current.current;
            setFrame({
              width: instance.getWidth(),
              height: instance.getHeight(),
              plot: bounds,
              shapes: p.drawings.map((d) =>
                shape(transient?.id === d.id ? transient : d),
              ),
              draft: draft ? shape(draft) : null,
            });
          });
        };
        refresh.current = redraw;
        apply();
        setStatus('ready');
        current.current.onRange(viewport.current);
        redraw();
        const numeric = new Intl.NumberFormat(
          locale === 'en' ? 'en-US' : 'es-CO',
          { maximumFractionDigits: 8 },
        );
        const show = (index: number) => {
          const bar = bars[index],
            target = context.current;
          if (!bar || !target) return;
          target.textContent = `${formatChartTime(bar.time, locale, !daily)}${daily ? '' : ' ET'} · ${locale === 'en' ? 'Open' : 'Apertura'} ${numeric.format(bar.open)} · ${locale === 'en' ? 'High' : 'Máximo'} ${numeric.format(bar.high)} · ${locale === 'en' ? 'Low' : 'Mínimo'} ${numeric.format(bar.low)} · ${locale === 'en' ? 'Close' : 'Cierre'} ${numeric.format(bar.close)}${bar.volume === undefined ? '' : ` · Vol. ${numeric.format(bar.volume)}`}`;
        };
        show(bars.length - 1);
        const zoom = () => {
          const dz = (
            instance.getOption().dataZoom as
              { start?: number; end?: number }[] | undefined
          )?.[0];
          if (!dz) return;
          viewport.current = {
            from:
              Math.round(
                ((dz.start ?? 0) / 100) * Math.max(0, bars.length - 1),
              ) - 0.5,
            to:
              Math.round(
                ((dz.end ?? 100) / 100) * Math.max(0, bars.length - 1),
              ) + 0.5,
          };
          current.current.onRange(viewport.current);
          redraw();
        };
        const pointer = (event: unknown) => {
          const info = (
            event as {
              axesInfo?: {
                axisDim?: string;
                axisIndex?: number;
                value?: number | string;
              }[];
            }
          ).axesInfo;
          const value = info?.find(
            (axis) => axis.axisDim === 'x' && axis.axisIndex === 0,
          )?.value;
          if (value !== undefined) show(Number(value));
        };
        const xy = (event: PointerEvent): Pixel => {
          const box = host.getBoundingClientRect();
          return [event.clientX - box.left, event.clientY - box.top];
        };
        const eventPoint = (
          event: PointerEvent,
          clamp = false,
        ): DrawingPoint | null => {
          const pixel = xy(event),
            bounds = plot();
          if (!clamp && !instance.containPixel({ gridIndex: 0 }, pixel))
            return null;
          if (clamp) {
            pixel[0] = Math.max(bounds.left, Math.min(bounds.right, pixel[0]));
            pixel[1] = Math.max(bounds.top, Math.min(bounds.bottom, pixel[1]));
          }
          const value = instance.convertFromPixel(
            { xAxisIndex: 0, yAxisIndex: 0 },
            pixel,
          ) as number[];
          const index = Math.max(
              0,
              Math.min(bars.length - 1, Math.round(value[0]!)),
            ),
            price = value[1]!;
          return bars[index] && Number.isFinite(price)
            ? { index, price }
            : null;
        };
        const stop = (event: PointerEvent) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        };
        const reset = () => {
          press = null;
          draft = null;
          vertices = [];
          transient = null;
          current.current.onPending(null);
          redraw();
        };
        let activeTool = current.current.tool;
        const syncTool = () => {
          if (activeTool !== current.current.tool) {
            activeTool = current.current.tool;
            reset();
          }
        };
        refresh.current = () => {
          syncTool();
          redraw();
        };
        const make = (points: DrawingPoint[]): Drawing => ({
          id: crypto.randomUUID(),
          kind:
            current.current.tool === 'cursor' ? 'trend' : current.current.tool,
          a: points[0]!,
          b: points.at(-1)!,
          ...(current.current.tool === 'polygon' ? { vertices: points } : {}),
          style: { ...current.current.drawingStyle },
          text: '',
        });
        const finish = (drawing: Drawing) => {
          reset();
          current.current.onDraw(drawing);
        };
        const down = (event: PointerEvent) => {
          if (event.button !== 0) return;
          syncTool();
          host.focus({ preventScroll: true });
          const point = eventPoint(event);
          if (!point) return;
          const p = current.current,
            hit =
              p.tool === 'cursor'
                ? hitDrawing(
                    p.drawings,
                    p.selectedId,
                    xy(event),
                    project,
                    plot(),
                  )
                : null;
          if (p.tool === 'cursor' && !hit) {
            p.onSelect(null);
            return;
          }
          stop(event);
          if (hit) p.onSelect(hit.drawing.id);
          press = {
            point,
            xy: xy(event),
            moved: false,
            handle: hit?.handle ?? -1,
            ...(hit ? { original: hit.drawing } : {}),
          };
          host.setPointerCapture?.(event.pointerId);
        };
        const move = (event: PointerEvent) => {
          syncTool();
          const point = eventPoint(event, Boolean(press));
          if (!point) return;
          if (
            press &&
            Math.hypot(xy(event)[0] - press.xy[0], xy(event)[1] - press.xy[1]) >
              4
          )
            press.moved = true;
          if (press?.original) {
            stop(event);
            transient = moveDrawing(
              press.original,
              press.point,
              point,
              press.handle,
              bars.length,
            );
            redraw();
            return;
          }
          const tool = current.current.tool;
          if (tool !== 'cursor' && tool !== 'level') {
            const start = vertices.length
              ? vertices
              : press?.moved
                ? [press.point]
                : [];
            if (start.length) {
              draft = make([...start, point]);
              redraw();
            }
          }
          if (tool === 'cursor' && !press)
            host.style.cursor = hitDrawing(
              current.current.drawings,
              current.current.selectedId,
              xy(event),
              project,
              plot(),
            )
              ? 'move'
              : '';
        };
        const up = (event: PointerEvent) => {
          if (!press) return;
          const point = eventPoint(event, true),
            gesture = press;
          press = null;
          if (host.hasPointerCapture?.(event.pointerId))
            host.releasePointerCapture(event.pointerId);
          stop(event);
          if (!point) return;
          if (gesture.original) {
            if (gesture.moved && transient) current.current.onUpdate(transient);
            transient = null;
            redraw();
            return;
          }
          const tool = current.current.tool;
          if (tool === 'level') finish(make([point]));
          else if (tool === 'polygon') {
            // Three or more clicks; close at the first vertex or press Enter.
            const first = vertices[0];
            if (
              vertices.length >= 3 &&
              first &&
              Math.hypot(
                project(first)[0] - xy(event)[0],
                project(first)[1] - xy(event)[1],
              ) < 12
            )
              finish(make(vertices));
            else {
              vertices.push(point);
              draft = make(vertices);
              current.current.onPending(vertices[0]!);
              redraw();
            }
          } else if (vertices.length || gesture.moved)
            finish(make([vertices[0] ?? gesture.point, point]));
          else {
            vertices = [point];
            draft = make(vertices);
            current.current.onPending(point);
            redraw();
          }
        };
        let cursor = bars.length - 1;
        const keyboard = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            reset();
            current.current.onSelect(null);
            return;
          }
          if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'z'
          ) {
            event.preventDefault();
            if (event.shiftKey) current.current.onRedo();
            else current.current.onUndo();
            return;
          }
          if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            current.current.onDelete();
            return;
          }
          if (
            event.key === 'Enter' &&
            current.current.tool === 'polygon' &&
            vertices.length >= 3
          ) {
            event.preventDefault();
            finish(make(vertices));
            return;
          }
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          cursor = Math.min(
            bars.length - 1,
            Math.max(0, cursor + (event.key === 'ArrowLeft' ? -1 : 1)),
          );
          show(cursor);
          if (cursor < viewport.current.from || cursor > viewport.current.to) {
            const size = Math.min(
              bars.length,
              Math.max(
                1,
                Math.round(viewport.current.to - viewport.current.from),
              ),
            );
            const first = Math.max(
              0,
              Math.min(bars.length - size, cursor - Math.floor(size / 2)),
            );
            viewport.current = { from: first - 0.5, to: first + size - 0.5 };
            current.current.onRange(viewport.current);
            instance.dispatchAction({
              type: 'dataZoom',
              startValue: first,
              endValue: first + size - 1,
            });
          }
          instance.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: cursor,
          });
        };
        const theme = new MutationObserver(() => {
          apply();
          redraw();
        });
        theme.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme'],
        });
        const resize = new ResizeObserver(() => {
          instance.resize();
          redraw();
        });
        resize.observe(host);
        instance.on('datazoom', zoom);
        instance.on('updateAxisPointer', pointer);
        instance.on('finished', redraw);
        host.addEventListener('pointerdown', down, true);
        host.addEventListener('pointermove', move, true);
        host.addEventListener('pointerup', up, true);
        host.addEventListener('pointercancel', reset);
        host.addEventListener('keydown', keyboard);
        cleanup = () => {
          theme.disconnect();
          resize.disconnect();
          cancelAnimationFrame(animation);
          refresh.current = null;
          instance.off('datazoom', zoom);
          instance.off('updateAxisPointer', pointer);
          instance.off('finished', redraw);
          host.removeEventListener('pointerdown', down, true);
          host.removeEventListener('pointermove', move, true);
          host.removeEventListener('pointerup', up, true);
          host.removeEventListener('pointercancel', reset);
          host.removeEventListener('keydown', keyboard);
        };
      })
      .catch(() => {
        if (!canceled) setStatus('error');
      });
    return () => {
      canceled = true;
      cleanup();
    };
  }, [bars, mode, locale, daily, datasetKey, indicator, volume]);
  useEffect(
    () => () => {
      chart.current?.dispose();
      chart.current = null;
    },
    [],
  );
  const setWindow = (range: ViewRange) => {
    viewport.current = range;
    current.current.onRange(range);
    chart.current?.dispatchAction({
      type: 'dataZoom',
      startValue: Math.max(0, Math.ceil(range.from)),
      endValue: Math.min(bars.length - 1, Math.floor(range.to)),
    });
  };
  return { chart, container, context, setWindow, status, frame };
}
