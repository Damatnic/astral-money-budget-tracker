/**
 * Categorization Utility Tests
 * Tests for transaction categorization and smart categorization features
 */

import { 
  categorizeTransaction, 
  suggestCategory, 
  getCategoryIcon,
  getCategoryColor,
  isValidCategory 
} from '../categorization';

describe('Categorization Utilities', () => {
  describe('categorizeTransaction', () => {
    it('should categorize food transactions', () => {
      expect(categorizeTransaction('McDonald\'s')).toBe('dining');
      expect(categorizeTransaction('Grocery Store')).toBe('groceries');
      expect(categorizeTransaction('Starbucks')).toBe('dining');
    });

    it('should categorize transportation transactions', () => {
      expect(categorizeTransaction('Gas Station')).toBe('transportation');
      expect(categorizeTransaction('Uber')).toBe('transportation');
      expect(categorizeTransaction('Parking')).toBe('transportation');
    });

    it('should categorize utility transactions', () => {
      expect(categorizeTransaction('Electric Company')).toBe('utilities');
      expect(categorizeTransaction('Water Bill')).toBe('utilities');
      expect(categorizeTransaction('Internet Service')).toBe('utilities');
    });

    it('should return other for unknown transactions', () => {
      expect(categorizeTransaction('Unknown Merchant')).toBe('other');
      expect(categorizeTransaction('')).toBe('other');
    });
  });

  describe('suggestCategory', () => {
    it('should suggest categories based on description', () => {
      const suggestions = suggestCategory('restaurant');
      expect(suggestions).toContain('dining');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty description', () => {
      const suggestions = suggestCategory('');
      expect(suggestions).toEqual([]);
    });
  });

  describe('getCategoryIcon', () => {
    it('should return appropriate icons for categories', () => {
      expect(getCategoryIcon('dining')).toBe('🍽️');
      expect(getCategoryIcon('groceries')).toBe('🛒');
      expect(getCategoryIcon('transportation')).toBe('🚗');
      expect(getCategoryIcon('utilities')).toBe('⚡');
      expect(getCategoryIcon('entertainment')).toBe('🎬');
    });

    it('should return default icon for unknown category', () => {
      expect(getCategoryIcon('unknown')).toBe('📊');
    });
  });

  describe('getCategoryColor', () => {
    it('should return appropriate colors for categories', () => {
      expect(getCategoryColor('dining')).toBe('#FF6B6B');
      expect(getCategoryColor('groceries')).toBe('#4ECDC4');
      expect(getCategoryColor('transportation')).toBe('#45B7D1');
      expect(getCategoryColor('utilities')).toBe('#F39C12');
    });

    it('should return default color for unknown category', () => {
      expect(getCategoryColor('unknown')).toBe('#95A5A6');
    });
  });

  describe('isValidCategory', () => {
    it('should validate known categories', () => {
      expect(isValidCategory('dining')).toBe(true);
      expect(isValidCategory('groceries')).toBe(true);
      expect(isValidCategory('transportation')).toBe(true);
      expect(isValidCategory('utilities')).toBe(true);
      expect(isValidCategory('entertainment')).toBe(true);
      expect(isValidCategory('healthcare')).toBe(true);
      expect(isValidCategory('shopping')).toBe(true);
      expect(isValidCategory('income')).toBe(true);
      expect(isValidCategory('other')).toBe(true);
    });

    it('should reject invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory('DINING')).toBe(false); // Case sensitive
    });
  });
});
