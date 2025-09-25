/**
 * Comprehensive Formatters Tests
 * Tests for all formatting utilities and edge cases
 */

import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatNumber,
  formatFileSize,
  formatDuration,
  formatRelativeTime,
  parseFormattedCurrency,
  validateCurrencyInput,
  CurrencyFormatter,
  DateFormatter,
  NumberFormatter
} from '../formatters';

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('should format negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-0.01)).toBe('-$0.01');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(999999999.99)).toBe('$999,999,999.99');
    });

    it('should handle different locales', () => {
      const euroFormat = formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(euroFormat).toContain('€');
      expect(euroFormat).toContain('1.234,56');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(formatCurrency('invalid' as any)).toBe('$0.00');
      expect(formatCurrency(NaN)).toBe('$0.00');
      expect(formatCurrency(Infinity)).toBe('$0.00');
    });
  });

  describe('parseFormattedCurrency', () => {
    it('should parse formatted currency strings', () => {
      expect(parseFormattedCurrency('$1,234.56')).toBe(1234.56);
      expect(parseFormattedCurrency('-$1,234.56')).toBe(-1234.56);
      expect(parseFormattedCurrency('$0.00')).toBe(0);
    });

    it('should handle different formats', () => {
      expect(parseFormattedCurrency('1234.56')).toBe(1234.56);
      expect(parseFormattedCurrency('1,234')).toBe(1234);
      expect(parseFormattedCurrency('$1234')).toBe(1234);
    });

    it('should handle invalid inputs', () => {
      expect(parseFormattedCurrency('invalid')).toBe(0);
      expect(parseFormattedCurrency('')).toBe(0);
      expect(parseFormattedCurrency(null as any)).toBe(0);
    });
  });

  describe('validateCurrencyInput', () => {
    it('should validate correct currency inputs', () => {
      expect(validateCurrencyInput('123.45')).toBe(true);
      expect(validateCurrencyInput('0')).toBe(true);
      expect(validateCurrencyInput('1000')).toBe(true);
    });

    it('should reject invalid inputs', () => {
      expect(validateCurrencyInput('abc')).toBe(false);
      expect(validateCurrencyInput('12.345')).toBe(false);
      expect(validateCurrencyInput('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateCurrencyInput('0.00')).toBe(true);
      expect(validateCurrencyInput('.50')).toBe(true);
      expect(validateCurrencyInput('50.')).toBe(true);
    });
  });
});

describe('Percentage Formatting', () => {
  describe('formatPercentage', () => {
    it('should format decimal values', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(0.5)).toBe('50.00%');
      expect(formatPercentage(1)).toBe('100.00%');
    });

    it('should handle custom precision', () => {
      expect(formatPercentage(0.1234, { precision: 1 })).toBe('12.3%');
      expect(formatPercentage(0.1234, { precision: 0 })).toBe('12%');
    });

    it('should handle already-percentage values', () => {
      expect(formatPercentage(12.34, { isAlreadyPercentage: true })).toBe('12.34%');
      expect(formatPercentage(50, { isAlreadyPercentage: true })).toBe('50.00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-0.1234)).toBe('-12.34%');
      expect(formatPercentage(-12.34, { isAlreadyPercentage: true })).toBe('-12.34%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(null as any)).toBe('0.00%');
      expect(formatPercentage(undefined as any)).toBe('0.00%');
    });
  });
});

