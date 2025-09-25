/**
 * Bills Section Component
 * Displays and manages recurring bills with full CRUD functionality
 */

import { useState } from 'react';
import { RecurringBill } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface BillsSectionProps {
  bills: RecurringBill[];
  loading?: boolean;
  onAdd: (bill: Omit<RecurringBill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<RecurringBill>) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

interface BillFormData {
  name: string;
  amount: string;
  category: string;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'yearly';
  startDate: string;
  notes?: string;
}

export function BillsSection({ bills, loading = false, onAdd, onUpdate, onDelete, compact = false }: BillsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [formData, setFormData] = useState<BillFormData>({
    name: '',
    amount: '',
    category: 'utilities',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const activeBills = bills.filter(bill => bill.isActive !== false);
  const upcomingBills = activeBills.slice(0, 5); // Show next 5 bills

  const getNextDueDate = (bill: RecurringBill) => {
    const today = new Date();
    const startDate = new Date(bill.startDate);
    
    // Simple calculation for next due date
    if (bill.frequency === 'monthly') {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, startDate.getDate());
      return nextMonth;
    } else if (bill.frequency === 'weekly') {
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return nextWeek;
    } else if (bill.frequency === 'biweekly') {
      const nextBiweek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      return nextBiweek;
    } else if (bill.frequency === 'quarterly') {
      const nextQuarter = new Date(today.getFullYear(), today.getMonth() + 3, startDate.getDate());
      return nextQuarter;
    } else if (bill.frequency === 'yearly') {
      const nextYear = new Date(today.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      return nextYear;
    }
    
    return startDate;
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const billData: Omit<RecurringBill, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      baseAmount: parseFloat(formData.amount),
      category: formData.category,
      frequency: formData.frequency,
      startDate: new Date(formData.startDate),
      isActive: true,
      notes: formData.notes || null,
      provider: null,
      endDate: null,
      isVariableAmount: false,
      averageAmount: parseFloat(formData.amount),
      minAmount: parseFloat(formData.amount),
      maxAmount: parseFloat(formData.amount),
      lastBillAmount: parseFloat(formData.amount),
      billHistory: [] as any[],
      estimationMethod: 'base',
      billType: 'expense'
    };

    if (editingBill) {
      onUpdate(editingBill, billData);
      setEditingBill(null);
    } else {
      onAdd(billData);
    }

    // Reset form
    setFormData({
      name: '',
      amount: '',
      category: 'utilities',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (bill: RecurringBill) => {
    setEditingBill(bill.id);
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      category: bill.category,
      frequency: bill.frequency as any,
      startDate: new Date(bill.startDate).toISOString().split('T')[0],
      notes: bill.notes || ''
    });
    setShowAddForm(true);
  };

  const handleMarkPaid = (bill: RecurringBill) => {
    onUpdate(bill.id, {
      lastBillAmount: bill.amount
    });
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      </section>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <div className="w-5 h-5 mr-2 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            Upcoming Bills
          </h3>
        </div>
        
        <div className="space-y-2">
          {activeBills.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No upcoming bills</p>
            </div>
          ) : (
            activeBills.slice(0, 3).map((bill) => {
              const dueDate = getNextDueDate(bill);
              const daysUntil = getDaysUntilDue(dueDate);
              const isOverdue = daysUntil < 0;
              const isDueSoon = daysUntil <= 3 && daysUntil >= 0;
              
              return (
                <div key={bill.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                      isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {isOverdue ? '!' : isDueSoon ? daysUntil : '✓'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">{bill.name}</p>
                      <p className="text-xs text-gray-500">{bill.frequency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(bill.amount)}</p>
                    <p className={`text-xs ${
                      isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {isOverdue 
                        ? `${Math.abs(daysUntil)}d overdue`
                        : daysUntil === 0 
                        ? 'Due today'
                        : `${daysUntil}d left`
                      }
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {bills.length > 3 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all ({bills.length})
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Recurring Bills
        </h2>
        
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Bill
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Netflix"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="housing">Housing</option>
                <option value="utilities">Utilities</option>
                <option value="insurance">Insurance</option>
                <option value="entertainment">Entertainment</option>
                <option value="software">Software</option>
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
                <option value="health">Health</option>
                <option value="debt">Debt</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingBill(null);
                setFormData({
                  name: '',
                  amount: '',
                  category: 'utilities',
                  frequency: 'monthly',
                  startDate: new Date().toISOString().split('T')[0],
                  notes: ''
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingBill ? 'Update Bill' : 'Add Bill'}
            </button>
          </div>
        </form>
      )}

      {activeBills.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <p>No recurring bills set up</p>
          <p className="text-sm mt-1">Add your bills to track upcoming payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingBills.map((bill) => {
            const dueDate = getNextDueDate(bill);
            const daysUntil = getDaysUntilDue(dueDate);
            const isOverdue = daysUntil < 0;
            const isDueSoon = daysUntil <= 7 && daysUntil >= 0;
            
            return (
              <div
                key={bill.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isOverdue 
                    ? 'bg-red-50 border-red-200' 
                    : isDueSoon 
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Bill Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isOverdue 
                        ? 'bg-red-100 text-red-600' 
                        : isDueSoon 
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">{bill.name}</h3>
                      <p className="text-sm text-gray-600">
                        {bill.category} • {bill.frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className={`text-sm ${
                      isOverdue 
                        ? 'text-red-600' 
                        : isDueSoon 
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}>
                      {isOverdue 
                        ? `${Math.abs(daysUntil)} days overdue`
                        : daysUntil === 0 
                        ? 'Due today'
                        : daysUntil === 1
                        ? 'Due tomorrow'
                        : `Due in ${daysUntil} days`
                      }
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isOverdue 
                      ? 'bg-red-100 text-red-800' 
                      : isDueSoon 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isOverdue ? '⚠️ Overdue' : isDueSoon ? '⏰ Due Soon' : '✅ On Track'}
                  </span>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleMarkPaid(bill)}
                      className="text-green-600 hover:text-green-700 text-xs font-medium transition-colors"
                    >
                      Mark Paid
                    </button>
                    <button 
                      onClick={() => handleEdit(bill)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${bill.name}"?`)) {
                          onDelete(bill.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Total */}
      {activeBills.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Total Monthly Bills
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(
                activeBills
                  .filter(bill => bill.frequency === 'monthly')
                  .reduce((total, bill) => total + bill.amount, 0)
              )}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-gray-600">
              All Bills (Normalized Monthly)
            </span>
            <span className="text-lg font-semibold text-blue-600">
              {formatCurrency(
                activeBills.reduce((total, bill) => {
                  // Normalize to monthly
                  let monthlyAmount = bill.amount;
                  if (bill.frequency === 'weekly') monthlyAmount *= 4.33;
                  else if (bill.frequency === 'biweekly') monthlyAmount *= 2.17;
                  else if (bill.frequency === 'quarterly') monthlyAmount /= 3;
                  else if (bill.frequency === 'yearly') monthlyAmount /= 12;
                  return total + monthlyAmount;
                }, 0)
              )}
            </span>
          </div>
        </div>
      )}

      {bills.length > upcomingBills.length && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all bills ({bills.length})
          </button>
        </div>
      )}
    </section>
  );
}