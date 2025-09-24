import { exportToJSON, exportToCSV, downloadFile } from '../exportUtils';

// Mock DOM APIs for browser environment
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options
})) as any;

// Mock document methods
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};
document.createElement = jest.fn().mockReturnValue(mockLink);
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('exportUtils', () => {
  const sampleData = [
    {
      id: '1',
      amount: 25.50,
      description: 'Coffee Shop',
      category: 'food',
      date: '2024-09-24',
      type: 'expense'
    },
    {
      id: '2',
      amount: 1200.00,
      description: 'Salary Deposit',
      category: 'income',
      date: '2024-09-23',
      type: 'income'
    },
    {
      id: '3',
      amount: 45.75,
      description: 'Quote "Special" Deal',
      category: 'shopping',
      date: '2024-09-22',
      type: 'expense'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToJSON', () => {
    it('should export data to JSON format correctly', () => {
      const result = exportToJSON(sampleData);
      
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.json/);
      
      const parsedData = JSON.parse(result.data);
      expect(parsedData).toEqual(sampleData);
    });

    it('should handle empty data', () => {
      const result = exportToJSON([]);
      
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.json/);
      expect(result.data).toBe('[]');
    });

    it('should format JSON with proper indentation', () => {
      const result = exportToJSON([sampleData[0]]);
      
      // Check that the JSON is formatted with indentation (spaces)
      expect(result.data).toContain('  ');
      expect(result.data).toContain('\n');
    });

    it('should generate filename with current date', () => {
      const mockDate = '2024-09-24';
      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = jest.fn(() => `${mockDate}T12:00:00.000Z`);
      
      const result = exportToJSON(sampleData);
      expect(result.filename).toBe(`astral-money-export-${mockDate}.json`);
      
      Date.prototype.toISOString = originalToISOString;
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV format correctly', () => {
      const result = exportToCSV(sampleData);
      
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.csv/);
      
      const lines = result.data.split('\n');
      expect(lines[0]).toBe('ID,Amount,Description,Category,Date,Type');
      expect(lines[1]).toBe('1,25.5,"Coffee Shop",food,2024-09-24,expense');
      expect(lines[2]).toBe('2,1200,"Salary Deposit",income,2024-09-23,income');
      expect(lines[3]).toBe('3,45.75,""Quote ""Special"" Deal"",shopping,2024-09-22,expense');
    });

    it('should handle empty data with headers only', () => {
      const result = exportToCSV([]);
      
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/astral-money-export-\d{4}-\d{2}-\d{2}\.csv/);
      expect(result.data).toBe('ID,Amount,Description,Category,Date,Type');
    });

    it('should properly escape quotes in descriptions', () => {
      const dataWithQuotes = [{
        id: '1',
        amount: 10.00,
        description: 'Item with "quotes" and more "quotes"',
        category: 'test',
        date: '2024-09-24',
        type: 'expense'
      }];
      
      const result = exportToCSV(dataWithQuotes);
      const lines = result.data.split('\n');
      expect(lines[1]).toContain('""Item with ""quotes"" and more ""quotes""""');
    });

    it('should handle single item correctly', () => {
      const result = exportToCSV([sampleData[0]]);
      
      const lines = result.data.split('\n');
      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[0]).toBe('ID,Amount,Description,Category,Date,Type');
      expect(lines[1]).toBe('1,25.5,"Coffee Shop",food,2024-09-24,expense');
    });

    it('should generate filename with current date', () => {
      const mockDate = '2024-09-24';
      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = jest.fn(() => `${mockDate}T12:00:00.000Z`);
      
      const result = exportToCSV(sampleData);
      expect(result.filename).toBe(`astral-money-export-${mockDate}.csv`);
      
      Date.prototype.toISOString = originalToISOString;
    });

    it('should handle special characters in data', () => {
      const specialData = [{
        id: '1',
        amount: 15.00,
        description: 'Special chars: àáâãäå ñ ç',
        category: 'test',
        date: '2024-09-24',
        type: 'expense'
      }];
      
      const result = exportToCSV(specialData);
      expect(result.data).toContain('Special chars: àáâãäå ñ ç');
    });
  });

  describe('downloadFile', () => {
    it('should create and trigger file download', () => {
      const mockResult = {
        filename: 'test-file.json',
        data: '{"test": "data"}',
        mimeType: 'application/json'
      };

      downloadFile(mockResult);

      // Verify Blob creation
      expect(global.Blob).toHaveBeenCalledWith(
        ['{"test": "data"}'],
        { type: 'application/json' }
      );

      // Verify URL creation and cleanup
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Object));
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');

      // Verify link creation and interaction
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('mock-url');
      expect(mockLink.download).toBe('test-file.json');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should handle CSV file download', () => {
      const mockResult = {
        filename: 'export.csv',
        data: 'ID,Name\n1,Test',
        mimeType: 'text/csv'
      };

      downloadFile(mockResult);

      expect(global.Blob).toHaveBeenCalledWith(
        ['ID,Name\n1,Test'],
        { type: 'text/csv' }
      );
      expect(mockLink.download).toBe('export.csv');
    });

    it('should handle empty data download', () => {
      const mockResult = {
        filename: 'empty.json',
        data: '',
        mimeType: 'application/json'
      };

      downloadFile(mockResult);

      expect(global.Blob).toHaveBeenCalledWith(
        [''],
        { type: 'application/json' }
      );
    });

    it('should properly clean up resources', () => {
      const mockResult = {
        filename: 'cleanup-test.json',
        data: 'test data',
        mimeType: 'application/json'
      };

      downloadFile(mockResult);

      // Verify cleanup happens after download
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('Integration tests', () => {
    it('should work together for complete export workflow', () => {
      const testData = [
        {
          id: 'test-1',
          amount: 99.99,
          description: 'Integration Test Item',
          category: 'test-category',
          date: '2024-09-24',
          type: 'expense'
        }
      ];

      // Test JSON export workflow
      const jsonResult = exportToJSON(testData);
      expect(jsonResult.filename).toMatch(/\.json$/);
      expect(JSON.parse(jsonResult.data)).toEqual(testData);
      
      // Test that it can be downloaded
      downloadFile(jsonResult);
      expect(mockLink.click).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test CSV export workflow
      const csvResult = exportToCSV(testData);
      expect(csvResult.filename).toMatch(/\.csv$/);
      expect(csvResult.data).toContain('Integration Test Item');
      
      // Test that it can be downloaded
      downloadFile(csvResult);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});