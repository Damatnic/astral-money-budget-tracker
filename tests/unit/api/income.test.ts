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
import { GET, POST, PUT, DELETE } from '../../../src/app/api/income/route';

describe('/api/income', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
  });

  describe('GET /api/income', () => {
    test('should return income successfully', async () => {
      const mockIncome = [
        { id: '1', amount: 3000, description: 'Salary', category: 'salary' },
        { id: '2', amount: 500, description: 'Freelance', category: 'freelance' },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockIncome);

      const request = new Request('http://localhost/api/income');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toEqual(mockIncome);
      expect(data.source).toBe('database');
    });

    test('should handle database errors', async () => {
      mockPrisma.transaction.findMany.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/income');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch income');
    });
  });

  describe('POST /api/income', () => {
    test('should create income successfully', async () => {
      const mockUser = { id: 'user1', balance: 1000 };
      const mockIncome = { id: '1', amount: 3000, description: 'Salary', category: 'salary' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.transaction.create.mockResolvedValue(mockIncome);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, balance: 4000 });

      const request = new Request('http://localhost/api/income', {
        method: 'POST',
        body: JSON.stringify({
          amount: 3000,
          description: 'Salary',
          source: 'salary',
          date: '2024-01-01',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toEqual(mockIncome);
      expect(data.newBalance).toBe(4000);
    });

    test('should validate required fields', async () => {
      const request = new Request('http://localhost/api/income', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Salary',
          source: 'salary',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Amount is required');
    });
  });

  describe('PUT /api/income', () => {
    test('should update income successfully', async () => {
      const mockUser = { id: 'user1', balance: 4000 };
      const mockOldIncome = { id: '1', amount: 3000, description: 'Old salary' };
      const mockUpdatedIncome = { id: '1', amount: 3500, description: 'Updated salary' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.transaction.findUnique.mockResolvedValue(mockOldIncome);
      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedIncome);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, balance: 4500 });

      const request = new Request('http://localhost/api/income', {
        method: 'PUT',
        body: JSON.stringify({
          id: '1',
          amount: 3500,
          description: 'Updated salary',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toEqual(mockUpdatedIncome);
      expect(data.newBalance).toBe(4500);
    });
  });

  describe('DELETE /api/income', () => {
    test('should delete income successfully', async () => {
      const mockUser = { id: 'user1', balance: 4000 };
      const mockIncome = { id: '1', amount: 3000, description: 'Salary' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.transaction.findUnique.mockResolvedValue(mockIncome);
      mockPrisma.transaction.delete.mockResolvedValue(mockIncome);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, balance: 1000 });

      const request = new Request('http://localhost/api/income', {
        method: 'DELETE',
        body: JSON.stringify({ id: '1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Income deleted successfully');
      expect(data.newBalance).toBe(1000);
    });
  });
});