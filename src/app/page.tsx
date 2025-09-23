'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [currentSection, setCurrentSection] = useState('dashboard');
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
    updateKPIs();
  }, []);

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
                Balance: <span id="currentBalance" className="negative">{formatCurrency(state.startBalance)}</span>
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

        {/* Other sections placeholder */}
        {currentSection !== 'dashboard' && (
          <section>
            <div className="section-header">
              <h1>🚧 Section Under Development</h1>
              <p>This section will be available in the next update.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}