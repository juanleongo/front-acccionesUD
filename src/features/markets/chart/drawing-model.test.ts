import { describe, expect, it } from 'vitest';
import {
  defaultStyle,
  hitDrawing,
  moveDrawing,
  type Drawing,
  type DrawingPoint,
  type Pixel,
} from './drawing-model';
const project = (p: DrawingPoint): Pixel => [p.index * 10, p.price * 10];
const plot = { left: 0, top: 0, right: 200, bottom: 200 };
const line: Drawing = {
  id: 'line',
  kind: 'trend',
  a: { index: 2, price: 3 },
  b: { index: 8, price: 6 },
  style: defaultStyle,
  text: '',
};
describe('editable drawing geometry', () => {
  it('selects segments, prioritizes selected handles and ignores distant empty space', () => {
    expect(hitDrawing([line], null, [50, 45], project, plot)).toMatchObject({
      drawing: line,
      handle: -1,
    });
    expect(hitDrawing([line], line.id, [22, 31], project, plot)).toMatchObject({
      handle: 0,
    });
    expect(hitDrawing([line], null, [150, 100], project, plot)).toBeNull();
  });
  it('moves a complete drawing without changing its geometry or leaving the available history', () => {
    const moved = moveDrawing(
      line,
      { index: 2, price: 3 },
      { index: 9, price: 4 },
      -1,
      10,
    );
    expect(moved.a).toEqual({ index: 3, price: 4 });
    expect(moved.b).toEqual({ index: 9, price: 7 });
    expect(moveDrawing(line, line.a, { index: 4, price: 8 }, 0, 10).b).toEqual(
      line.b,
    );
  });
  it('selects the inside of shaded rectangles and polygons and edits one polygon vertex', () => {
    const rectangle = { ...line, kind: 'rectangle' as const };
    expect(
      hitDrawing([rectangle], null, [50, 45], project, plot)?.drawing.kind,
    ).toBe('rectangle');
    const polygon: Drawing = {
      ...line,
      kind: 'polygon',
      vertices: [line.a, { index: 5, price: 9 }, line.b],
    };
    expect(
      hitDrawing([polygon], null, [50, 60], project, plot)?.drawing.kind,
    ).toBe('polygon');
    const moved = moveDrawing(
      polygon,
      { index: 5, price: 9 },
      { index: 6, price: 10 },
      1,
      20,
    );
    expect(moved.vertices).toEqual([line.a, { index: 6, price: 10 }, line.b]);
  });
});
