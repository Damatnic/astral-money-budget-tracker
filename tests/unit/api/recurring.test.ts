import { createMocks } from 'node-mocks-http';

// Mock Prisma
const mockPrisma = {
  recurringBill: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import API routes after mocking
import { GET, POST, PUT, DELETE } from '../../../src/app/api/recurring/route';

describe('/api/recurring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
  });

  describe('GET /api/recurring', () => {
    test('should return recurring bills successfully', async () => {
      const mockBills = [
        { id: '1', name: 'Netflix', amount: 15.99, frequency: 'monthly', category: 'entertainment' },
        { id: '2', name: 'Rent', amount: 1200, frequency: 'monthly', category: 'housing' },
      ];

      mockPrisma.recurringBill.findMany.mockResolvedValue(mockBills);

      const request = new Request('http://localhost/api/recurring');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurring).toEqual(mockBills);
      expect(data.source).toBe('database');
    });

    test('should handle database errors', async () => {
      mockPrisma.recurringBill.findMany.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/recurring');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch recurring bills');
    });
  });

  describe('POST /api/recurring', () => {
    test('should create recurring bill successfully', async () => {
      const mockBill = { 
        id: '1', 
        name: 'Netflix', 
        amount: 15.99, 
        frequency: 'monthly', 
        category: 'entertainment',
        startDate: new Date('2024-01-01'),
        isActive: true 
      };

      mockPrisma.recurringBill.create.mockResolvedValue(mockBill);

      const request = new Request('http://localhost/api/recurring', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Netflix',
          amount: 15.99,
          frequency: 'monthly',
          category: 'entertainment',
          startDate: '2024-01-01',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurring).toEqual(mockBill);
      expect(data.source).toBe('database');
    });

    test('should validate required fields', async () => {
      const request = new Request('http://localhost/api/recurring', {
        method: 'POST',
        body: JSON.stringify({
          amount: 15.99,
          frequency: 'monthly',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
    });
  });

  describe('PUT /api/recurring', () => {
    test('should update recurring bill successfully', async () => {
      const mockUpdatedBill = { 
        id: '1', 
        name: 'Netflix Premium', 
        amount: 19.99, 
        frequency: 'monthly', 
        isActive: true 
      };

      mockPrisma.recurringBill.update.mockResolvedValue(mockUpdatedBill);

      const request = new Request('http://localhost/api/recurring', {
        method: 'PUT',
        body: JSON.stringify({
          id: '1',
          name: 'Netflix Premium',
          amount: 19.99,
          isActive: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurring).toEqual(mockUpdatedBill);
      expect(data.source).toBe('database');
    });

    test('should require ID for update', async () => {
      const request = new Request('http://localhost/api/recurring', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Netflix Premium',
          amount: 19.99,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID is required');
    });
  });

  describe('DELETE /api/recurring', () => {
    test('should delete recurring bill successfully', async () => {
      const mockBill = { id: '1', name: 'Netflix' };

      mockPrisma.recurringBill.delete.mockResolvedValue(mockBill);

      const request = new Request('http://localhost/api/recurring', {
        method: 'DELETE',
        body: JSON.stringify({ id: '1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Recurring bill deleted successfully');
      expect(data.source).toBe('database');
    });

    test('should require ID for deletion', async () => {
      const request = new Request('http://localhost/api/recurring', {
        method: 'DELETE',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID is required');
    });
  });
});