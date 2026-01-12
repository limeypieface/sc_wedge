/**
 * UI Formatters
 *
 * Type-safe formatting functions for displaying domain values.
 * Integrates with kernel types (Money, Quantity, Timestamp, Percentage).
 */

import type { Money, Quantity, Timestamp, Percentage, CurrencyCode } from '../../engines/_kernel';
import { moneyToDecimal, percentageToDecimal, CURRENCY_PRECISION } from '../../engines/_kernel';

// ============================================================================
// Currency Symbols & Locale Config
// ============================================================================

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
};

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CAD: 'en-CA',
  AUD: 'en-AU',
  CHF: 'de-CH',
};

// ============================================================================
// Money Formatting
// ============================================================================

export interface FormatMoneyOptions {
  /** Show currency symbol (default: true) */
  showSymbol?: boolean;
  /** Show currency code after amount (default: false) */
  showCode?: boolean;
  /** Use compact notation for large amounts (default: false) */
  compact?: boolean;
  /** Show sign for positive values (default: false) */
  showPositiveSign?: boolean;
  /** Custom locale override */
  locale?: string;
}

/**
 * Format a Money value for display.
 *
 * @example
 * formatMoney(money(1234.56, 'USD'))           // "$1,234.56"
 * formatMoney(money(1234.56, 'USD'), { showCode: true }) // "$1,234.56 USD"
 * formatMoney(money(1500000, 'USD'), { compact: true })  // "$1.5M"
 */
export function formatMoney(m: Money, options: FormatMoneyOptions = {}): string {
  const {
    showSymbol = true,
    showCode = false,
    compact = false,
    showPositiveSign = false,
    locale,
  } = options;

  const decimal = moneyToDecimal(m);
  const precision = CURRENCY_PRECISION[m.currency];
  const effectiveLocale = locale ?? CURRENCY_LOCALE[m.currency] ?? 'en-US';

  const formatter = new Intl.NumberFormat(effectiveLocale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? m.currency : undefined,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: compact ? 0 : precision,
    maximumFractionDigits: compact ? 1 : precision,
    signDisplay: showPositiveSign ? 'exceptZero' : 'auto',
  });

  let result = formatter.format(decimal);

  if (showCode && !showSymbol) {
    result = `${result} ${m.currency}`;
  } else if (showCode && showSymbol) {
    result = `${result} ${m.currency}`;
  }

  return result;
}

/**
 * Format money as a simple number string (no symbol).
 * Useful for inputs and calculations display.
 */
export function formatMoneyValue(m: Money): string {
  return formatMoney(m, { showSymbol: false });
}

/**
 * Format money in compact form for dashboards/cards.
 */
export function formatMoneyCompact(m: Money): string {
  return formatMoney(m, { compact: true });
}

// ============================================================================
// Quantity Formatting
// ============================================================================

const UOM_LABELS: Record<string, { singular: string; plural: string; abbrev: string }> = {
  EA: { singular: 'each', plural: 'each', abbrev: 'ea' },
  PCS: { singular: 'piece', plural: 'pieces', abbrev: 'pcs' },
  BOX: { singular: 'box', plural: 'boxes', abbrev: 'box' },
  CASE: { singular: 'case', plural: 'cases', abbrev: 'cs' },
  KG: { singular: 'kilogram', plural: 'kilograms', abbrev: 'kg' },
  LB: { singular: 'pound', plural: 'pounds', abbrev: 'lb' },
  M: { singular: 'meter', plural: 'meters', abbrev: 'm' },
  FT: { singular: 'foot', plural: 'feet', abbrev: 'ft' },
  L: { singular: 'liter', plural: 'liters', abbrev: 'L' },
  GAL: { singular: 'gallon', plural: 'gallons', abbrev: 'gal' },
  HR: { singular: 'hour', plural: 'hours', abbrev: 'hr' },
  DAY: { singular: 'day', plural: 'days', abbrev: 'day' },
  LOT: { singular: 'lot', plural: 'lots', abbrev: 'lot' },
};

export interface FormatQuantityOptions {
  /** Use full unit name instead of abbreviation (default: false) */
  fullName?: boolean;
  /** Number of decimal places (default: auto) */
  decimals?: number;
}

/**
 * Format a Quantity value for display.
 *
 * @example
 * formatQuantity({ value: 150, unit: 'EA' })                    // "150 ea"
 * formatQuantity({ value: 2.5, unit: 'KG' })                    // "2.5 kg"
 * formatQuantity({ value: 1, unit: 'BOX' }, { fullName: true }) // "1 box"
 */
