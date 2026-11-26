'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { DrawingLayer } from './DrawingLayer';
import { DrawingEditor } from './DrawingEditor';
import { downloadChart } from './download-chart';
import { defaultStyle } from './drawing-model';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import type { Candle, CandleFrame } from '../history';
import { latestRange, normalizeBars, type ChartMode } from './chart-data';
import { useFinancialChart, type DrawingTool } from './use-financial-chart';
import type { Drawing, DrawingPoint, ViewRange } from './chart-options';
import type { Indicator } from './indicators';
import styles from '../price.module.css';
const emptyDrawings: Drawing[] = [];
export function FinancialChart({
  points,
  mode,
  timeframe,
  datasetKey,
  label,
  currency,
}: {
  points: Candle[];
  mode: ChartMode;
  timeframe: CandleFrame;
  datasetKey: string;
  label: string;
  currency: string | null;
}) {
  const { locale, tx } = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<ViewRange | null>(null);
  const [indicator, setIndicator] = useState<Indicator>('none');
  const [volume, setVolume] = useState(true);
  const [tool, setTool] = useState<DrawingTool>('cursor');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawingStyle, setDrawingStyle] = useState(defaultStyle);
  const [pendingPoint, setPendingPoint] = useState<DrawingPoint | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [actionError, setActionError] = useState('');
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const [analysis, setAnalysis] = useState<{
    key: string;
    items: Drawing[];
    past: Drawing[][];
    future: Drawing[][];
  }>({
    key: datasetKey,
    items: [],
    past: [],
    future: [],
  });
  const drawings = analysis.key === datasetKey ? analysis.items : emptyDrawings;
  const normalized = useMemo(() => {
    try {
      return { bars: normalizeBars(points, timeframe), error: false };
    } catch {
      return { bars: [], error: true };
    }
  }, [points, timeframe]);
  const { bars } = normalized;
  const commit = (items: Drawing[]) =>
    setAnalysis((previous) => ({
      key: datasetKey,
      items,
      past: [
        ...(previous.key === datasetKey ? previous.past : []),
        previous.key === datasetKey ? previous.items : [],
      ].slice(-50),
      future: [],
    }));
  const undo = () =>
    setAnalysis((previous) =>
      previous.key !== datasetKey || !previous.past.length
        ? previous
        : {
            ...previous,
            items: previous.past.at(-1)!,
            past: previous.past.slice(0, -1),
            future: [previous.items, ...previous.future],
          },
    );
  const redo = () =>
    setAnalysis((previous) =>
      previous.key !== datasetKey || !previous.future.length
        ? previous
        : {
            ...previous,
            items: previous.future[0]!,
            past: [...previous.past, previous.items],
            future: previous.future.slice(1),
          },
    );
  const selected = drawings.find((d) => d.id === selectedId);
  const update = (drawing: Drawing) => {
    setDrawingStyle(drawing.style);
    commit(drawings.map((d) => (d.id === drawing.id ? drawing : d)));
  };
  const remove = () => {
    if (selected) {
      commit(drawings.filter((d) => d.id !== selectedId));
      setSelectedId(null);
    }
  };
  const { chart, container, context, setWindow, status, frame } =
    useFinancialChart({
      bars,
      mode,
      locale,
      daily: timeframe === '1Day',
      datasetKey,
      indicator,
      volume,
      tool,
      drawings,
      selectedId,
      drawingStyle,
      onRange: setRange,
      onPending: setPendingPoint,
      onDraw: (drawing) => {
        commit([...drawings, drawing]);
        setSelectedId(drawing.id);
        setTool('cursor');
      },
      onUpdate: update,
      onSelect: setSelectedId,
      onDelete: remove,
      onUndo: undo,
      onRedo: redo,
    });
  const count = range
    ? Math.max(1, Math.round(range.to - range.from))
    : Math.min(60, bars.length);
  const first = range
    ? Math.max(0, Math.ceil(range.from))
    : Math.max(0, bars.length - 60);
  const last = range
    ? Math.min(bars.length - 1, Math.floor(range.to))
    : bars.length - 1;
  const presets = [10, 30, 60, 100, 120, 240];
  const windowAt = (from: number, size: number) => {
    const start = Math.max(
      -0.5,
      Math.min(Math.max(-0.5, bars.length - size - 0.5), from),
    );
    setWindow({ from: start, to: start + size });
  };
  const tools: {
    value: DrawingTool;
    es: string;
    en: string;
    icon: IconName;
  }[] = [
    { value: 'cursor', es: 'Cursor', en: 'Cursor', icon: 'cursor' },
    {
      value: 'level',
      es: 'Nivel horizontal',
      en: 'Horizontal level',
      icon: 'level',
    },
    {
      value: 'trend',
      es: 'Línea de tendencia',
      en: 'Trend line',
      icon: 'line',
    },
    {
      value: 'measure',
      es: 'Medir variación',
      en: 'Measure change',
      icon: 'ruler',
    },
    {
      value: 'rectangle',
      es: 'Área rectangular',
      en: 'Rectangle area',
      icon: 'rectangle',
    },
    {
      value: 'polygon',
      es: 'Área poligonal',
      en: 'Polygon area',
      icon: 'polygon',
    },
  ];
  return (
    <div
      ref={root}
      className={styles.financialChart}
      data-chart-mode={mode}
      data-drawing-count={drawings.length}
    >
      <div className={styles.analysisTools}>
        <div className={styles.indicatorSelect}>
          <label htmlFor="chart-indicator">
            {tx('Indicadores', 'Indicators')}
          </label>
          <CustomSelect
            id="chart-indicator"
            value={indicator}
            onChange={(value) => setIndicator(value as Indicator)}
            options={[
              { value: 'none', label: tx('Sin indicador', 'No indicator') },
              { value: 'sma', label: 'SMA · 20' },
              { value: 'ema', label: 'EMA · 20' },
              {
                value: 'bollinger',
                label: tx(
                  'Bandas de Bollinger · 20 / 2',
                  'Bollinger bands · 20 / 2',
                ),
              },
              { value: 'rsi', label: 'RSI · 14' },
              { value: 'macd', label: 'MACD · 12 / 26 / 9' },
            ]}
          />
        </div>
        <button
          className={styles.candleNavBtn}
          type="button"
          aria-pressed={volume}
          onClick={() => setVolume(!volume)}
        >
          {tx('Volumen', 'Volume')}
        </button>
        <button
          className={styles.candleNavBtn}
          type="button"
          disabled={status !== 'ready'}
          aria-pressed={fullscreen}
          onClick={async () => {
            setActionError('');
            try {
              if (document.fullscreenElement) await document.exitFullscreen();
              else if (root.current?.requestFullscreen)
                await root.current.requestFullscreen();
              else
                setActionError(
                  tx(
                    'Tu navegador no permite pantalla completa.',
                    'Your browser does not support fullscreen.',
                  ),
                );
            } catch {
              setActionError(
                tx(
                  'No se pudo abrir la pantalla completa.',
                  'Could not enter fullscreen.',
                ),
              );
            }
          }}
        >
          {fullscreen
            ? tx('Salir de pantalla completa', 'Exit fullscreen')
            : tx('Pantalla completa', 'Fullscreen')}
        </button>
        <button
          className={styles.candleNavBtn}
          type="button"
          disabled={status !== 'ready'}
          onClick={async () => {
            setActionError('');
            try {
              if (chart.current && root.current)
                await downloadChart(
                  chart.current,
                  root.current.querySelector('[data-drawing-layer]'),
                );
            } catch {
              setActionError(
                tx(
                  'No se pudo descargar el gráfico.',
                  'Could not download chart.',
                ),
              );
            }
          }}
        >
          {tx('Descargar gráfico', 'Download chart')}
        </button>
      </div>
      <div className={styles.chartTools}>
        {mode === 'candles' && (
          <>
            <div className={styles.candleControlGroup}>
              <label htmlFor="candle-visible-size">
                {tx('Velas visibles', 'Visible candles')}
              </label>
              <div className={styles.candleSelectWrap}>
                <CustomSelect
                  id="candle-visible-size"
                  compact
                  value={presets.includes(count) ? String(count) : 'custom'}
                  options={[
                    ...presets.map((value) => ({
                      value: String(value),
                      label: String(value),
                    })),
                    ...(!presets.includes(count)
                      ? [
                          {
                            value: 'custom',
                            label: `${tx('Zoom', 'Zoom')} (${count})`,
                          },
                        ]
                      : []),
                  ]}
                  onChange={(value) => {
                    if (value !== 'custom')
                      windowAt(
                        (range?.to ?? bars.length - 0.5) - Number(value),
                        Number(value),
                      );
                  }}
                />
              </div>
            </div>
            <button
              className={styles.candleNavBtn}
              type="button"
              disabled={first <= 0}
              onClick={() => windowAt((range?.from ?? 0) - count, count)}
            >
              {tx('← Velas anteriores', '← Earlier candles')}
            </button>
            <button
              className={styles.candleNavBtn}
              type="button"
              disabled={last >= bars.length - 1}
              onClick={() => windowAt((range?.from ?? 0) + count, count)}
            >
              {tx('Velas siguientes →', 'Next candles →')}
            </button>
          </>
        )}
        <button
          className={styles.candleNavBtn}
          type="button"
          onClick={() => setWindow({ from: -0.5, to: bars.length - 0.5 })}
        >
          {tx('Ajustar al contenido', 'Fit content')}
        </button>
        <button
          className={styles.candleNavBtn}
          type="button"
          onClick={() => setWindow(latestRange(bars.length, count))}
        >
          {tx('Más recientes', 'Latest')}
        </button>
        <button
          className={styles.candleNavBtn}
          type="button"
          onClick={() => setWindow(latestRange(bars.length, 60))}
        >
          {tx('Restablecer vista', 'Reset view')}
        </button>
      </div>
      <div
        className={styles.chartReadout}
        aria-label={tx('Lectura del gráfico', 'Chart readout')}
      >
        <span className={styles.chartReadoutLabel}>
          {tx('Histórico', 'Historical')} · {currency} · ET
        </span>
        <div ref={context} role="status" aria-live="off" />
      </div>
      {normalized.error && (
        <p className={styles.plotAlert} role="alert">
          {tx(
            'El histórico contiene datos inválidos o contradictorios. No se puede representar con precisión.',
            'The history contains invalid or conflicting data and cannot be plotted accurately.',
          )}
        </p>
      )}
      {status === 'error' && (
        <p className={styles.plotAlert} role="alert">
          {tx(
            'No se pudo cargar el motor del gráfico. Recarga la página para reintentar.',
            'Could not load the chart engine. Reload the page to retry.',
          )}
        </p>
      )}
      {actionError && (
        <p className={styles.plotAlert} role="alert">
          {actionError}
        </p>
      )}
      <div className={styles.toolStatus} role="status" aria-live="polite">
        <strong>
          {tx(
            tools.find((item) => item.value === tool)!.es,
            tools.find((item) => item.value === tool)!.en,
          )}
        </strong>
        <span>
          {status === 'loading'
            ? tx('Preparando gráfico…', 'Preparing chart…')
            : tool === 'cursor'
              ? tx(
                  'Selecciona un dibujo para editarlo. Arrastra sus puntos o el dibujo completo. Rueda: zoom.',
                  'Select a drawing to edit it. Drag its handles or the whole drawing. Wheel: zoom.',
                )
              : tool === 'polygon'
                ? tx(
                    'Marca al menos tres vértices. Enter o pulsa el primer punto para cerrar; Esc cancela.',
                    'Mark at least three vertices. Enter or click the first point to close; Esc cancels.',
                  )
                : tool === 'level'
                  ? tx(
                      'Pulsa sobre el precio que quieres marcar.',
                      'Click the price you want to mark.',
                    )
                  : pendingPoint
                    ? tx(
                        'Primer punto marcado. Selecciona el segundo punto; Esc cancela.',
                        'First point marked. Select the second point; Esc cancels.',
                      )
                    : tx(
                        'Marca dos puntos o arrastra desde el inicio hasta el final.',
                        'Mark two points or drag from start to end.',
                      )}
        </span>
        <span>
          {tx('Dibujos', 'Drawings')}: {drawings.length}
        </span>
      </div>
      {indicator !== 'none' &&
        bars.length <
          { sma: 20, ema: 20, bollinger: 20, rsi: 15, macd: 34 }[indicator] && (
          <p className={styles.analysisNote} role="status">
            {tx(
              'Amplía el período: faltan barras para calcular este indicador.',
              'Select a longer period: more bars are needed for this indicator.',
            )}{' '}
            ({bars.length} /{' '}
            {{ sma: 20, ema: 20, bollinger: 20, rsi: 15, macd: 34 }[indicator]})
          </p>
        )}
      <div className={styles.chartWorkspace}>
        <div
          className={styles.drawingTools}
          role="group"
          aria-label={tx('Herramientas de dibujo', 'Drawing tools')}
        >
          {tools.map((item) => (
            <button
              key={item.value}
              type="button"
              title={tx(item.es, item.en)}
              aria-label={tx(item.es, item.en)}
              aria-pressed={tool === item.value}
              disabled={status !== 'ready'}
              onClick={() => {
                setPendingPoint(null);
                setSelectedId(null);
                setTool(tool === item.value ? 'cursor' : item.value);
              }}
            >
              <Icon name={item.icon} size={19} />
            </button>
          ))}
          <button
            type="button"
            disabled={analysis.key !== datasetKey || !analysis.past.length}
            title={tx('Deshacer dibujo', 'Undo drawing')}
            aria-label={tx('Deshacer dibujo', 'Undo drawing')}
            onClick={undo}
          >
            <Icon name="undo" size={18} />
          </button>
          <button
            type="button"
            disabled={analysis.key !== datasetKey || !analysis.future.length}
            title={tx('Rehacer dibujo', 'Redo drawing')}
            aria-label={tx('Rehacer dibujo', 'Redo drawing')}
            onClick={redo}
          >
            <Icon name="redo" size={18} />
          </button>
          <button
            type="button"
            disabled={!drawings.length}
            title={tx('Borrar dibujos', 'Clear drawings')}
            aria-label={tx('Borrar dibujos', 'Clear drawings')}
            onClick={() => {
              commit([]);
              setSelectedId(null);
            }}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
        <div className={styles.chartStage}>
          {selected && (
            <DrawingEditor
              drawing={selected}
              onChange={update}
              onDelete={remove}
              onClose={() => setSelectedId(null)}
            />
          )}
          <div className={styles.plotSurface}>
            <div
              ref={container}
              tabIndex={0}
              className={styles.chartCanvas}
              data-tool={tool}
              role="img"
              aria-label={label}
            />
            <DrawingLayer
              frame={frame}
              selectedId={selectedId}
              bars={bars}
              locale={locale}
              daily={timeframe === '1Day'}
            />
          </div>
        </div>
      </div>
      <div className={styles.chartHelp}>
        <span>
          {tx('Mostrando', 'Showing')}{' '}
          {Math.max(0, Math.min(bars.length, first + 1))}–
          {Math.max(0, last + 1)} {tx('de', 'of')} {bars.length} ·{' '}
          {tx(
            'Rueda: zoom · Arrastrar: desplazar · Flechas: explorar',
            'Scroll: zoom · Drag: pan · Arrows: inspect',
          )}
        </span>
        <span>Apache ECharts</span>
      </div>
      <p className={styles.analysisNote}>
        {tool === 'trend' || tool === 'measure'
          ? tx(
              'Selecciona dos puntos dentro del gráfico. Esc cancela el primer punto.',
              'Select two points inside the chart. Esc cancels the first point.',
            )
          : tool === 'level'
            ? tx(
                'Pulsa en el gráfico para marcar un nivel de precio.',
                'Click the chart to mark a price level.',
              )
            : tx(
                'Supr: eliminar selección · Ctrl+Z: deshacer · Ctrl+Mayús+Z: rehacer. Los dibujos se reinician al cambiar de instrumento o período.',
                'Delete: remove selection · Ctrl+Z: undo · Ctrl+Shift+Z: redo. Drawings reset when the instrument or period changes.',
              )}
        {indicator !== 'none' &&
          ` · ${tx('Los indicadores necesitan suficiente histórico previo.', 'Indicators require enough prior history.')}`}
      </p>
    </div>
  );
}
