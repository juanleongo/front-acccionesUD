import { describe, expect, it } from 'vitest';
import {
  formatDecimalNumber,
  formatMarketDateTime,
  formatPercent,
  formatUsd,
} from './formatters';

describe('shared formatters', () => {
  it('formats positive, negative and invalid USD amounts consistently', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
    expect(formatUsd('9812', { withCode: true })).toBe('$9,812.00 USD');
    expect(formatUsd(-42.1, { withCode: true })).toBe('-$42.10 USD');
    expect(formatUsd('not-a-number')).toBe('$0.00');
  });

  it('formats signed percentages and decimal numbers per locale', () => {
    expect(formatPercent(0.0179, 'en')).toMatch(/^\+1\.79\s?%$/);
    expect(formatPercent(-0.025, 'es')).toMatch(/^-2,50\s?%$/);
    expect(formatDecimalNumber('1234.5678', 'en', 4)).toBe('1,234.5678');
    expect(formatDecimalNumber('invalid', 'es')).toBe('—');
  });

  it('formats valid ISO instants in explicit time zones and guards invalid dates', () => {
    const formatted = formatMarketDateTime('2026-01-12T14:30:00Z', 'en', {
      includeTime: false,
      timeZone: 'America/New_York',
    });
    expect(formatted).toBe('01/12/2026');
    expect(formatMarketDateTime('not-a-date', 'es')).toBe('—');
  });
});
