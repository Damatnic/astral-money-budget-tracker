'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState('october');
  const [userBalance, setUserBalance] = useState(11.29);
  const [bills, setBills] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [state, setState] = useState({
    startBalance: 11.29,
    paycheckAmount: 2143.73,
    paycheckFreq: 'biweekly',
    currency: 'USD',
    currentMonth: 'october',
    checkedBills: new Set(),
    totalIncome: 6431.92,
    totalExpenses: 9421.00,
    netFlow: -2989.08,
    healthScore: 25,
  });

  useEffect(() => {
    fetchUserData();
    updateKPIs();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/balance');
      const data = await response.json();
      if (data.balance) {
        setUserBalance(data.balance);
        setState(prev => ({ ...prev, startBalance: data.balance }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const updateKPIs = () => {
    setState(prev => ({
      ...prev,
      netFlow: prev.totalIncome - prev.totalExpenses,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const showSection = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  const expandHellWeek = () => {
    const expandedSection = document.getElementById('hellWeekExpanded');
    const arrow = document.getElementById('hellWeekArrow');
    
    if (expandedSection && arrow) {
      if (expandedSection.style.display === 'none') {
        expandedSection.style.display = 'block';
        arrow.textContent = '▲';
      } else {
        expandedSection.style.display = 'none';
        arrow.textContent = '▼';
      }
    }
  };

  const handleBillCheck = (billId: string, amount: number) => {
    setState(prev => {
      const newCheckedBills = new Set(prev.checkedBills);
      if (newCheckedBills.has(billId)) {
        newCheckedBills.delete(billId);
      } else {
        newCheckedBills.add(billId);
      }
      return { ...prev, checkedBills: newCheckedBills };
    });
  };

  // October Bills Data
  const octoberBills = [
    { id: '1', name: 'Rent', amount: 1850, date: 'Oct 1', category: 'housing', isPaid: false },
    { id: '2', name: 'Second Rent Payment', amount: 1850, date: 'Oct 1', category: 'housing', isPaid: false },
    { id: '3', name: 'Paycheck 1', amount: 2143.73, date: 'Oct 4', category: 'income', isIncome: true, isPaid: true },
    { id: '4', name: 'Student Loan', amount: 127, date: 'Oct 5', category: 'debt', isPaid: false },
    { id: '5', name: 'Electric Bill', amount: 156, date: 'Oct 7', category: 'utilities', isPaid: false },
    { id: '6', name: 'GitHub', amount: 43, date: 'Oct 8', category: 'software', isPaid: false },
    { id: '7', name: 'Adobe Creative Suite', amount: 52.99, date: 'Oct 9', category: 'software', isPaid: false },
    { id: '8', name: 'Netflix', amount: 15.49, date: 'Oct 10', category: 'entertainment', isPaid: false },
    { id: '9', name: 'Spotify Premium', amount: 10.99, date: 'Oct 11', category: 'entertainment', isPaid: false },
    { id: '10', name: 'Car Insurance', amount: 289, date: 'Oct 12', category: 'insurance', isPaid: false },
    { id: '11', name: 'Phone Bill', amount: 85, date: 'Oct 13', category: 'utilities', isPaid: false },
    { id: '12', name: 'Gym Membership', amount: 39.99, date: 'Oct 14', category: 'health', isPaid: false },
    { id: '13', name: 'Internet', amount: 79.99, date: 'Oct 15', category: 'utilities', isPaid: false },
    { id: '14', name: 'Groceries Budget', amount: 250, date: 'Oct 15', category: 'food', isPaid: false },
    { id: '15', name: 'Paycheck 2', amount: 2143.73, date: 'Oct 18', category: 'income', isIncome: true, isPaid: false },
    { id: '16', name: 'Gas Bill', amount: 89, date: 'Oct 20', category: 'utilities', isPaid: false },
    { id: '17', name: 'Water Bill', amount: 67, date: 'Oct 22', category: 'utilities', isPaid: false },
    { id: '18', name: 'Credit Card Payment', amount: 250, date: 'Oct 25', category: 'debt', isPaid: false },
    { id: '19', name: 'Amazon Prime', amount: 14.98, date: 'Oct 28', category: 'entertainment', isPaid: false },
    { id: '20', name: 'Savings Transfer', amount: 500, date: 'Oct 30', category: 'savings', isPaid: false },
    { id: '21', name: 'Paycheck 3', amount: 2144.46, date: 'Oct 31', category: 'income', isIncome: true, isPaid: false },
  ];

  // November Bills Data
  const novemberBills = [
    { id: 'n1', name: 'Rent', amount: 1850, date: 'Nov 1', category: 'housing', isPaid: false },
    { id: 'n2', name: 'Paycheck 1', amount: 2143.73, date: 'Nov 1', category: 'income', isIncome: true, isPaid: false },
    { id: 'n3', name: 'Student Loan', amount: 127, date: 'Nov 5', category: 'debt', isPaid: false },
    { id: 'n4', name: 'Electric Bill', amount: 156, date: 'Nov 7', category: 'utilities', isPaid: false },
    { id: 'n5', name: 'GitHub', amount: 43, date: 'Nov 8', category: 'software', isPaid: false },
    { id: 'n6', name: 'Adobe Creative Suite', amount: 52.99, date: 'Nov 9', category: 'software', isPaid: false },
    { id: 'n7', name: 'Netflix', amount: 15.49, date: 'Nov 10', category: 'entertainment', isPaid: false },
    { id: 'n8', name: 'Spotify Premium', amount: 10.99, date: 'Nov 11', category: 'entertainment', isPaid: false },
    { id: 'n9', name: 'Car Insurance', amount: 289, date: 'Nov 12', category: 'insurance', isPaid: false },
    { id: 'n10', name: 'Phone Bill', amount: 85, date: 'Nov 13', category: 'utilities', isPaid: false },
    { id: 'n11', name: 'Gym Membership', amount: 39.99, date: 'Nov 14', category: 'health', isPaid: false },
    { id: 'n12', name: 'Internet', amount: 79.99, date: 'Nov 15', category: 'utilities', isPaid: false },
    { id: 'n13', name: 'Groceries Budget', amount: 250, date: 'Nov 15', category: 'food', isPaid: false },
    { id: 'n14', name: 'Paycheck 2', amount: 2143.73, date: 'Nov 15', category: 'income', isIncome: true, isPaid: false },
    { id: 'n15', name: 'Gas Bill', amount: 89, date: 'Nov 20', category: 'utilities', isPaid: false },
    { id: 'n16', name: 'Water Bill', amount: 67, date: 'Nov 22', category: 'utilities', isPaid: false },
    { id: 'n17', name: 'Credit Card Payment', amount: 250, date: 'Nov 25', category: 'debt', isPaid: false },
    { id: 'n18', name: 'Amazon Prime', amount: 14.98, date: 'Nov 28', category: 'entertainment', isPaid: false },
    { id: 'n19', name: 'Paycheck 3', amount: 2143.73, date: 'Nov 29', category: 'income', isIncome: true, isPaid: false },
    { id: 'n20', name: 'Savings Transfer', amount: 500, date: 'Nov 30', category: 'savings', isPaid: false },
  ];

  // December Bills Data
  const decemberBills = [
    { id: 'd1', name: 'Rent', amount: 1850, date: 'Dec 1', category: 'housing', isPaid: false },
    { id: 'd2', name: 'Student Loan', amount: 127, date: 'Dec 5', category: 'debt', isPaid: false },
    { id: 'd3', name: 'Electric Bill', amount: 156, date: 'Dec 7', category: 'utilities', isPaid: false },
    { id: 'd4', name: 'GitHub', amount: 43, date: 'Dec 8', category: 'software', isPaid: false },
    { id: 'd5', name: 'Adobe Creative Suite', amount: 52.99, date: 'Dec 9', category: 'software', isPaid: false },
    { id: 'd6', name: 'Netflix', amount: 15.49, date: 'Dec 10', category: 'entertainment', isPaid: false },
    { id: 'd7', name: 'Spotify Premium', amount: 10.99, date: 'Dec 11', category: 'entertainment', isPaid: false },
    { id: 'd8', name: 'Car Insurance', amount: 289, date: 'Dec 12', category: 'insurance', isPaid: false },
    { id: 'd9', name: 'Phone Bill', amount: 85, date: 'Dec 13', category: 'utilities', isPaid: false },
    { id: 'd10', name: 'Paycheck 1', amount: 2143.73, date: 'Dec 13', category: 'income', isIncome: true, isPaid: false },
    { id: 'd11', name: 'Gym Membership', amount: 39.99, date: 'Dec 14', category: 'health', isPaid: false },
    { id: 'd12', name: 'Internet', amount: 79.99, date: 'Dec 15', category: 'utilities', isPaid: false },
    { id: 'd13', name: 'Groceries Budget', amount: 250, date: 'Dec 15', category: 'food', isPaid: false },
    { id: 'd14', name: 'Holiday Shopping', amount: 500, date: 'Dec 15', category: 'shopping', isPaid: false },
    { id: 'd15', name: 'Gas Bill', amount: 89, date: 'Dec 20', category: 'utilities', isPaid: false },
    { id: 'd16', name: 'Water Bill', amount: 67, date: 'Dec 22', category: 'utilities', isPaid: false },
    { id: 'd17', name: 'Credit Card Payment', amount: 250, date: 'Dec 25', category: 'debt', isPaid: false },
    { id: 'd18', name: 'Paycheck 2', amount: 2143.73, date: 'Dec 27', category: 'income', isIncome: true, isPaid: false },
    { id: 'd19', name: 'Amazon Prime', amount: 14.98, date: 'Dec 28', category: 'entertainment', isPaid: false },
    { id: 'd20', name: 'Year-End Savings', amount: 1000, date: 'Dec 31', category: 'savings', isPaid: false },
  ];

  const getCurrentMonthBills = () => {
    switch(currentMonth) {
      case 'october': return octoberBills;
      case 'november': return novemberBills;
      case 'december': return decemberBills;
      default: return octoberBills;
    }
  };

  return (
    <div className="app-container">
      {/* Enhanced Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span>🌟</span>
            <span>Astral Money</span>
          </div>
        </div>

        <nav>
          <ul className="nav-menu">
            <li className="nav-item">
              <a 
                href="#dashboard" 
                className={`nav-link ${currentSection === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('dashboard'); }}
              >
                <span className="nav-icon">📊</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#months" 
                className={`nav-link ${currentSection === 'months' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('months'); }}
              >
                <span className="nav-icon">📅</span>
                <span>Monthly View</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#analytics" 
                className={`nav-link ${currentSection === 'analytics' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('analytics'); }}
              >
                <span className="nav-icon">📈</span>
                <span>Analytics</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#goals" 
                className={`nav-link ${currentSection === 'goals' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('goals'); }}
              >
                <span className="nav-icon">🎯</span>
                <span>Goals & Targets</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#settings" 
                className={`nav-link ${currentSection === 'settings' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('settings'); }}
              >
                <span className="nav-icon">⚙️</span>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Financial Health Widget */}
        <div className="health-widget">
          <div className="health-header">
            <div className="health-title">Financial Health</div>
            <div className="health-score critical">{state.healthScore}</div>
          </div>
          <div className="health-bar">
            <div className="health-progress critical" style={{width: `${state.healthScore}%`}}></div>
          </div>
          <div className="health-status">
            <span className="status-dot critical"></span>
            <span>Critical - Action Needed</span>
          </div>
          <div className="health-tips">
            💡 Current balance critically low. Prioritize income sources.
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard Section */}
        {currentSection === 'dashboard' && (
          <section id="dashboard">
            <div className="section-header">
              <h1>💰 Financial Dashboard</h1>
              <div className="current-balance">
                Balance: <span id="currentBalance" className="negative">{formatCurrency(userBalance)}</span>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Total Income Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">Total Income (Oct)</div>
                  <div className="card-icon">💰</div>
                </div>
                <div className="card-value positive">{formatCurrency(state.totalIncome)}</div>
                <div className="progress-container">
                  <div className="progress-bar success" style={{width: '85%'}}></div>
                </div>
                <div className="card-trend">
                  <span>📈</span>
                  <span>3 Paychecks this month</span>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">Total Expenses Remaining</div>
                  <div className="card-icon">💸</div>
                </div>
                <div className="card-value negative">{formatCurrency(state.totalExpenses)}</div>
                <div className="progress-container">
                  <div className="progress-bar danger" style={{width: '65%'}}></div>
                </div>
                <div className="card-trend clickable" onClick={expandHellWeek} style={{cursor: 'pointer'}}>
                  <span>⚠️</span>
                  <span>Hell Week: Oct 8-15 ($870 in bills) - Click to view</span>
                  <span id="hellWeekArrow" style={{marginLeft: '8px'}}>▼</span>
                </div>
                <div id="hellWeekExpanded" style={{display: 'none', marginTop: '16px', padding: '16px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px'}}>
                  <div style={{fontWeight: '600', marginBottom: '12px', color: 'var(--warning)'}}>⚠️ Heavy Bill Period (Oct 8-15)</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 8 - GitHub</span>
                      <span style={{color: 'var(--danger)'}}>$43</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 9 - Adobe Creative Suite</span>
                      <span style={{color: 'var(--danger)'}}>$52.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 10 - Netflix</span>
                      <span style={{color: 'var(--danger)'}}>$15.49</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 11 - Spotify Premium</span>
                      <span style={{color: 'var(--danger)'}}>$10.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 12 - Car Insurance</span>
                      <span style={{color: 'var(--danger)'}}>$289</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 13 - Phone Bill</span>
                      <span style={{color: 'var(--danger)'}}>$85</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 14 - Gym Membership</span>
                      <span style={{color: 'var(--danger)'}}>$39.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 15 - Internet</span>
                      <span style={{color: 'var(--danger)'}}>$79.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 15 - Groceries Budget</span>
                      <span style={{color: 'var(--danger)'}}>$250</span>
                    </div>
                  </div>
                  <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)', fontWeight: '600'}}>
                    Total Hell Week Bills: <span style={{color: 'var(--danger)'}}>$870.45</span>
                  </div>
                </div>
              </div>

              {/* Net Cash Flow Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">Net Cash Flow</div>
                  <div className="card-icon">📈</div>
                </div>
                <div className="card-value negative">{formatCurrency(state.netFlow)}</div>
                <div className="progress-container">
                  <div className="progress-bar danger" style={{width: '25%'}}></div>
                </div>
                <div className="card-trend">
                  <span>📉</span>
                  <span>Deficit this month</span>
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="overview-card">
              <div className="section-title">⚠️ Critical Alerts</div>
              <div style={{padding: '16px 0'}}>
                <div style={{color: 'var(--danger)', marginBottom: '12px', fontWeight: '600'}}>
                  🚨 Double rent payment due Oct 1st ($3,700)
                </div>
                <div style={{color: 'var(--warning)', marginBottom: '12px'}}>
                  ⚠️ Heavy bill period Oct 8-15 ($870 in bills)
                </div>
                <div style={{color: 'var(--success)'}}>
                  ✅ 3 Paychecks this month ($6,431 total)
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Monthly View Section */}
        {currentSection === 'months' && (
          <section id="months">
            <div className="section-header">
              <h1>📅 Monthly Bills & Income</h1>
              <div className="month-selector">
                <button 
                  className={`month-btn ${currentMonth === 'october' ? 'active' : ''}`}
                  onClick={() => setCurrentMonth('october')}
                >
                  October
                </button>
                <button 
                  className={`month-btn ${currentMonth === 'november' ? 'active' : ''}`}
                  onClick={() => setCurrentMonth('november')}
                >
                  November
                </button>
                <button 
                  className={`month-btn ${currentMonth === 'december' ? 'active' : ''}`}
                  onClick={() => setCurrentMonth('december')}
                >
                  December
                </button>
              </div>
            </div>

            <div className="month-stats">
              <div className="stat-card">
                <span className="stat-label">Income</span>
                <span className="stat-value positive">
                  {formatCurrency(
                    getCurrentMonthBills()
                      .filter(b => b.isIncome)
                      .reduce((sum, b) => sum + b.amount, 0)
                  )}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Expenses</span>
                <span className="stat-value negative">
                  {formatCurrency(
                    getCurrentMonthBills()
                      .filter(b => !b.isIncome)
                      .reduce((sum, b) => sum + b.amount, 0)
                  )}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Net</span>
                <span className={`stat-value ${
                  getCurrentMonthBills().filter(b => b.isIncome).reduce((sum, b) => sum + b.amount, 0) -
                  getCurrentMonthBills().filter(b => !b.isIncome).reduce((sum, b) => sum + b.amount, 0) > 0
                    ? 'positive' : 'negative'
                }`}>
                  {formatCurrency(
                    getCurrentMonthBills().filter(b => b.isIncome).reduce((sum, b) => sum + b.amount, 0) -
                    getCurrentMonthBills().filter(b => !b.isIncome).reduce((sum, b) => sum + b.amount, 0)
                  )}
                </span>
              </div>
            </div>

            <div className="bills-list">
              {getCurrentMonthBills().map(bill => (
                <div key={bill.id} className="bill-row">
                  <input
                    type="checkbox"
                    checked={state.checkedBills.has(bill.id)}
                    onChange={() => handleBillCheck(bill.id, bill.amount)}
                    className="bill-checkbox"
                  />
                  <span className="bill-date">{bill.date}</span>
                  <span className="bill-name">{bill.name}</span>
                  <span className="bill-category">{bill.category}</span>
                  <span className={`bill-amount ${bill.isIncome ? 'income' : 'expense'}`}>
                    {bill.isIncome ? '+' : '-'}{formatCurrency(bill.amount)}
                  </span>
                  <span className={`bill-status ${bill.isPaid ? 'paid' : 'pending'}`}>
                    {bill.isPaid ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Analytics Section */}
        {currentSection === 'analytics' && (
          <section id="analytics">
            <div className="section-header">
              <h1>📈 Financial Analytics</h1>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📊 Spending by Category</h3>
                <div className="category-breakdown">
                  <div className="category-item">
                    <span className="category-name">🏠 Housing</span>
                    <div className="category-bar">
                      <div className="bar-fill" style={{width: '40%', background: 'var(--danger)'}}></div>
                    </div>
                    <span className="category-amount">$3,700</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">🚗 Insurance</span>
                    <div className="category-bar">
                      <div className="bar-fill" style={{width: '15%', background: 'var(--warning)'}}></div>
                    </div>
                    <span className="category-amount">$289</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">⚡ Utilities</span>
                    <div className="category-bar">
                      <div className="bar-fill" style={{width: '25%', background: 'var(--primary)'}}></div>
                    </div>
                    <span className="category-amount">$547</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">🍔 Food</span>
                    <div className="category-bar">
                      <div className="bar-fill" style={{width: '12%', background: 'var(--success)'}}></div>
                    </div>
                    <span className="category-amount">$250</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">🎬 Entertainment</span>
                    <div className="category-bar">
                      <div className="bar-fill" style={{width: '8%', background: 'var(--secondary)'}}></div>
                    </div>
                    <span className="category-amount">$169</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>💰 Income vs Expenses Trend</h3>
                <div className="trend-chart">
                  <div className="trend-month">
                    <span className="month-label">Oct</span>
                    <div className="month-bars">
                      <div className="income-bar" style={{height: '60%'}}></div>
                      <div className="expense-bar" style={{height: '90%'}}></div>
                    </div>
                  </div>
                  <div className="trend-month">
                    <span className="month-label">Nov</span>
                    <div className="month-bars">
                      <div className="income-bar" style={{height: '60%'}}></div>
                      <div className="expense-bar" style={{height: '50%'}}></div>
                    </div>
                  </div>
                  <div className="trend-month">
                    <span className="month-label">Dec</span>
                    <div className="month-bars">
                      <div className="income-bar" style={{height: '40%'}}></div>
                      <div className="expense-bar" style={{height: '55%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="trend-legend">
                  <span className="legend-item">
                    <span className="legend-color income"></span> Income
                  </span>
                  <span className="legend-item">
                    <span className="legend-color expense"></span> Expenses
                  </span>
                </div>
              </div>

              <div className="analytics-card">
                <h3>🎯 Budget Performance</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-label">Budget Utilization</span>
                    <div className="metric-value">146%</div>
                    <div className="metric-status danger">Over Budget</div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Savings Rate</span>
                    <div className="metric-value">-46%</div>
                    <div className="metric-status danger">Negative</div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Bill Payment Rate</span>
                    <div className="metric-value">15%</div>
                    <div className="metric-status warning">Behind Schedule</div>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>💡 Financial Insights</h3>
                <div className="insights">
                  <div className="insight-item">
                    <span className="insight-icon">⚠️</span>
                    <span className="insight-text">Your expenses exceed income by $2,989</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">💰</span>
                    <span className="insight-text">3 paychecks in October provide extra $2,144</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">📊</span>
                    <span className="insight-text">Housing costs are 57% of monthly income</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">🎯</span>
                    <span className="insight-text">Reduce discretionary spending by $500/month</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Goals Section */}
        {currentSection === 'goals' && (
          <section id="goals">
            <div className="section-header">
              <h1>🎯 Financial Goals & Targets</h1>
            </div>

            <div className="goals-grid">
              <div className="goal-card">
                <div className="goal-header">
                  <span className="goal-icon">🚨</span>
                  <h3>Emergency Fund</h3>
                </div>
                <div className="goal-target">
                  <span className="current">{formatCurrency(11.29)}</span>
                  <span className="separator"> / </span>
                  <span className="target">{formatCurrency(10000)}</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{width: '0.11%', background: 'var(--danger)'}}></div>
                  </div>
                  <span className="progress-text">0.11% Complete</span>
                </div>
                <div className="goal-deadline">
                  <span className="deadline-label">Target Date:</span>
                  <span className="deadline-date">Dec 31, 2025</span>
                </div>
                <div className="goal-monthly">
                  <span className="monthly-label">Monthly Savings Needed:</span>
                  <span className="monthly-amount">{formatCurrency(3329.57)}</span>
                </div>
              </div>

              <div className="goal-card">
                <div className="goal-header">
                  <span className="goal-icon">💳</span>
                  <h3>Debt Payoff</h3>
                </div>
                <div className="goal-target">
                  <span className="current">{formatCurrency(1500)}</span>
                  <span className="separator"> / </span>
                  <span className="target">{formatCurrency(5000)}</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{width: '30%', background: 'var(--warning)'}}></div>
                  </div>
                  <span className="progress-text">30% Complete</span>
                </div>
                <div className="goal-deadline">
                  <span className="deadline-label">Target Date:</span>
                  <span className="deadline-date">Jun 30, 2025</span>
                </div>
                <div className="goal-monthly">
                  <span className="monthly-label">Monthly Payment Needed:</span>
                  <span className="monthly-amount">{formatCurrency(389)}</span>
                </div>
              </div>

              <div className="goal-card">
                <div className="goal-header">
                  <span className="goal-icon">✈️</span>
                  <h3>Vacation Fund</h3>
                </div>
                <div className="goal-target">
                  <span className="current">{formatCurrency(0)}</span>
                  <span className="separator"> / </span>
                  <span className="target">{formatCurrency(3000)}</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{width: '0%', background: 'var(--primary)'}}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
                <div className="goal-deadline">
                  <span className="deadline-label">Target Date:</span>
                  <span className="deadline-date">Aug 1, 2025</span>
                </div>
                <div className="goal-monthly">
                  <span className="monthly-label">Monthly Savings Needed:</span>
                  <span className="monthly-amount">{formatCurrency(300)}</span>
                </div>
              </div>

              <div className="goal-card add-goal">
                <button className="add-goal-btn">
                  <span className="plus-icon">+</span>
                  <span>Add New Goal</span>
                </button>
              </div>
            </div>

            <div className="goals-summary">
              <h3>📊 Goals Summary</h3>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-label">Total Goals</span>
                  <span className="stat-value">3</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Monthly Commitment</span>
                  <span className="stat-value negative">{formatCurrency(4018.57)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Available for Goals</span>
                  <span className="stat-value negative">{formatCurrency(-2989.08)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Goal Feasibility</span>
                  <span className="stat-value danger">Needs Adjustment</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <section id="settings">
            <div className="section-header">
              <h1>⚙️ Settings & Preferences</h1>
            </div>

            <div className="settings-container">
              <div className="settings-section">
                <h3>👤 Account Information</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Email</label>
                    <input type="email" value="user@astralmoney.com" readOnly className="setting-input" />
                  </div>
                  <div className="setting-item">
                    <label>Current Balance</label>
                    <input type="text" value={formatCurrency(userBalance)} readOnly className="setting-input" />
                  </div>
                  <div className="setting-item">
                    <label>Account Created</label>
                    <input type="text" value="September 23, 2025" readOnly className="setting-input" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>💰 Income Settings</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Paycheck Amount</label>
                    <input type="text" value={formatCurrency(state.paycheckAmount)} className="setting-input" />
                  </div>
                  <div className="setting-item">
                    <label>Pay Frequency</label>
                    <select className="setting-input">
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="semimonthly">Semi-Monthly</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Next Paycheck</label>
                    <input type="date" className="setting-input" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🔔 Notifications</h3>
                <div className="settings-group">
                  <div className="setting-toggle">
                    <label>Bill Due Reminders</label>
                    <input type="checkbox" checked className="toggle-input" />
                  </div>
                  <div className="setting-toggle">
                    <label>Low Balance Alerts</label>
                    <input type="checkbox" checked className="toggle-input" />
                  </div>
                  <div className="setting-toggle">
                    <label>Goal Progress Updates</label>
                    <input type="checkbox" checked className="toggle-input" />
                  </div>
                  <div className="setting-toggle">
                    <label>Weekly Summary Email</label>
                    <input type="checkbox" className="toggle-input" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🎨 Display Preferences</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Currency</label>
                    <select className="setting-input">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Date Format</label>
                    <select className="setting-input">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Theme</label>
                    <select className="setting-input">
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn btn-primary">Save Changes</button>
                <button className="btn btn-secondary">Export Data</button>
                <button className="btn btn-danger">Reset Settings</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .month-selector {
          display: flex;
          gap: 12px;
        }
        .month-btn {
          padding: 8px 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .month-btn:hover {
          background: var(--surface-light);
          color: var(--text-primary);
        }
        .month-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .month-stats {
          display: flex;
          gap: 24px;
          margin: 24px 0;
        }
        .stat-card {
          flex: 1;
          padding: 20px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
        }
        .stat-value.positive {
          color: var(--success);
        }
        .stat-value.negative {
          color: var(--danger);
        }
        .bills-list {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 20px;
        }
        .bill-row {
          display: grid;
          grid-template-columns: 40px 100px 1fr 120px 120px 100px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-secondary);
          transition: background 0.2s ease;
        }
        .bill-row:hover {
          background: var(--surface-light);
        }
        .bill-checkbox {
          width: 20px;
          height: 20px;
        }
        .bill-date {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .bill-name {
          font-weight: 600;
        }
        .bill-category {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .bill-amount {
          font-weight: 600;
          text-align: right;
        }
        .bill-amount.income {
          color: var(--success);
        }
        .bill-amount.expense {
          color: var(--danger);
        }
        .bill-status {
          text-align: center;
          font-size: 0.9rem;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }
        .analytics-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
        }
        .analytics-card h3 {
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .category-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .category-item {
          display: grid;
          grid-template-columns: 120px 1fr 80px;
          align-items: center;
          gap: 12px;
        }
        .category-bar {
          height: 20px;
          background: var(--surface-dark);
          border-radius: 10px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .trend-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 200px;
          margin: 20px 0;
        }
        .trend-month {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .month-bars {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          height: 150px;
        }
        .income-bar {
          width: 40px;
          background: var(--success);
          border-radius: 4px 4px 0 0;
        }
        .expense-bar {
          width: 40px;
          background: var(--danger);
          border-radius: 4px 4px 0 0;
        }
        .trend-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .legend-color.income {
          background: var(--success);
        }
        .legend-color.expense {
          background: var(--danger);
        }
        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--surface-dark);
          border-radius: 8px;
        }
        .metric-value {
          font-size: 1.2rem;
          font-weight: 700;
        }
        .metric-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        .metric-status.danger {
          background: rgba(239, 68, 68, 0.2);
          color: var(--danger);
        }
        .metric-status.warning {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning);
        }
        .insights {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .insight-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--surface-dark);
          border-radius: 8px;
        }
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .goal-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .goal-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .goal-icon {
          font-size: 1.5rem;
        }
        .goal-target {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .goal-target .current {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .goal-target .target {
          font-size: 1.2rem;
          color: var(--text-secondary);
        }
        .goal-progress {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progress-bar-container {
          height: 8px;
          background: var(--surface-dark);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
        }
        .goal-deadline, .goal-monthly {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .deadline-label, .monthly-label {
          color: var(--text-secondary);
        }
        .add-goal {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .add-goal-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 32px;
          background: transparent;
          border: 2px dashed var(--glass-border);
          border-radius: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }
        .add-goal-btn:hover {
          background: var(--surface-light);
          border-color: var(--primary);
          color: var(--primary);
        }
        .plus-icon {
          font-size: 2rem;
        }
        .goals-summary {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }
        .summary-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: var(--surface-dark);
          border-radius: 8px;
        }
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .settings-section {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
        }
        .settings-section h3 {
          margin-bottom: 20px;
        }
        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .setting-item {
          display: grid;
          grid-template-columns: 200px 1fr;
          align-items: center;
          gap: 16px;
        }
        .setting-item label {
          color: var(--text-secondary);
        }
        .setting-input {
          padding: 8px 12px;
          background: var(--surface-dark);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 1rem;
        }
        .setting-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-secondary);
        }
        .toggle-input {
          width: 20px;
          height: 20px;
        }
        .settings-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
        }
        .btn-primary:hover {
          background: var(--primary-dark);
        }
        .btn-secondary {
          background: var(--surface-light);
          color: var(--text-primary);
        }
        .btn-secondary:hover {
          background: var(--surface-dark);
        }
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        .btn-danger:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}