export function formatQuantity(q: Quantity, options: FormatQuantityOptions = {}): string {
  const { fullName = false, decimals } = options;

  const uomInfo = UOM_LABELS[q.unit] ?? { singular: q.unit, plural: q.unit, abbrev: q.unit };

  // Determine decimal places
  const effectiveDecimals = decimals ?? (Number.isInteger(q.value) ? 0 : 2);

  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  }).format(q.value);

  if (fullName) {
    const label = q.value === 1 ? uomInfo.singular : uomInfo.plural;
    return `${formattedValue} ${label}`;
  }

  return `${formattedValue} ${uomInfo.abbrev}`;
}

/**
 * Format just the quantity value (no unit).
 */
export function formatQuantityValue(q: Quantity, decimals?: number): string {
  const effectiveDecimals = decimals ?? (Number.isInteger(q.value) ? 0 : 2);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  }).format(q.value);
}

// ============================================================================
// Date/Time Formatting
// ============================================================================

export type DateFormat = 'full' | 'long' | 'medium' | 'short' | 'iso';

export interface FormatDateOptions {
  /** Date format style */
  format?: DateFormat;
  /** Include time (default: false) */
  includeTime?: boolean;
  /** Time format: '12h' or '24h' (default: '12h') */
  timeFormat?: '12h' | '24h';
  /** Custom locale */
  locale?: string;
}

/**
 * Format a Timestamp for display.
 *
 * @example
 * formatDate('2026-01-15T10:30:00Z')                           // "Jan 15, 2026"
 * formatDate('2026-01-15T10:30:00Z', { format: 'full' })       // "Wednesday, January 15, 2026"
 * formatDate('2026-01-15T10:30:00Z', { includeTime: true })    // "Jan 15, 2026, 10:30 AM"
 */
export function formatDate(ts: Timestamp, options: FormatDateOptions = {}): string {
  const {
    format = 'medium',
    includeTime = false,
    timeFormat = '12h',
    locale = 'en-US',
  } = options;

  if (format === 'iso') {
    return ts;
  }

  const date = new Date(ts);

  const dateStyle: Intl.DateTimeFormatOptions['dateStyle'] = format === 'full'
    ? 'full'
    : format === 'long'
      ? 'long'
      : format === 'short'
        ? 'short'
        : 'medium';

  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle,
  };

  if (includeTime) {
    formatOptions.timeStyle = 'short';
    formatOptions.hour12 = timeFormat === '12h';
  }

  return date.toLocaleString(locale, formatOptions);
}

/**
 * Format a timestamp as relative time.
 *
 * @example
 * formatRelativeTime('2026-01-14T10:00:00Z', '2026-01-15T10:00:00Z') // "1 day ago"
 * formatRelativeTime('2026-01-15T09:00:00Z', '2026-01-15T10:00:00Z') // "1 hour ago"
 */
export function formatRelativeTime(ts: Timestamp, relativeTo: Timestamp): string {
  const date = new Date(ts);
  const reference = new Date(relativeTo);
  const diffMs = date.getTime() - reference.getTime();

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
  const months = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));

  if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  if (Math.abs(days) < 7) return rtf.format(days, 'day');
  if (Math.abs(weeks) < 4) return rtf.format(weeks, 'week');
  return rtf.format(months, 'month');
}

// ============================================================================
// Duration Formatting
// ============================================================================

export interface FormatDurationOptions {
  /** Maximum number of units to show (default: 2) */
  maxUnits?: number;
  /** Use short labels like "2h 15m" vs "2 hours 15 minutes" */
  short?: boolean;
}

/**
 * Format a duration in milliseconds for display.
 *
 * @example
 * formatDuration(3600000)                    // "1 hour"
 * formatDuration(5400000)                    // "1 hour 30 minutes"
 * formatDuration(5400000, { short: true })   // "1h 30m"
 * formatDuration(90061000)                   // "1 day 1 hour"
 */
export function formatDuration(ms: number, options: FormatDurationOptions = {}): string {
  const { maxUnits = 2, short = false } = options;

  if (ms < 1000) {
    return short ? '<1s' : 'less than a second';
  }

  const units = [
    { ms: 86400000, short: 'd', long: 'day' },
    { ms: 3600000, short: 'h', long: 'hour' },
    { ms: 60000, short: 'm', long: 'minute' },
    { ms: 1000, short: 's', long: 'second' },
  ];

  const parts: string[] = [];
  let remaining = ms;

  for (const unit of units) {
    if (parts.length >= maxUnits) break;

    const count = Math.floor(remaining / unit.ms);
    if (count > 0) {
      if (short) {
        parts.push(`${count}${unit.short}`);
      } else {
        parts.push(`${count} ${unit.long}${count !== 1 ? 's' : ''}`);
      }
      remaining -= count * unit.ms;
    }
  }

  return short ? parts.join(' ') : parts.join(' ');
}