describe('Date Formatting', () => {
  const testDate = new Date('2024-01-15T14:30:00Z');

  describe('formatDate', () => {
    it('should format dates in default format', () => {
      const formatted = formatDate(testDate);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
    });

    it('should handle different format options', () => {
      expect(formatDate(testDate, { format: 'short' })).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatDate(testDate, { format: 'long' })).toContain('January');
      expect(formatDate(testDate, { format: 'iso' })).toContain('2024-01-15');
    });

    it('should handle different locales', () => {
      const usFormat = formatDate(testDate, { locale: 'en-US' });
      const deFormat = formatDate(testDate, { locale: 'de-DE' });
      
      expect(usFormat).toBeDefined();
      expect(deFormat).toBeDefined();
      // Formats may differ based on locale
    });

    it('should handle null and invalid dates', () => {
      expect(formatDate(null)).toBe('Invalid Date');
      expect(formatDate(undefined)).toBe('Invalid Date');
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const formatted = formatDateTime(testDate);
      expect(formatted).toContain('2024');
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time format
    });

    it('should handle timezone options', () => {
      const utcFormat = formatDateTime(testDate, { timezone: 'UTC' });
      const localFormat = formatDateTime(testDate, { timezone: 'local' });
      
      expect(utcFormat).toBeDefined();
      expect(localFormat).toBeDefined();
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date();

    it('should format recent times', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo, now);
      
      expect(result).toContain('minute');
      expect(result).toContain('ago');
    });

    it('should format future times', () => {
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesFromNow, now);
      
      expect(result).toContain('minute');
      expect(result).toContain('from now');
    });

    it('should handle different time ranges', () => {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(oneHourAgo, now)).toContain('hour');
      expect(formatRelativeTime(oneDayAgo, now)).toContain('day');
      expect(formatRelativeTime(oneWeekAgo, now)).toContain('week');
    });

    it('should handle just now', () => {
      const justNow = new Date(now.getTime() - 10 * 1000); // 10 seconds ago
      const result = formatRelativeTime(justNow, now);
      
      expect(result).toBe('just now');
    });
  });
});

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('should format integers', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1234.5)).toBe('1,234.5');
    });

    it('should handle precision options', () => {
      expect(formatNumber(1234.5678, { precision: 2 })).toBe('1,234.57');
      expect(formatNumber(1234.5678, { precision: 0 })).toBe('1,235');
    });

    it('should handle compact notation', () => {
      expect(formatNumber(1000000, { compact: true })).toMatch(/1M|1,000K/);
      expect(formatNumber(1500, { compact: true })).toMatch(/1.5K|1,500/);
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
      expect(formatNumber(-1234.56)).toBe('-1,234.56');
    });
  });
});

describe('File Size Formatting', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format larger units', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    });

    it('should handle precision options', () => {
      expect(formatFileSize(1536, { precision: 2 })).toBe('1.50 KB');
      expect(formatFileSize(1536, { precision: 0 })).toBe('2 KB');
    });

    it('should handle invalid inputs', () => {
      expect(formatFileSize(-1)).toBe('0 B');
      expect(formatFileSize(null as any)).toBe('0 B');
      expect(formatFileSize(undefined as any)).toBe('0 B');
    });
  });
});

describe('Duration Formatting', () => {
  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3599)).toBe('59m 59s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
      expect(formatDuration(7200)).toBe('2h 0m 0s');
    });

    it('should handle compact format', () => {
      expect(formatDuration(3661, { compact: true })).toBe('1:01:01');
      expect(formatDuration(90, { compact: true })).toBe('1:30');
    });

    it('should handle zero and negative values', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(-30)).toBe('0s');
    });
  });
});

describe('Advanced Formatters', () => {
  describe('CurrencyFormatter class', () => {
    it('should create formatter with default options', () => {
      const formatter = new CurrencyFormatter();
      expect(formatter.format(1234.56)).toBe('$1,234.56');
    });

    it('should create formatter with custom options', () => {
      const formatter = new CurrencyFormatter('EUR', 'de-DE');
      const result = formatter.format(1234.56);
      expect(result).toContain('€');
    });

    it('should handle batch formatting', () => {
      const formatter = new CurrencyFormatter();
      const amounts = [100, 200.50, 300.75];
      const results = formatter.formatBatch(amounts);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe('$100.00');
      expect(results[1]).toBe('$200.50');
      expect(results[2]).toBe('$300.75');
    });
  });

  describe('DateFormatter class', () => {
    const testDate = new Date('2024-01-15T14:30:00Z');

    it('should create formatter with default options', () => {
      const formatter = new DateFormatter();
      const result = formatter.format(testDate);
      expect(result).toBeDefined();
    });

    it('should create formatter with custom options', () => {
      const formatter = new DateFormatter({ 
        format: 'short', 
        locale: 'en-US',
        timezone: 'UTC'
      });
      const result = formatter.format(testDate);
      expect(result).toBeDefined();
    });

    it('should handle batch formatting', () => {
      const formatter = new DateFormatter();
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03')
      ];
      const results = formatter.formatBatch(dates);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => typeof r === 'string')).toBe(true);
    });
  });

  describe('NumberFormatter class', () => {
    it('should create formatter with default options', () => {
      const formatter = new NumberFormatter();
      expect(formatter.format(1234.56)).toBe('1,234.56');
    });

    it('should create formatter with custom options', () => {
      const formatter = new NumberFormatter({
        precision: 2,
        compact: true,
        locale: 'en-US'
      });
      const result = formatter.format(1000000);
      expect(result).toBeDefined();
    });

    it('should handle statistical formatting', () => {
      const formatter = new NumberFormatter();
      const numbers = [100, 200, 300, 400, 500];
      
      const stats = formatter.formatStatistics(numbers);
      expect(stats.mean).toBeDefined();
      expect(stats.median).toBeDefined();
      expect(stats.min).toBeDefined();
      expect(stats.max).toBeDefined();
      expect(stats.sum).toBeDefined();
    });
  });
});
