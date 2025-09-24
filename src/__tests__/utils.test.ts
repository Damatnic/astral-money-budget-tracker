import { formatCurrency } from '../utils/formatters'
import { calculateFinancialHealth } from '../utils/financialHealth'
import { exportToJSON, exportToCSV } from '../utils/exportUtils'

// Mock data for testing
const mockTransactions = [
  { id: '1', amount: 100, description: 'Test expense', category: 'food', date: '2024-01-01', type: 'expense' },
  { id: '2', amount: 2000, description: 'Test income', category: 'salary', date: '2024-01-01', type: 'income' }
]

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    test('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(100)).toBe('$100.00')
    })

    test('formats negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
      expect(formatCurrency(-100)).toBe('-$100.00')
    })

    test('handles decimal precision', () => {
      expect(formatCurrency(1234.5)).toBe('$1,234.50')
      expect(formatCurrency(1234.567)).toBe('$1,234.57')
      expect(formatCurrency(1234.123)).toBe('$1,234.12')
    })

    test('handles large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
      expect(formatCurrency(999999999.99)).toBe('$999,999,999.99')
    })
  })

  describe('calculateFinancialHealth', () => {
    test('calculates health score correctly for good financial state', () => {
      const mockData = {
        balance: 5000,
        monthlyIncome: 3000,
        monthlyExpenses: 2000,
        emergencyFund: 6000,
        goals: [
          { current: 500, target: 1000, targetDate: '2024-12-31' },
          { current: 2000, target: 5000, targetDate: '2024-06-30' }
        ]
      }
      
      const score = calculateFinancialHealth(mockData)
      expect(score).toBeGreaterThanOrEqual(60)
      expect(score).toBeLessThanOrEqual(100)
    })

    test('calculates health score correctly for poor financial state', () => {
      const mockData = {
        balance: 100,
        monthlyIncome: 2000,
        monthlyExpenses: 2500,
        emergencyFund: 0,
        goals: []
      }
      
      const score = calculateFinancialHealth(mockData)
      expect(score).toBeLessThan(50)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    test('handles edge cases', () => {
      const mockData = {
        balance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        emergencyFund: 0,
        goals: []
      }
      
      const score = calculateFinancialHealth(mockData)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('exportToJSON', () => {
    test('exports data correctly to JSON format', () => {
      const result = exportToJSON(mockTransactions)
      
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.json/)
      expect(result.data).toContain('"id": "1"')
      expect(result.data).toContain('"amount": 100')
      expect(result.mimeType).toBe('application/json')
    })

    test('handles empty data', () => {
      const result = exportToJSON([])
      
      expect(result.data).toBe('[]')
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.json/)
    })
  })

  describe('exportToCSV', () => {
    test('exports data correctly to CSV format', () => {
      const result = exportToCSV(mockTransactions)
      
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.csv/)
      expect(result.data).toContain('ID,Amount,Description,Category,Date,Type')
      expect(result.data).toContain('1,100,"Test expense",food,2024-01-01,expense')
      expect(result.mimeType).toBe('text/csv')
    })

    test('handles empty data', () => {
      const result = exportToCSV([])
      
      expect(result.data).toBe('ID,Amount,Description,Category,Date,Type')
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.csv/)
    })

    test('escapes CSV special characters', () => {
      const dataWithCommas = [
        { id: '1', amount: 100, description: 'Test, with comma', category: 'food', date: '2024-01-01', type: 'expense' }
      ]
      
      const result = exportToCSV(dataWithCommas)
      expect(result.data).toContain('"Test, with comma"')
    })
  })
})