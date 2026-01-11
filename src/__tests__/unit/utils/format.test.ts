/**
 * Format Utility Tests
 *
 * Tests for formatting functions used across the UI.
 */

import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatNumber,
} from '../../../lib/utils/format';

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle small decimals', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('should round to two decimal places', () => {
      expect(formatCurrency(1.999)).toBe('$2.00');
    });

    it('should support different currencies', () => {
      const result = formatCurrency(100, 'EUR');
      expect(result).toContain('100');
      // Note: The exact format depends on locale settings
    });
  });

  describe('formatPercent', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercent(0.05)).toBe('5.0%');
    });

    it('should format zero correctly', () => {
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('should format 100% correctly', () => {
      expect(formatPercent(1)).toBe('100.0%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercent(-0.03)).toBe('-3.0%');
    });

    it('should show sign when requested', () => {
      expect(formatPercent(0.05, true)).toBe('+5.0%');
    });

    it('should show negative sign even when showSign is true', () => {
      expect(formatPercent(-0.05, true)).toBe('-5.0%');
    });

    it('should handle small percentages', () => {
      expect(formatPercent(0.001)).toBe('0.1%');
    });
  });

  describe('formatDate', () => {
    it('should format date string in medium format by default', () => {
      const result = formatDate('2026-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('should format Date object', () => {
      const date = new Date('2026-01-15');
      const result = formatDate(date);
      expect(result).toContain('15');
    });

    it('should support short format', () => {
      const result = formatDate('2026-01-15', 'short');
      // Short format: 1/15/26 or similar
      expect(result).toContain('1');
      expect(result).toContain('15');
    });

    it('should support full format', () => {
      const result = formatDate('2026-01-15', 'full');
      // Full format includes day of week
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('formatNumber', () => {
    it('should format with thousand separators', () => {
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    });

    it('should respect decimal places parameter', () => {
      expect(formatNumber(1234.5678, 0)).toBe('1,235');
      expect(formatNumber(1234.5678, 1)).toBe('1,234.6');
      expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.56)).toBe('-1,234.56');
    });
  });
});
