'use client';
import type { CSSProperties } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import {
  drawingColors,
  type Drawing,
  type DrawingStyle,
} from './drawing-model';
import styles from './drawings.module.css';

export function DrawingEditor({
  drawing,
  onChange,
  onDelete,
  onClose,
}: {
  drawing: Drawing;
  onChange: (drawing: Drawing) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { tx } = useLocale();
  const changeStyle = (style: Partial<DrawingStyle>) =>
    onChange({ ...drawing, style: { ...drawing.style, ...style } });
  const colors = [
    tx('Azul', 'Blue'),
    tx('Verde', 'Green'),
    tx('Ámbar', 'Amber'),
    tx('Violeta', 'Violet'),
    tx('Rojo', 'Red'),
    tx('Gris', 'Slate'),
  ];
  return (
    <div
      className={styles.editor}
      role="group"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
      aria-label={tx('Editar dibujo seleccionado', 'Edit selected drawing')}
    >
      <div
        className={styles.swatches}
        role="group"
        aria-label={tx('Color del dibujo', 'Drawing color')}
      >
        {drawingColors.map((color, i) => (
          <button
            key={color}
            type="button"
            title={colors[i]}
            aria-label={colors[i]}
            aria-pressed={drawing.style.color === color}
            onClick={() => changeStyle({ color })}
            style={
              {
                '--drawing-color': `var(--color-drawing-${color})`,
              } as CSSProperties
            }
          >
            <span />
          </button>
        ))}
      </div>
      <div className={styles.styleSelect}>
        <label htmlFor="drawing-width">{tx('Grosor', 'Width')}</label>
        <CustomSelect
          id="drawing-width"
          compact
          value={String(drawing.style.width)}
          options={[1, 2, 3, 4, 6].map((v) => ({
            value: String(v),
            label: `${v} px`,
          }))}
          onChange={(v) => changeStyle({ width: Number(v) })}
        />
      </div>
      <div className={styles.styleSelect}>
        <label htmlFor="drawing-dash">{tx('Trazo', 'Stroke')}</label>
        <CustomSelect
          id="drawing-dash"
          compact
          value={drawing.style.dash}
          options={[
            { value: 'solid', label: tx('Continuo', 'Solid') },
            { value: 'dashed', label: tx('Guiones', 'Dashed') },
            { value: 'dotted', label: tx('Puntos', 'Dotted') },
          ]}
          onChange={(v) => changeStyle({ dash: v as DrawingStyle['dash'] })}
        />
      </div>
      {(drawing.kind === 'polygon' || drawing.kind === 'rectangle') && (
        <div className={styles.styleSelect}>
          <label htmlFor="drawing-opacity">{tx('Relleno', 'Fill')}</label>
          <CustomSelect
            id="drawing-opacity"
            compact
            value={String(drawing.style.opacity)}
            options={[0.08, 0.14, 0.25, 0.4].map((v) => ({
              value: String(v),
              label: `${Math.round(v * 100)}%`,
            }))}
            onChange={(v) => changeStyle({ opacity: Number(v) })}
          />
        </div>
      )}
      <input
        className={styles.textInput}
        aria-label={tx('Texto del dibujo', 'Drawing text')}
        placeholder={tx('Añadir texto…', 'Add text…')}
        value={drawing.text}
        maxLength={80}
        onChange={(e) => onChange({ ...drawing, text: e.target.value })}
      />
      <button
        className={styles.action}
        type="button"
        title={tx('Eliminar dibujo seleccionado', 'Delete selected drawing')}
        aria-label={tx(
          'Eliminar dibujo seleccionado',
          'Delete selected drawing',
        )}
        onClick={onDelete}
      >
        <Icon name="trash" size={18} />
      </button>
      <button
        className={styles.action}
        type="button"
        title={tx('Deseleccionar dibujo', 'Deselect drawing')}
        aria-label={tx('Deseleccionar dibujo', 'Deselect drawing')}
        onClick={onClose}
      >
        <Icon name="close" size={17} />
      </button>
    </div>
  );
}
