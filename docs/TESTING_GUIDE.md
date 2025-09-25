# Comprehensive Testing Guide

## Overview

This document provides a complete guide to the testing infrastructure of the Astral Money application. Our testing strategy ensures enterprise-grade reliability, performance, and maintainability.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types and Structure](#test-types-and-structure)
3. [Testing Tools and Setup](#testing-tools-and-setup)
4. [Component Testing](#component-testing)
5. [API Testing](#api-testing)
6. [Integration Testing](#integration-testing)
7. [Performance Testing](#performance-testing)
8. [Error Boundary Testing](#error-boundary-testing)
9. [Best Practices](#best-practices)
10. [Running Tests](#running-tests)
11. [Coverage Requirements](#coverage-requirements)
12. [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing approach follows the **Testing Pyramid** principle:

```
    /\
   /  \    E2E Tests (Few, High-Level)
  /____\
 /      \   Integration Tests (Some, Mid-Level)  
/________\
|        |  Unit Tests (Many, Fast, Focused)
|________|
```

### Core Principles

1. **Fast Feedback** - Tests should run quickly and provide immediate feedback
2. **Reliable** - Tests should be deterministic and not flaky
3. **Maintainable** - Tests should be easy to understand and modify
4. **Comprehensive** - Critical paths should have thorough coverage
5. **Isolated** - Tests should not depend on external services or state

## Test Types and Structure

### Directory Structure

```
src/
├── __tests__/
│   ├── api/                    # API endpoint tests
│   │   ├── comprehensive-api.test.ts
│   │   └── __mocks__/
│   ├── integration/            # Integration tests
│   │   └── user-flows.test.ts
│   ├── performance/            # Performance tests
│   │   └── performance.test.ts
│   └── utils/                  # Utility tests
├── components/
│   └── __tests__/              # Component tests
│       ├── ErrorBoundary.test.tsx
│       ├── GoalsSection.working.test.tsx
│       └── GoalsSection.refactored.test.tsx
└── utils/
    └── __tests__/              # Utility function tests
```

### Test Categories

#### 1. Unit Tests
- **Purpose**: Test individual functions/components in isolation
- **Location**: `src/utils/__tests__/`, `src/components/__tests__/`
- **Characteristics**: Fast, focused, numerous

#### 2. Integration Tests  
- **Purpose**: Test component interactions and user workflows
- **Location**: `src/__tests__/integration/`
- **Characteristics**: Medium complexity, realistic scenarios

#### 3. API Tests
- **Purpose**: Test API endpoints, error handling, and responses
- **Location**: `src/__tests__/api/`
- **Characteristics**: Mock external dependencies, test contracts

#### 4. Performance Tests
- **Purpose**: Ensure application performs within acceptable limits
- **Location**: `src/__tests__/performance/`
- **Characteristics**: Measure timing, memory usage, load handling

## Testing Tools and Setup

### Core Testing Stack

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **User Event** - Realistic user interaction simulation
- **MSW** - API mocking (when needed)

### Configuration Files

#### `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
};
```

#### `jest.setup.js`
```javascript
import '@testing-library/jest-dom';

// Mock console methods in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = (...args) => {
    if (args[0]?.includes('Warning:') || args[0]?.includes('Error:')) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (args[0]?.includes('Warning:')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
```

## Component Testing

### Basic Component Test Pattern

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Testing with Props and State

```typescript
it('should handle props correctly', () => {
  const mockProps = {
    title: 'Test Title',
    onAction: jest.fn(),
  };

  render(<MyComponent {...mockProps} />);
  
  expect(screen.getByText('Test Title')).toBeInTheDocument();
  
  fireEvent.click(screen.getByRole('button'));
  expect(mockProps.onAction).toHaveBeenCalled();
});
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  render(<MyComponent />);
  
  fireEvent.click(screen.getByText('Load Data'));
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data Loaded')).toBeInTheDocument();
  });
});
```

## API Testing

### API Test Structure

```typescript
import { NextRequest } from 'next/server';
import { GET as apiHandler } from '@/app/api/endpoint/route';

describe('API Endpoint Tests', () => {
  beforeEach(() => {
    // Mock dependencies
  });

  it('should return successful response', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await apiHandler(request);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Mock error condition
    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await apiHandler(request);
    
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
```

### Mocking External Dependencies

```typescript
// Mock authentication
jest.mock('@/lib/auth-utils', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'test-user',
    email: 'test@example.com',
  })),
}));

// Mock database
jest.mock('@/lib/prisma', () => ({
  transaction: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
```

## Integration Testing

### User Flow Testing

```typescript
describe('Complete User Workflows', () => {
  it('should handle complete goal creation workflow', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({ /* initial data */ })
      .mockResolvedValueOnce({ /* create response */ });

    render(<Dashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Create new goal
    await user.click(screen.getByText('Add Goal'));
    await user.type(screen.getByLabelText('Goal Title'), 'Emergency Fund');
    await user.type(screen.getByLabelText('Target Amount'), '10000');
    await user.click(screen.getByText('Create Goal'));

    // Verify goal was created
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });
  });
});
```

## Performance Testing

### Performance Test Categories

#### 1. Rendering Performance
```typescript
it('should render within acceptable time limits', () => {
  const startTime = performance.now();
  render(<LargeComponent items={1000} />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100); // 100ms limit
});
```

#### 2. Memory Usage
```typescript
it('should not leak memory', async () => {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  const { unmount } = render(<Component />);
  
  // Perform operations
  // ...
  
  unmount();
  
  // Force garbage collection if available
  if (global.gc) global.gc();
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
});
```

#### 3. Load Testing
```typescript
it('should handle concurrent operations', async () => {
  const operations = Array.from({ length: 10 }, () =>
    performOperation()
  );
  
  const startTime = performance.now();
  const results = await Promise.all(operations);
  const endTime = performance.now();
  
  expect(results.every(r => r.success)).toBe(true);
  expect(endTime - startTime).toBeLessThan(1000); // 1 second limit
});
```

## Error Boundary Testing

### Error Boundary Test Pattern

```typescript
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
  });

  it('should allow error recovery', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    await user.click(screen.getByTestId('retry-button'));
    
    // Component should recover after retry
  });
});
```

## Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain what is being tested
- **Follow AAA pattern** (Arrange, Act, Assert)

### 2. Mocking Guidelines

- **Mock external dependencies** (APIs, databases, third-party libraries)
- **Don't mock what you're testing**
- **Use minimal mocks** - only mock what's necessary
- **Reset mocks** between tests

### 3. Async Testing

- **Always await async operations**
- **Use `waitFor`** for elements that appear asynchronously
- **Set appropriate timeouts** for slow operations
- **Test loading states** and error conditions

### 4. Accessibility Testing

- **Use semantic queries** (`getByRole`, `getByLabelText`)
- **Test keyboard navigation**
- **Verify ARIA attributes**
- **Test screen reader compatibility**

### 5. Error Testing

- **Test error conditions** explicitly
- **Verify error messages** are user-friendly
- **Test error recovery** mechanisms
- **Mock network failures** and timeouts

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- GoalsSection.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --testNamePattern="should handle errors"

# Run tests for specific directory
npm test -- src/components/__tests__/
```

### Advanced Options

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests and update snapshots
npm test -- --updateSnapshot

# Run tests with specific timeout
npm test -- --testTimeout=10000

# Run tests in band (no parallel execution)
npm test -- --runInBand

# Run only changed files
npm test -- --onlyChanged
```

### CI/CD Integration

```bash
# Production test run (no watch, coverage required)
npm test -- --watchAll=false --coverage --coverageReporters=text-lcov
```

## Coverage Requirements

### Current Thresholds

- **Statements**: 30%
- **Branches**: 30%
- **Functions**: 30%
- **Lines**: 30%

### Coverage Goals

- **Critical Components**: 90%+ coverage
- **Utility Functions**: 95%+ coverage
- **API Endpoints**: 85%+ coverage
- **Error Handlers**: 100% coverage

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

```typescript
// Increase timeout for specific test
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout

// Or globally in jest.config.js
module.exports = {
  testTimeout: 10000,
};
```

#### 2. Act Warnings

```typescript
// Wrap state updates in act
import { act } from '@testing-library/react';

await act(async () => {
  fireEvent.click(button);
});
```

#### 3. Memory Leaks in Tests

```typescript
// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
```

#### 4. Flaky Tests

- **Add proper waits** for async operations
- **Mock time-dependent functions**
- **Avoid test interdependencies**
- **Use deterministic data**

### Debugging Tests

```typescript
// Add debug output
screen.debug(); // Shows current DOM

// Log queries
screen.logTestingPlaygroundURL(); // Testing Playground URL

// Use data-testid for complex queries
<div data-testid="complex-component">Content</div>
screen.getByTestId('complex-component');
```

### Performance Debugging

```typescript
// Profile test performance
console.time('test-performance');
render(<Component />);
console.timeEnd('test-performance');

// Monitor memory usage
console.log('Memory:', process.memoryUsage());
```

## Contributing to Tests

### Adding New Tests

1. **Choose appropriate test type** (unit/integration/performance)
2. **Follow naming conventions** (`ComponentName.test.tsx`)
3. **Include comprehensive test cases**
4. **Add documentation** for complex test scenarios
5. **Ensure tests are reliable** and not flaky

### Test Review Checklist

- [ ] Tests are focused and test one thing
- [ ] Test names are descriptive
- [ ] Proper setup and cleanup
- [ ] Appropriate assertions
- [ ] Error cases covered
- [ ] Performance considerations
- [ ] Accessibility tested
- [ ] Documentation updated

---

## Conclusion

This testing guide provides a comprehensive framework for maintaining high-quality, reliable tests in the Astral Money application. By following these patterns and best practices, we ensure that our application remains stable, performant, and maintainable as it scales.

For questions or contributions to this guide, please refer to the development team or create an issue in the project repository.
