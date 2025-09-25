/**
 * Data Export Component
 * Allows users to export their financial data in various formats
 */

'use client';

import { useState } from 'react';
import { Transaction, RecurringBill, FinancialGoal } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface DataExporterProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  goals: FinancialGoal[];
  balance: number;
}

type ExportFormat = 'csv' | 'json' | 'pdf';
type DataType = 'transactions' | 'bills' | 'goals' | 'all';

export function DataExporter({ transactions, bills, goals, balance }: DataExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dataType, setDataType] = useState<DataType>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [isExporting, setIsExporting] = useState(false);

  // Filter transactions by date range
  const getFilteredTransactions = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= fromDate && transactionDate <= toDate;
    });
  };

  // Convert data to CSV format
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '')];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  // Convert data to JSON format
  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  };

  // Generate PDF export (simplified HTML version)
  const exportToPDF = async (data: any, filename: string) => {
    const htmlContent = generateHTMLReport(data);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  // Generate HTML report for PDF
  const generateHTMLReport = (data: any) => {
    const reportDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Astral Money Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
          .summary { display: flex; justify-content: space-around; margin: 20px 0; }
          .summary-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .section { margin: 30px 0; }
          .section h2 { color: #3B82F6; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f8f9fa; font-weight: 600; }
          .amount { font-family: 'Courier New', monospace; text-align: right; }
          .expense { color: #EF4444; }
          .income { color: #10B981; }
          @media print { 
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 Astral Money Financial Report</h1>
          <p>Generated on ${reportDate}</p>
          <p>Period: ${formatDate(new Date(dateRange.from))} - ${formatDate(new Date(dateRange.to))}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>Current Balance</h3>
            <p class="amount">${formatCurrency(balance)}</p>
          </div>
          <div class="summary-item">
            <h3>Active Goals</h3>
            <p>${goals.filter(g => !g.isCompleted).length}</p>
          </div>
          <div class="summary-item">
            <h3>Monthly Bills</h3>
            <p>${bills.length}</p>
          </div>
        </div>

        ${dataType === 'transactions' || dataType === 'all' ? `
        <div class="section">
          <h2>📊 Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.map((t: Transaction) => `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td>${t.description}</td>
                  <td>${t.category || 'N/A'}</td>
                  <td>${t.type}</td>
                  <td class="amount ${t.type}">${formatCurrency(t.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${dataType === 'bills' || dataType === 'all' ? `
        <div class="section">
          <h2>🧾 Recurring Bills</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${data.bills.map((b: RecurringBill) => `
                <tr>
                  <td>${b.name}</td>
                  <td>${b.category}</td>
                  <td class="amount">${formatCurrency(b.amount)}</td>
                  <td>${b.frequency}</td>
                  <td>${b.billType}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${dataType === 'goals' || dataType === 'all' ? `
        <div class="section">
          <h2>🎯 Financial Goals</h2>
          <table>
            <thead>
              <tr>
                <th>Goal</th>
                <th>Category</th>
                <th>Current</th>
                <th>Target</th>
                <th>Progress</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              ${data.goals.map((g: FinancialGoal) => {
                const progress = ((g.currentAmount / g.targetAmount) * 100).toFixed(1);
                return `
                  <tr>
                    <td>${g.title}</td>
                    <td>${g.category}</td>
                    <td class="amount">${formatCurrency(g.currentAmount)}</td>
                    <td class="amount">${formatCurrency(g.targetAmount)}</td>
                    <td>${progress}%</td>
                    <td>${g.deadline ? formatDate(g.deadline) : 'No deadline'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; color: #6B7280; font-size: 12px;">
          <p>Exported from Astral Money - Personal Finance Tracker</p>
        </div>
      </body>
      </html>
    `;
  };

  // Download file helper
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredTransactions = getFilteredTransactions();
      const timestamp = new Date().toISOString().split('T')[0];
      
      let exportData: any = {};
      let filename = '';

      switch (dataType) {
        case 'transactions':
          exportData = { transactions: filteredTransactions };
          filename = `astral-money-transactions-${timestamp}`;
          break;
        case 'bills':
          exportData = { bills };
          filename = `astral-money-bills-${timestamp}`;
          break;
        case 'goals':
          exportData = { goals };
          filename = `astral-money-goals-${timestamp}`;
          break;
        case 'all':
          exportData = {
            summary: {
              balance,
              exportDate: new Date().toISOString(),
              dateRange: dateRange
            },
            transactions: filteredTransactions,
            bills,
            goals
          };
          filename = `astral-money-full-export-${timestamp}`;
          break;
      }

      switch (exportFormat) {
        case 'csv':
          if (dataType === 'transactions') {
            exportToCSV(filteredTransactions, filename, [
              'Date', 'Description', 'Category', 'Type', 'Amount'
            ]);
          } else if (dataType === 'bills') {
            exportToCSV(bills, filename, [
              'Name', 'Category', 'Amount', 'Frequency', 'Bill Type'
            ]);
          } else if (dataType === 'goals') {
            exportToCSV(goals, filename, [
              'Title', 'Category', 'Current Amount', 'Target Amount', 'Deadline', 'Completed'
            ]);
          } else {
            // Export all as separate CSV files in a zip would be ideal, but for simplicity, export as JSON
            exportToJSON(exportData, filename);
          }
          break;
        case 'json':
          exportToJSON(exportData, filename);
          break;
        case 'pdf':
          await exportToPDF(exportData, filename);
          break;
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span>Export Data</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Export Financial Data</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Data Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What to export
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as DataType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Data</option>
                  <option value="transactions">Transactions Only</option>
                  <option value="bills">Recurring Bills Only</option>
                  <option value="goals">Financial Goals Only</option>
                </select>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['csv', 'json', 'pdf'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setExportFormat(format)}
                      className={`px-3 py-2 text-sm font-medium rounded-md border ${
                        exportFormat === format
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range for Transactions */}
              {(dataType === 'transactions' || dataType === 'all') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range (for transactions)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Export Summary */}
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">Export Summary:</h4>
                <ul className="space-y-1">
                  {dataType === 'all' || dataType === 'transactions' ? (
                    <li>• {getFilteredTransactions().length} transactions</li>
                  ) : null}
                  {dataType === 'all' || dataType === 'bills' ? (
                    <li>• {bills.length} recurring bills</li>
                  ) : null}
                  {dataType === 'all' || dataType === 'goals' ? (
                    <li>• {goals.length} financial goals</li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}