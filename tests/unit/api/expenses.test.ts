import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import API routes after mocking
import { GET, POST, PUT, DELETE } from '../../../src/app/api/expenses/route';

describe('/api/expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
  });

  describe('GET /api/expenses', () => {
    test('should return expenses successfully', async () => {
      const mockExpenses = [
        { id: '1', amount: 100, description: 'Test expense', category: 'food' },
        { id: '2', amount: 50, description: 'Another expense', category: 'transport' },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockExpenses);

      const request = new Request('http://localhost/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toEqual(mockExpenses);
      expect(data.source).toBe('database');
    });

    test('should handle database errors', async () => {
      mockPrisma.transaction.findMany.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch expenses');
    });

    test('should work without database URL', async () => {
      delete process.env.DATABASE_URL;

      const request = new Request('http://localhost/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source).toBe('mock');
      expect(Array.isArray(data.expenses)).toBe(true);
    });
  });

  describe('POST /api/expenses', () => {
    test('should create expense successfully', async () => {
      const mockUser = { id: 'user1', balance: 1000 };
      const mockExpense = { id: '1', amount: 100, description: 'Test expense', category: 'food' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.transaction.create.mockResolvedValue(mockExpense);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, balance: 900 });

      const request = new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount: 100,
          description: 'Test expense',
          category: 'food',
          date: '2024-01-01',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expense).toEqual(mockExpense);
      expect(data.newBalance).toBe(900);
    });

    test('should validate required fields', async () => {
      const request = new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test expense',
          category: 'food',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Amount is required');
    });
  });

  describe('PUT /api/expenses', () => {
    test('should update expense successfully', async () => {
      const mockUser = { id: 'user1', balance: 1000 };
      const mockOldExpense = { id: '1', amount: 100, description: 'Old expense' };
      const mockUpdatedExpense = { id: '1', amount: 150, description: 'Updated expense' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.transaction.findUnique.mockResolvedValue(mockOldExpense);
      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedExpense);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, balance: 950 });

      const request = new Request('http://localhost/api/expenses', {
        method: 'PUT',
        body: JSON.stringify({
          id: '1',
          amount: 150,
          description: 'Updated expense',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expense).toEqual(mockUpdatedExpense);
      expect(data.newBalance).toBe(950);
    });

    test('should require ID for update', async () => {
      const request = new Request('http://localhost/api/expenses', {
        method: 'PUT',
        body: JSON.stringify({
          amount: 150,
          description: 'Updated expense',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID is required');
    });
  });

  describe('DELETE /api/expenses', () => {
    test('should delete expense successfully', async () => {
      const mockUser = { id: 'user1', balance: 900 };
      const mockExpense = { id: '1', amount: 100, description: 'Test expense' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.transaction.findUnique.mockResolvedValue(mockExpense);
      mockPrisma.transaction.delete.mockResolvedValue(mockExpense);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, balance: 1000 });

      const request = new Request('http://localhost/api/expenses', {
        method: 'DELETE',
        body: JSON.stringify({ id: '1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Expense deleted successfully');
      expect(data.newBalance).toBe(1000);
    });

    test('should require ID for deletion', async () => {
      const request = new Request('http://localhost/api/expenses', {
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