import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components for testing
const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div 
      data-testid="loading-spinner" 
      style={{ 
        width: sizeMap[size], 
        height: sizeMap[size],
        border: '2px solid #f3f3f3',
        borderTop: '2px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
      aria-label="Loading..."
    />
  );
};

const Toast = ({ 
  message, 
  type = 'info', 
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}) => {
  const typeColors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };

  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      data-testid={`toast-${type}`}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: typeColors[type],
        color: 'white',
        borderRadius: '4px',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}
    >
      <span>{message}</span>
      <button 
        data-testid="toast-close"
        onClick={onClose}
        style={{
          marginLeft: '10px',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
    </div>
  );
};

const FinancialHealthScore = ({ score, recommendations }: { score: number; recommendations: string[] }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#ff9800';
    if (score >= 40) return '#ff5722';
    return '#f44336';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Critical';
  };

  return (
    <div data-testid="financial-health-score">
      <div data-testid="health-score" style={{ color: getHealthColor(score) }}>
        {score}/100 - {getHealthLabel(score)}
      </div>
      <div data-testid="health-recommendations">
        {recommendations.map((rec, index) => (
          <div key={index} data-testid={`recommendation-${index}`}>
            {rec}
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchFilter = ({ 
  onSearch, 
  onFilterChange 
}: { 
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    type: 'all'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div data-testid="search-filter">
      <form onSubmit={handleSearch} data-testid="search-form">
        <input
          data-testid="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions..."
        />
        <button type="submit" data-testid="search-button">
          Search
        </button>
      </form>

      <div data-testid="filters">
        <select 
          data-testid="category-filter"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="entertainment">Entertainment</option>
        </select>

        <input
          data-testid="date-from-filter"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
        />

        <input
          data-testid="date-to-filter"
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
        />

        <input
          data-testid="amount-min-filter"
          type="number"
          placeholder="Min amount"
          value={filters.amountMin}
          onChange={(e) => handleFilterChange('amountMin', e.target.value)}
        />

        <input
          data-testid="amount-max-filter"
          type="number"
          placeholder="Max amount"
          value={filters.amountMax}
          onChange={(e) => handleFilterChange('amountMax', e.target.value)}
        />

        <select 
          data-testid="type-filter"
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
      </div>
    </div>
  );
};

describe('Component Tests', () => {
  describe('LoadingSpinner Component', () => {
    test('renders with default medium size', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByTestId('loading-spinner');
      
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveStyle({ width: '40px', height: '40px' });
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });

    test('renders with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      expect(screen.getByTestId('loading-spinner')).toHaveStyle({ width: '20px', height: '20px' });

      rerender(<LoadingSpinner size="large" />);
      expect(screen.getByTestId('loading-spinner')).toHaveStyle({ width: '60px', height: '60px' });
    });
  });

  describe('Toast Component', () => {
    test('renders toast with message', () => {
      const onClose = jest.fn();
      render(<Toast message="Test message" type="success" onClose={onClose} />);
      
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<Toast message="Test message" onClose={onClose} />);
      
      await user.click(screen.getByTestId('toast-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('auto-dismisses after 5 seconds', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      render(<Toast message="Test message" onClose={onClose} />);
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      expect(onClose).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    test('renders different toast types with correct colors', () => {
      const onClose = jest.fn();
      const { rerender } = render(<Toast message="Success" type="success" onClose={onClose} />);
      expect(screen.getByTestId('toast-success')).toHaveStyle({ backgroundColor: '#4CAF50' });

      rerender(<Toast message="Error" type="error" onClose={onClose} />);
      expect(screen.getByTestId('toast-error')).toHaveStyle({ backgroundColor: '#f44336' });

      rerender(<Toast message="Warning" type="warning" onClose={onClose} />);
      expect(screen.getByTestId('toast-warning')).toHaveStyle({ backgroundColor: '#ff9800' });

      rerender(<Toast message="Info" type="info" onClose={onClose} />);
      expect(screen.getByTestId('toast-info')).toHaveStyle({ backgroundColor: '#2196F3' });
    });
  });

  describe('FinancialHealthScore Component', () => {
    test('renders health score with excellent rating', () => {
      render(<FinancialHealthScore score={85} recommendations={['Keep up the good work!']} />);
      
      const scoreElement = screen.getByTestId('health-score');
      expect(scoreElement).toHaveTextContent('85/100 - Excellent');
      expect(scoreElement).toHaveStyle({ color: '#4CAF50' });
    });

    test('renders health score with critical rating', () => {
      render(<FinancialHealthScore score={25} recommendations={['Reduce expenses immediately']} />);
      
      const scoreElement = screen.getByTestId('health-score');
      expect(scoreElement).toHaveTextContent('25/100 - Critical');
      expect(scoreElement).toHaveStyle({ color: '#f44336' });
    });

    test('renders recommendations correctly', () => {
      const recommendations = ['Recommendation 1', 'Recommendation 2', 'Recommendation 3'];
      render(<FinancialHealthScore score={60} recommendations={recommendations} />);
      
      recommendations.forEach((rec, index) => {
        expect(screen.getByTestId(`recommendation-${index}`)).toHaveTextContent(rec);
      });
    });
  });

  describe('SearchFilter Component', () => {
    test('handles search input and submission', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();
      const onFilterChange = jest.fn();
      
      render(<SearchFilter onSearch={onSearch} onFilterChange={onFilterChange} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test query');
      expect(searchInput).toHaveValue('test query');
      
      await user.click(screen.getByTestId('search-button'));
      expect(onSearch).toHaveBeenCalledWith('test query');
    });

    test('handles filter changes', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();
      const onFilterChange = jest.fn();
      
      render(<SearchFilter onSearch={onSearch} onFilterChange={onFilterChange} />);
      
      // Test category filter
      await user.selectOptions(screen.getByTestId('category-filter'), 'food');
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'food' })
      );

      // Test date filters
      await user.type(screen.getByTestId('date-from-filter'), '2024-01-01');
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ dateFrom: '2024-01-01' })
      );

      // Test amount filters
      await user.type(screen.getByTestId('amount-min-filter'), '100');
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ amountMin: '100' })
      );

      // Test type filter
      await user.selectOptions(screen.getByTestId('type-filter'), 'expense');
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'expense' })
      );
    });

    test('renders all filter elements', () => {
      const onSearch = jest.fn();
      const onFilterChange = jest.fn();
      
      render(<SearchFilter onSearch={onSearch} onFilterChange={onFilterChange} />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
      expect(screen.getByTestId('date-from-filter')).toBeInTheDocument();
      expect(screen.getByTestId('date-to-filter')).toBeInTheDocument();
      expect(screen.getByTestId('amount-min-filter')).toBeInTheDocument();
      expect(screen.getByTestId('amount-max-filter')).toBeInTheDocument();
      expect(screen.getByTestId('type-filter')).toBeInTheDocument();
    });
  });
});