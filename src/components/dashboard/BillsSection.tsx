/**
 * Bills Section Component
 * Displays and manages recurring bills
 */

import { RecurringBill } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface BillsSectionProps {
  bills: RecurringBill[];
  onUpdate: (bills: RecurringBill[]) => void;
}

export function BillsSection({ bills, onUpdate }: BillsSectionProps) {
  const activeBills = bills.filter(bill => bill.isActive !== false);
  const upcomingBills = activeBills.slice(0, 5); // Show next 5 bills

  const getNextDueDate = (bill: RecurringBill) => {
    const today = new Date();
    const startDate = new Date(bill.startDate);
    
    // Simple calculation for next due date (could be more sophisticated)
    if (bill.frequency === 'monthly') {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, startDate.getDate());
      return nextMonth;
    }
    
    return startDate;
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Recurring Bills
        </h2>
        
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Bill
        </button>
      </div>

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
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      Mark Paid
                    </button>
                    <button className="text-gray-600 hover:text-gray-700 text-xs font-medium">
                      Edit
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
              {formatCurrency(activeBills.reduce((total, bill) => total + bill.amount, 0))}
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