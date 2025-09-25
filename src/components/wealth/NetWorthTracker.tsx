/**
 * Net Worth Tracker Component
 * Tracks assets and liabilities to calculate net worth over time
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, LineChart, BarChart } from '@/components/charts/SimpleCharts';

interface Asset {
  id: string;
  name: string;
  value: number;
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'other';
  lastUpdated: Date;
}

interface Liability {
  id: string;
  name: string;
  balance: number;
  type: 'mortgage' | 'student_loan' | 'credit_card' | 'auto_loan' | 'other';
  interestRate?: number;
  minimumPayment?: number;
  lastUpdated: Date;
}

interface NetWorthEntry {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

const ASSET_TYPES = {
  cash: { icon: '💵', label: 'Cash & Savings', color: '#10B981' },
  investment: { icon: '📈', label: 'Investments', color: '#3B82F6' },
  property: { icon: '🏠', label: 'Real Estate', color: '#8B5CF6' },
  vehicle: { icon: '🚗', label: 'Vehicles', color: '#F59E0B' },
  other: { icon: '📦', label: 'Other Assets', color: '#6B7280' }
};

const LIABILITY_TYPES = {
  mortgage: { icon: '🏠', label: 'Mortgage', color: '#EF4444' },
  student_loan: { icon: '🎓', label: 'Student Loans', color: '#F59E0B' },
  credit_card: { icon: '💳', label: 'Credit Cards', color: '#DC2626' },
  auto_loan: { icon: '🚗', label: 'Auto Loans', color: '#F97316' },
  other: { icon: '📋', label: 'Other Debts', color: '#6B7280' }
};

export function NetWorthTracker() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities' | 'history'>('assets');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedAssets = localStorage.getItem('astral-money-assets');
    const savedLiabilities = localStorage.getItem('astral-money-liabilities');
    const savedHistory = localStorage.getItem('astral-money-networth-history');

    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    }
    if (savedLiabilities) {
      setLiabilities(JSON.parse(savedLiabilities));
    }
    if (savedHistory) {
      setNetWorthHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save data to localStorage
  const saveData = (newAssets: Asset[], newLiabilities: Liability[]) => {
    localStorage.setItem('astral-money-assets', JSON.stringify(newAssets));
    localStorage.setItem('astral-money-liabilities', JSON.stringify(newLiabilities));
  };

  // Calculate totals
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    name: '',
    value: 0,
    type: 'cash' as keyof typeof ASSET_TYPES
  });

  // Liability form state
  const [liabilityForm, setLiabilityForm] = useState({
    name: '',
    balance: 0,
    type: 'credit_card' as keyof typeof LIABILITY_TYPES,
    interestRate: 0,
    minimumPayment: 0
  });

  // Add asset
  const addAsset = () => {
    if (!assetForm.name || assetForm.value <= 0) return;

    const newAsset: Asset = {
      id: Date.now().toString(),
      name: assetForm.name,
      value: assetForm.value,
      type: assetForm.type,
      lastUpdated: new Date()
    };

    const newAssets = [...assets, newAsset];
    setAssets(newAssets);
    saveData(newAssets, liabilities);
    updateNetWorthHistory(newAssets, liabilities);

    setAssetForm({ name: '', value: 0, type: 'cash' });
    setShowAddAsset(false);
  };

  // Add liability
  const addLiability = () => {
    if (!liabilityForm.name || liabilityForm.balance <= 0) return;

    const newLiability: Liability = {
      id: Date.now().toString(),
      name: liabilityForm.name,
      balance: liabilityForm.balance,
      type: liabilityForm.type,
      interestRate: liabilityForm.interestRate || undefined,
      minimumPayment: liabilityForm.minimumPayment || undefined,
      lastUpdated: new Date()
    };

    const newLiabilities = [...liabilities, newLiability];
    setLiabilities(newLiabilities);
    saveData(assets, newLiabilities);
    updateNetWorthHistory(assets, newLiabilities);

    setLiabilityForm({ name: '', balance: 0, type: 'credit_card', interestRate: 0, minimumPayment: 0 });
    setShowAddLiability(false);
  };

  // Update net worth history
  const updateNetWorthHistory = (currentAssets: Asset[], currentLiabilities: Liability[]) => {
    const today = new Date().toISOString().split('T')[0];
    const totalAssets = currentAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = currentLiabilities.reduce((sum, liability) => sum + liability.balance, 0);
    const netWorth = totalAssets - totalLiabilities;

    const newEntry: NetWorthEntry = {
      date: today,
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth
    };

    const updatedHistory = [...netWorthHistory.filter(entry => entry.date !== today), newEntry]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12); // Keep last 12 entries

    setNetWorthHistory(updatedHistory);
    localStorage.setItem('astral-money-networth-history', JSON.stringify(updatedHistory));
  };

  // Delete asset
  const deleteAsset = (id: string) => {
    const newAssets = assets.filter(asset => asset.id !== id);
    setAssets(newAssets);
    saveData(newAssets, liabilities);
    updateNetWorthHistory(newAssets, liabilities);
  };

  // Delete liability
  const deleteLiability = (id: string) => {
    const newLiabilities = liabilities.filter(liability => liability.id !== id);
    setLiabilities(newLiabilities);
    saveData(assets, newLiabilities);
    updateNetWorthHistory(assets, newLiabilities);
  };

  // Asset breakdown for pie chart
  const assetBreakdown = useMemo(() => {
    const breakdown = assets.reduce((acc, asset) => {
      const type = ASSET_TYPES[asset.type];
      acc[asset.type] = (acc[asset.type] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([type, value]) => ({
      label: ASSET_TYPES[type as keyof typeof ASSET_TYPES].label,
      value,
      color: ASSET_TYPES[type as keyof typeof ASSET_TYPES].color
    }));
  }, [assets]);

  // Liability breakdown for pie chart
  const liabilityBreakdown = useMemo(() => {
    const breakdown = liabilities.reduce((acc, liability) => {
      const type = LIABILITY_TYPES[liability.type];
      acc[liability.type] = (acc[liability.type] || 0) + liability.balance;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([type, value]) => ({
      label: LIABILITY_TYPES[type as keyof typeof LIABILITY_TYPES].label,
      value,
      color: LIABILITY_TYPES[type as keyof typeof LIABILITY_TYPES].color
    }));
  }, [liabilities]);

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Net Worth Tracker
        </h2>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Total Assets</h3>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAssets)}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Total Liabilities</h3>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(totalLiabilities)}</p>
        </div>
        
        <div className={`border rounded-lg p-4 ${netWorth >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <h3 className={`text-sm font-medium mb-2 ${netWorth >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            Net Worth
          </h3>
          <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {formatCurrency(netWorth)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['assets', 'liabilities', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Assets</h3>
            <button
              onClick={() => setShowAddAsset(!showAddAsset)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add Asset
            </button>
          </div>

          {/* Add Asset Form */}
          {showAddAsset && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Asset name"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Value"
                  min="0"
                  step="0.01"
                  value={assetForm.value || ''}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border rounded-md"
                />
                <select
                  value={assetForm.type}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="px-3 py-2 border rounded-md"
                >
                  {Object.entries(ASSET_TYPES).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex space-x-2">
                <button onClick={addAsset} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm">
                  Add
                </button>
                <button 
                  onClick={() => setShowAddAsset(false)} 
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset List */}
            <div>
              {assets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No assets added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => {
                    const config = ASSET_TYPES[asset.type];
                    return (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{config.icon}</span>
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-gray-500">{config.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{formatCurrency(asset.value)}</span>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Asset Breakdown Chart */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Asset Breakdown</h4>
              {assetBreakdown.length > 0 ? (
                <PieChart data={assetBreakdown} size={200} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Add assets to see breakdown</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Liabilities Tab */}
      {activeTab === 'liabilities' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Liabilities</h3>
            <button
              onClick={() => setShowAddLiability(!showAddLiability)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add Liability
            </button>
          </div>

          {/* Add Liability Form */}
          {showAddLiability && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Debt name"
                  value={liabilityForm.name}
                  onChange={(e) => setLiabilityForm(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Balance"
                  min="0"
                  step="0.01"
                  value={liabilityForm.balance || ''}
                  onChange={(e) => setLiabilityForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border rounded-md"
                />
                <select
                  value={liabilityForm.type}
                  onChange={(e) => setLiabilityForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="px-3 py-2 border rounded-md"
                >
                  {Object.entries(LIABILITY_TYPES).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Interest Rate %"
                  min="0"
                  step="0.01"
                  value={liabilityForm.interestRate || ''}
                  onChange={(e) => setLiabilityForm(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Min Payment"
                  min="0"
                  step="0.01"
                  value={liabilityForm.minimumPayment || ''}
                  onChange={(e) => setLiabilityForm(prev => ({ ...prev, minimumPayment: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mt-4 flex space-x-2">
                <button onClick={addLiability} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                  Add
                </button>
                <button 
                  onClick={() => setShowAddLiability(false)} 
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liability List */}
            <div>
              {liabilities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No liabilities added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liabilities.map((liability) => {
                    const config = LIABILITY_TYPES[liability.type];
                    return (
                      <div key={liability.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{config.icon}</span>
                          <div>
                            <p className="font-medium">{liability.name}</p>
                            <p className="text-sm text-gray-500">{config.label}</p>
                            {liability.interestRate && (
                              <p className="text-xs text-orange-600">{liability.interestRate}% APR</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <span className="font-semibold text-red-600">{formatCurrency(liability.balance)}</span>
                            {liability.minimumPayment && (
                              <p className="text-xs text-gray-500">Min: {formatCurrency(liability.minimumPayment)}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteLiability(liability.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Liability Breakdown Chart */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Debt Breakdown</h4>
              {liabilityBreakdown.length > 0 ? (
                <PieChart data={liabilityBreakdown} size={200} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Add liabilities to see breakdown</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Net Worth History</h3>
          {netWorthHistory.length > 0 ? (
            <div>
              <LineChart 
                data={netWorthHistory.map(entry => ({
                  date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: entry.netWorth
                }))}
                height={300}
                color={netWorth >= 0 ? '#10B981' : '#EF4444'}
              />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {netWorthHistory.slice(-3).map((entry, index) => (
                  <div key={entry.date} className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                    <p className={`font-semibold ${entry.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(entry.netWorth)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No history data yet</p>
              <p className="text-sm mt-1">Add assets and liabilities to start tracking</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}