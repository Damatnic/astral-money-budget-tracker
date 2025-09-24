import { 
  formatCurrency, 
  formatDate, 
  formatPercentage
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(42)).toBe('$42.00');
      expect(formatCurrency(0.1)).toBe('$0.10');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-$500.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-0.99)).toBe('-$0.99');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      // Note: -0 is treated as 0 by JavaScript, but Intl.NumberFormat may show -$0.00
      const negativeZeroResult = formatCurrency(-0);
      expect(negativeZeroResult === '$0.00' || negativeZeroResult === '-$0.00').toBe(true);
    });

    it('should handle NaN and undefined gracefully', () => {
      // These will likely return "NaN" formatted as currency, but let's test actual behavior
      const nanResult = formatCurrency(NaN);
      expect(typeof nanResult).toBe('string');
      expect(nanResult).toContain('NaN');

      // Undefined will be coerced to NaN
      const undefinedResult = formatCurrency(undefined as any);
      expect(typeof undefinedResult).toBe('string');
      expect(undefinedResult).toContain('NaN');

      // Null will be coerced to 0
      expect(formatCurrency(null as any)).toBe('$0.00');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999.99)).toBe('$999,999,999.99');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.001)).toBe('$0.00'); // Rounds to 2 decimal places
    });
  });

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2024-09-24T12:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Sep 2[34], 2024/); // Account for timezone differences
    });

    it('should format date strings correctly', () => {
      // Note: Date parsing can be timezone-sensitive, so we need to be flexible
      const result1 = formatDate('2024-12-25');
      expect(result1).toMatch(/Dec 2[45], 2024/); // Allow for timezone shift
      
      const result2 = formatDate('2024-01-01T00:00:00Z');
      expect(result2).toMatch(/(Dec 31, 2023|Jan 1, 2024)/); // Timezone dependent
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
      expect(formatDate('')).toMatch(/(Invalid Date|Dec 31, 1969)/); // Empty string behavior varies
      
      // null and undefined get coerced differently
      const nullResult = formatDate(null as any);
      expect(nullResult).toMatch(/(Invalid Date|Dec 31, 1969)/);
      
      const undefinedResult = formatDate(undefined as any);
      expect(undefinedResult).toBe('Invalid Date');
    });

    it('should handle edge cases', () => {
      // These may vary by timezone, so be flexible
      const leapYear = formatDate('2024-02-29');
      expect(leapYear).toMatch(/Feb 2[89], 2024/);
      
      const yearEnd = formatDate('2024-12-31');
      expect(yearEnd).toMatch(/Dec 3[01], 2024/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages as rounded integers', () => {
      expect(formatPercentage(0.1234)).toBe('0%'); // Rounds 0.1234 to 0
      expect(formatPercentage(1)).toBe('1%');
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(0.5)).toBe('1%'); // Rounds 0.5 to 1
      expect(formatPercentage(12.34)).toBe('12%');
      expect(formatPercentage(99.9)).toBe('100%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-0.1234)).toBe('0%'); // Rounds -0.1234 to 0
      expect(formatPercentage(-5.7)).toBe('-6%');
    });

    it('should handle large percentages', () => {
      expect(formatPercentage(567)).toBe('567%');
      expect(formatPercentage(1000)).toBe('1000%');
    });

    it('should handle null and undefined', () => {
      expect(formatPercentage(null as any)).toBe('0%'); // null coerces to 0
      expect(formatPercentage(undefined as any)).toBe('NaN%'); // undefined coerces to NaN
    });

    it('should handle NaN and Infinity', () => {
      expect(formatPercentage(NaN)).toBe('NaN%');
      expect(formatPercentage(Infinity)).toBe('Infinity%');
      expect(formatPercentage(-Infinity)).toBe('-Infinity%');
    });
  });
});