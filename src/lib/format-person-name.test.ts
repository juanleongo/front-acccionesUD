import { expect, it } from 'vitest';
import { formatPersonName } from './format-person-name';

it('normaliza nombres y apellidos con iniciales en mayúscula y el resto en minúscula', () => {
  expect(formatPersonName('DANTE santos')).toBe('Dante Santos');
  expect(formatPersonName('  juan   JOSÉ   león  ')).toBe('Juan José León');
  expect(formatPersonName("maría-elena o'connor")).toBe("María-Elena O'Connor");
  expect(formatPersonName('   ')).toBe('');
});