// ============================================================================
// Percentage Formatting
// ============================================================================

export interface FormatPercentageOptions {
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Show sign for positive values (default: false) */
  showPositiveSign?: boolean;
  /** Multiply by 100 if input is decimal (default: false - assumes basisPoints) */
  fromDecimal?: boolean;
}

/**
 * Format a Percentage value for display.
 *
 * @example
 * formatPercentage(percentage(8.25))                         // "8.25%"
 * formatPercentage(percentage(8.25), { showPositiveSign: true }) // "+8.25%"
 */
export function formatPercentage(p: Percentage, options: FormatPercentageOptions = {}): string {
  const { decimals = 2, showPositiveSign = false } = options;

  const value = percentageToDecimal(p);
  const sign = showPositiveSign && value > 0 ? '+' : '';

  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a decimal as percentage.
 *
 * @example
 * formatDecimalAsPercent(0.0825)               // "8.25%"
 * formatDecimalAsPercent(0.5, { decimals: 0 }) // "50%"
 */
export function formatDecimalAsPercent(
  decimal: number,
  options: FormatPercentageOptions = {}
): string {
  const { decimals = 2, showPositiveSign = false } = options;

  const value = decimal * 100;
  const sign = showPositiveSign && value > 0 ? '+' : '';

  return `${sign}${value.toFixed(decimals)}%`;
}

// ============================================================================
// Delta Formatting
// ============================================================================

export interface FormatDeltaOptions {
  /** Always show sign (default: true) */
  showSign?: boolean;
  /** Show as percentage change (default: false) */
  asPercent?: boolean;
}

/**
 * Format the difference between two Money values.
 *
 * @example
 * formatMoneyDelta(money(1500, 'USD'), money(1000, 'USD')) // "+$500.00"
 * formatMoneyDelta(money(800, 'USD'), money(1000, 'USD'))  // "-$200.00"
 */
export function formatMoneyDelta(
  current: Money,
  previous: Money,
  options: FormatDeltaOptions = {}
): string {
  const { showSign = true, asPercent = false } = options;

  if (current.currency !== previous.currency) {
    throw new Error(`Currency mismatch: ${current.currency} vs ${previous.currency}`);
  }

  const currentDecimal = moneyToDecimal(current);
  const previousDecimal = moneyToDecimal(previous);
  const diff = currentDecimal - previousDecimal;

  if (asPercent && previousDecimal !== 0) {
    const percentChange = (diff / Math.abs(previousDecimal)) * 100;
    const sign = showSign && percentChange > 0 ? '+' : '';
    return `${sign}${percentChange.toFixed(2)}%`;
  }

  // Format as money delta
  const absDiff = Math.abs(diff);
  const precision = CURRENCY_PRECISION[current.currency];
  const symbol = CURRENCY_SYMBOLS[current.currency];

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(absDiff);

  if (diff > 0) {
    return showSign ? `+${symbol}${formatted}` : `${symbol}${formatted}`;
  } else if (diff < 0) {
    return `-${symbol}${formatted}`;
  }
  return `${symbol}${formatted}`;
}

/**
 * Format the difference between two quantities.
 */
export function formatQuantityDelta(
  current: Quantity,
  previous: Quantity,
  options: FormatDeltaOptions = {}
): string {
  const { showSign = true, asPercent = false } = options;

  if (current.unit !== previous.unit) {
    throw new Error(`Unit mismatch: ${current.unit} vs ${previous.unit}`);
  }

  const diff = current.value - previous.value;

  if (asPercent && previous.value !== 0) {
    const percentChange = (diff / Math.abs(previous.value)) * 100;
    const sign = showSign && percentChange > 0 ? '+' : '';
    return `${sign}${percentChange.toFixed(1)}%`;
  }

  const uomInfo = UOM_LABELS[current.unit] ?? { abbrev: current.unit };
  const formatted = Math.abs(diff).toFixed(Number.isInteger(diff) ? 0 : 2);

  if (diff > 0) {
    return showSign ? `+${formatted} ${uomInfo.abbrev}` : `${formatted} ${uomInfo.abbrev}`;
  } else if (diff < 0) {
    return `-${formatted} ${uomInfo.abbrev}`;
  }
  return `${formatted} ${uomInfo.abbrev}`;
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a number with thousand separators.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number in compact notation.
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
