import Head from 'next/head';
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
    // Initialize the app
    updateKPIs();
  }, []);

  const updateKPIs = () => {
    // Update financial calculations
    setState(prev => ({
      ...prev,
      netFlow: prev.totalIncome - prev.totalExpenses,
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const showSection = (sectionId) => {
    setCurrentSection(sectionId);
  };

  const expandHellWeek = () => {
    const expandedSection = document.getElementById('hellWeekExpanded');
    const arrow = document.getElementById('hellWeekArrow');
    
    if (expandedSection.style.display === 'none') {
      expandedSection.style.display = 'block';
      arrow.textContent = '▲';
    } else {
      expandedSection.style.display = 'none';
      arrow.textContent = '▼';
    }
  };

  return (
    <>
      <Head>
        <title>🌟 Astral Money - Ultimate Budget Tracker 2025</title>
        <meta name="description" content="Professional budget tracking with real-time health scoring" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
                  onClick={() => showSection('dashboard')}
                >
                  <span className="nav-icon">📊</span>
                  <span>Dashboard</span>
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#months" 
                  className={`nav-link ${currentSection === 'months' ? 'active' : ''}`}
                  onClick={() => showSection('months')}
                >
                  <span className="nav-icon">📅</span>
                  <span>Monthly View</span>
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#analytics" 
                  className={`nav-link ${currentSection === 'analytics' ? 'active' : ''}`}
                  onClick={() => showSection('analytics')}
                >
                  <span className="nav-icon">📈</span>
                  <span>Analytics</span>
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#goals" 
                  className={`nav-link ${currentSection === 'goals' ? 'active' : ''}`}
                  onClick={() => showSection('goals')}
                >
                  <span className="nav-icon">🎯</span>
                  <span>Goals & Targets</span>
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#settings" 
                  className={`nav-link ${currentSection === 'settings' ? 'active' : ''}`}
                  onClick={() => showSection('settings')}
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

      <style jsx global>{`
        :root {
            --primary: #6366f1;
            --primary-dark: #4338ca;
            --secondary: #8b5cf6;
            --accent: #f59e0b;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --background: #0f172a;
            --surface: rgba(255, 255, 255, 0.05);
            --surface-light: rgba(255, 255, 255, 0.1);
            --surface-dark: rgba(0, 0, 0, 0.2);
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-muted: #64748b;
            --border-primary: rgba(255, 255, 255, 0.1);
            --border-secondary: rgba(255, 255, 255, 0.05);
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .app-container {
            display: flex;
            min-height: 100vh;
        }

        .sidebar {
            width: 280px;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--glass-border);
            padding: 24px;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            z-index: 100;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 32px;
        }

        .nav-menu {
            list-style: none;
            margin-bottom: 32px;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            color: var(--text-secondary);
            text-decoration: none;
            transition: all 0.3s ease;
            margin-bottom: 8px;
        }

        .nav-link:hover {
            background: var(--surface-light);
            color: var(--text-primary);
            transform: translateX(4px);
        }

        .nav-link.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }

        .main-content {
            flex: 1;
            margin-left: 280px;
            padding: 32px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .section-header h1 {
            font-size: 2rem;
            font-weight: 700;
        }

        .current-balance {
            font-size: 1.2rem;
            font-weight: 600;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .dashboard-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 24px;
            box-shadow: var(--glass-shadow);
            transition: all 0.3s ease;
        }

        .dashboard-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(31, 38, 135, 0.5);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .card-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .card-icon {
            font-size: 1.5rem;
        }

        .card-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .card-value.positive {
            color: var(--success);
        }

        .card-value.negative {
            color: var(--danger);
        }

        .progress-container {
            height: 6px;
            background: var(--surface-dark);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 16px;
        }

        .progress-bar {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        .progress-bar.success {
            background: linear-gradient(90deg, var(--success), #34d399);
        }

        .progress-bar.danger {
            background: linear-gradient(90deg, var(--danger), #f87171);
        }

        .card-trend {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .card-trend.clickable:hover {
            color: var(--text-primary);
            cursor: pointer;
        }

        .overview-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 24px;
            box-shadow: var(--glass-shadow);
        }

        .section-title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .health-widget {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 20px;
            margin-top: 24px;
        }

        .health-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .health-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-secondary);
        }

        .health-score {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .health-score.critical {
            color: var(--danger);
        }

        .health-bar {
            height: 8px;
            background: var(--surface-dark);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 12px;
        }

        .health-progress {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .health-progress.critical {
            background: linear-gradient(90deg, var(--danger), #f87171);
        }

        .health-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            margin-bottom: 12px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .status-dot.critical {
            background: var(--danger);
        }

        .health-tips {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-style: italic;
        }

        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }

            .main-content {
                margin-left: 0;
                padding: 16px;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }
      `}</style>
    </>
  );
}