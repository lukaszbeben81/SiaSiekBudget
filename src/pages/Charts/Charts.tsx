import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, subMonths } from 'date-fns';
import { Month, Income, Expense } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import './Charts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsProps {
  onBack: () => void;
}

interface MonthData {
  month: Month;
  incomes: Income[];
  expenses: Expense[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const CHART_COLORS = [
  '#00ff99', // green
  '#ff6b6b', // red
  '#4ecdc4', // teal
  '#ffe66d', // yellow
  '#95e1d3', // mint
  '#f38181', // coral
  '#aa96da', // purple
  '#fcbad3', // pink
  '#a8d8ea', // light blue
  '#ff9a3c', // orange
  '#c4e538', // lime
  '#574b90', // indigo
];

const Charts: React.FC<ChartsProps> = ({ onBack }) => {
  const [allMonthsData, setAllMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'income' | 'expenses' | 'comparison'>('overview');
  
  // Date range filter - default last 12 months
  const [dateFrom, setDateFrom] = useState(() => {
    const date = subMonths(new Date(), 12);
    return format(date, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter months by date range
  const monthsData = useMemo(() => {
    return allMonthsData.filter(md => {
      const monthStart = md.month.start_date;
      return monthStart >= dateFrom && monthStart <= dateTo;
    });
  }, [allMonthsData, dateFrom, dateTo]);

  const loadAllData = async () => {
    try {
      const months = await window.electronAPI.getMonths();
      
      // Load data for ALL months
      const dataPromises = months.map(async (month: Month) => {
        const [incomes, expenses] = await Promise.all([
          window.electronAPI.getIncomes(month.id),
          window.electronAPI.getExpenses(month.id)
        ]);
        
        const totalIncome = incomes.reduce((sum: number, i: Income) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + e.total_amount, 0);
        
        return {
          month,
          incomes,
          expenses,
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses
        };
      });
      
      const data = await Promise.all(dataPromises);
      setAllMonthsData(data.reverse()); // Oldest first for charts
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get category totals for expenses
  const getCategoryTotals = (expenses: Expense[]) => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || 'Inne';
      totals[cat] = (totals[cat] || 0) + e.total_amount;
    });
    return totals;
  };

  // Get all unique expense categories
  const getAllCategories = () => {
    const categories = new Set<string>();
    monthsData.forEach(md => {
      md.expenses.forEach(e => {
        categories.add(e.category || 'Inne');
      });
    });
    return Array.from(categories);
  };

  // Overview Chart - Income vs Expenses per month
  const overviewChartData = {
    labels: monthsData.map(md => md.month.name),
    datasets: [
      {
        label: 'Dochody',
        data: monthsData.map(md => md.totalIncome),
        backgroundColor: 'rgba(0, 255, 153, 0.7)',
        borderColor: '#00ff99',
        borderWidth: 2,
      },
      {
        label: 'Wydatki',
        data: monthsData.map(md => md.totalExpenses),
        backgroundColor: 'rgba(255, 107, 107, 0.7)',
        borderColor: '#ff6b6b',
        borderWidth: 2,
      },
    ],
  };

  // Balance trend line chart
  const balanceChartData = {
    labels: monthsData.map(md => md.month.name),
    datasets: [
      {
        label: 'Bilans',
        data: monthsData.map(md => md.balance),
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Expense categories pie chart (sum of all months)
  const allExpenses = monthsData.flatMap(md => md.expenses);
  const categoryTotals = getCategoryTotals(allExpenses);
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const expensePieData = {
    labels: sortedCategories.map(([cat]) => cat),
    datasets: [
      {
        data: sortedCategories.map(([, val]) => val),
        backgroundColor: CHART_COLORS.slice(0, sortedCategories.length),
        borderColor: '#1a1a2e',
        borderWidth: 2,
      },
    ],
  };

  // Expenses by category per month (stacked bar)
  const categories = getAllCategories();
  const categoryMonthlyData = {
    labels: monthsData.map(md => md.month.name),
    datasets: categories.map((cat, index) => ({
      label: cat,
      data: monthsData.map(md => {
        const catTotal = md.expenses
          .filter(e => (e.category || 'Inne') === cat)
          .reduce((sum, e) => sum + e.total_amount, 0);
        return catTotal;
      }),
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
    })),
  };

  // Month vs Previous Month comparison
  const getComparisonData = () => {
    if (monthsData.length < 2) return null;
    
    const current = monthsData[monthsData.length - 1];
    const previous = monthsData[monthsData.length - 2];
    
    return {
      labels: ['Dochody', 'Wydatki', 'Bilans'],
      datasets: [
        {
          label: previous.month.name,
          data: [previous.totalIncome, previous.totalExpenses, previous.balance],
          backgroundColor: 'rgba(170, 150, 218, 0.7)',
          borderColor: '#aa96da',
          borderWidth: 2,
        },
        {
          label: current.month.name,
          data: [current.totalIncome, current.totalExpenses, current.balance],
          backgroundColor: 'rgba(0, 255, 153, 0.7)',
          borderColor: '#00ff99',
          borderWidth: 2,
        },
      ],
    };
  };

  // Year over Year comparison (same month last year)
  const getYearOverYearData = () => {
    if (monthsData.length < 1) return null;
    
    const current = monthsData[monthsData.length - 1];
    const currentMonthNum = new Date(current.month.start_date).getMonth();
    
    // Find same month from previous year
    const sameMonthLastYear = monthsData.find(md => {
      const monthNum = new Date(md.month.start_date).getMonth();
      const year = new Date(md.month.start_date).getFullYear();
      const currentYear = new Date(current.month.start_date).getFullYear();
      return monthNum === currentMonthNum && year === currentYear - 1;
    });
    
    if (!sameMonthLastYear) return null;
    
    return {
      current,
      previous: sameMonthLastYear,
      data: {
        labels: ['Dochody', 'Wydatki', 'Bilans'],
        datasets: [
          {
            label: sameMonthLastYear.month.name,
            data: [sameMonthLastYear.totalIncome, sameMonthLastYear.totalExpenses, sameMonthLastYear.balance],
            backgroundColor: 'rgba(149, 225, 211, 0.7)',
            borderColor: '#95e1d3',
            borderWidth: 2,
          },
          {
            label: current.month.name,
            data: [current.totalIncome, current.totalExpenses, current.balance],
            backgroundColor: 'rgba(0, 255, 153, 0.7)',
            borderColor: '#00ff99',
            borderWidth: 2,
          },
        ],
      }
    };
  };

  // Top expenses
  const getTopExpenses = () => {
    const expensesByName: Record<string, number> = {};
    allExpenses.forEach(e => {
      expensesByName[e.name] = (expensesByName[e.name] || 0) + e.total_amount;
    });
    return Object.entries(expensesByName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e0e0e0',
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#999' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        ticks: { 
          color: '#999',
          callback: (value: any) => formatCurrency(value),
        },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e0e0e0',
          padding: 10,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const stackedOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: { ...chartOptions.scales.x, stacked: true },
      y: { ...chartOptions.scales.y, stacked: true },
    },
  };

  if (loading) {
    return (
      <div className="charts-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const comparisonData = getComparisonData();
  const yoyData = getYearOverYearData();
  const topExpenses = getTopExpenses();

  return (
    <div className="charts-container">
      <div className="charts-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Powrót
        </button>
        <h1>📊 Wykresy i statystyki</h1>
        
        <div className="date-range-filter">
          <label>
            Od:
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              className="date-input"
            />
          </label>
          <label>
            Do:
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              className="date-input"
            />
          </label>
          <span className="date-range-info">
            Wyświetlono: {monthsData.length} mies.
          </span>
        </div>
        
        <div className="view-tabs">
          <button 
            className={`tab-btn ${selectedView === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedView('overview')}
          >
            Przegląd
          </button>
          <button 
            className={`tab-btn ${selectedView === 'income' ? 'active' : ''}`}
            onClick={() => setSelectedView('income')}
          >
            Dochody
          </button>
          <button 
            className={`tab-btn ${selectedView === 'expenses' ? 'active' : ''}`}
            onClick={() => setSelectedView('expenses')}
          >
            Wydatki
          </button>
          <button 
            className={`tab-btn ${selectedView === 'comparison' ? 'active' : ''}`}
            onClick={() => setSelectedView('comparison')}
          >
            Porównania
          </button>
        </div>
      </div>

      <div className="charts-content">
        {monthsData.length === 0 ? (
          <div className="empty-state">
            <h2>Brak danych</h2>
            <p className="text-secondary">Utwórz miesiące z wydatkami i dochodami aby zobaczyć wykresy</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {selectedView === 'overview' && (
              <div className="charts-grid">
                {/* Summary cards */}
                <div className="summary-cards">
                  <div className="summary-card income">
                    <h4>Suma dochodów</h4>
                    <p className="big-number">{formatCurrency(monthsData.reduce((s, m) => s + m.totalIncome, 0))}</p>
                    <span className="period">ostatnie {monthsData.length} mies.</span>
                  </div>
                  <div className="summary-card expenses">
                    <h4>Suma wydatków</h4>
                    <p className="big-number">{formatCurrency(monthsData.reduce((s, m) => s + m.totalExpenses, 0))}</p>
                    <span className="period">ostatnie {monthsData.length} mies.</span>
                  </div>
                  <div className="summary-card balance">
                    <h4>Suma bilansu</h4>
                    <p className="big-number">{formatCurrency(monthsData.reduce((s, m) => s + m.balance, 0))}</p>
                    <span className="period">ostatnie {monthsData.length} mies.</span>
                  </div>
                  <div className="summary-card average">
                    <h4>Średnia miesięczna</h4>
                    <p className="big-number">{formatCurrency(monthsData.reduce((s, m) => s + m.balance, 0) / monthsData.length)}</p>
                    <span className="period">bilans</span>
                  </div>
                </div>

                {/* Income vs Expenses */}
                <div className="chart-card full-width">
                  <h3>Dochody vs Wydatki</h3>
                  <div className="chart-wrapper">
                    <Bar data={overviewChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Balance trend */}
                <div className="chart-card full-width">
                  <h3>Trend bilansu</h3>
                  <div className="chart-wrapper">
                    <Line data={balanceChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* INCOME TAB */}
            {selectedView === 'income' && (
              <div className="charts-grid">
                {/* Income by month */}
                <div className="chart-card full-width">
                  <h3>Dochody miesięczne</h3>
                  <div className="chart-wrapper">
                    <Bar 
                      data={{
                        labels: monthsData.map(md => md.month.name),
                        datasets: [{
                          label: 'Dochody',
                          data: monthsData.map(md => md.totalIncome),
                          backgroundColor: 'rgba(0, 255, 153, 0.7)',
                          borderColor: '#00ff99',
                          borderWidth: 2,
                        }],
                      }} 
                      options={chartOptions} 
                    />
                  </div>
                </div>

                {/* Income sources table */}
                <div className="chart-card">
                  <h3>Źródła dochodów</h3>
                  <div className="data-table">
                    {(() => {
                      const incomeSources: Record<string, number> = {};
                      monthsData.forEach(md => {
                        md.incomes.forEach(i => {
                          incomeSources[i.name] = (incomeSources[i.name] || 0) + i.amount;
                        });
                      });
                      return Object.entries(incomeSources)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, total], idx) => (
                          <div key={name} className="data-row">
                            <span className="rank">#{idx + 1}</span>
                            <span className="name">{name}</span>
                            <span className="value text-success">{formatCurrency(total)}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Average income */}
                <div className="chart-card">
                  <h3>Statystyki dochodów</h3>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <span className="stat-label">Średni dochód</span>
                      <span className="stat-value text-success">
                        {formatCurrency(monthsData.reduce((s, m) => s + m.totalIncome, 0) / monthsData.length)}
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Najwyższy</span>
                      <span className="stat-value text-success">
                        {formatCurrency(Math.max(...monthsData.map(m => m.totalIncome)))}
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Najniższy</span>
                      <span className="stat-value">
                        {formatCurrency(Math.min(...monthsData.map(m => m.totalIncome)))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXPENSES TAB */}
            {selectedView === 'expenses' && (
              <div className="charts-grid">
                {/* Expenses by category pie */}
                <div className="chart-card">
                  <h3>Wydatki wg kategorii</h3>
                  <div className="chart-wrapper pie-chart">
                    <Doughnut data={expensePieData} options={pieOptions} />
                  </div>
                </div>

                {/* Top expenses */}
                <div className="chart-card">
                  <h3>🔝 Na co idzie najwięcej</h3>
                  <div className="data-table">
                    {topExpenses.map(([name, total], idx) => (
                      <div key={name} className="data-row">
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{name}</span>
                        <span className="value text-danger">{formatCurrency(total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenses by category stacked */}
                <div className="chart-card full-width">
                  <h3>Wydatki wg kategorii w czasie</h3>
                  <div className="chart-wrapper">
                    <Bar data={categoryMonthlyData} options={stackedOptions} />
                  </div>
                </div>

                {/* Expense stats */}
                <div className="chart-card full-width">
                  <h3>Statystyki wydatków</h3>
                  <div className="stats-grid horizontal">
                    <div className="stat-box">
                      <span className="stat-label">Średnie wydatki</span>
                      <span className="stat-value text-danger">
                        {formatCurrency(monthsData.reduce((s, m) => s + m.totalExpenses, 0) / monthsData.length)}
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Najwyższe</span>
                      <span className="stat-value text-danger">
                        {formatCurrency(Math.max(...monthsData.map(m => m.totalExpenses)))}
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Najniższe</span>
                      <span className="stat-value">
                        {formatCurrency(Math.min(...monthsData.map(m => m.totalExpenses)))}
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Liczba kategorii</span>
                      <span className="stat-value">{categories.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMPARISON TAB */}
            {selectedView === 'comparison' && (
              <div className="charts-grid">
                {/* Month vs Previous */}
                {comparisonData && (
                  <div className="chart-card">
                    <h3>📅 Miesiąc vs Poprzedni</h3>
                    <div className="chart-wrapper">
                      <Bar data={comparisonData} options={chartOptions} />
                    </div>
                    <div className="comparison-details">
                      {(() => {
                        const current = monthsData[monthsData.length - 1];
                        const previous = monthsData[monthsData.length - 2];
                        const incomeDiff = current.totalIncome - previous.totalIncome;
                        const expenseDiff = current.totalExpenses - previous.totalExpenses;
                        return (
                          <>
                            <div className={`diff-item ${incomeDiff >= 0 ? 'positive' : 'negative'}`}>
                              <span>Dochody:</span>
                              <span>{incomeDiff >= 0 ? '+' : ''}{formatCurrency(incomeDiff)}</span>
                            </div>
                            <div className={`diff-item ${expenseDiff <= 0 ? 'positive' : 'negative'}`}>
                              <span>Wydatki:</span>
                              <span>{expenseDiff >= 0 ? '+' : ''}{formatCurrency(expenseDiff)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Year over Year */}
                {yoyData ? (
                  <div className="chart-card">
                    <h3>📆 Rok do roku</h3>
                    <div className="chart-wrapper">
                      <Bar data={yoyData.data} options={chartOptions} />
                    </div>
                    <div className="comparison-details">
                      {(() => {
                        const incomeDiff = yoyData.current.totalIncome - yoyData.previous.totalIncome;
                        const expenseDiff = yoyData.current.totalExpenses - yoyData.previous.totalExpenses;
                        return (
                          <>
                            <div className={`diff-item ${incomeDiff >= 0 ? 'positive' : 'negative'}`}>
                              <span>Dochody:</span>
                              <span>{incomeDiff >= 0 ? '+' : ''}{formatCurrency(incomeDiff)}</span>
                            </div>
                            <div className={`diff-item ${expenseDiff <= 0 ? 'positive' : 'negative'}`}>
                              <span>Wydatki:</span>
                              <span>{expenseDiff >= 0 ? '+' : ''}{formatCurrency(expenseDiff)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="chart-card">
                    <h3>📆 Rok do roku</h3>
                    <div className="no-data">
                      <p>Brak danych z tego samego miesiąca rok temu</p>
                    </div>
                  </div>
                )}

                {/* Monthly trend comparison */}
                <div className="chart-card full-width">
                  <h3>Trend miesięczny</h3>
                  <div className="chart-wrapper">
                    <Line 
                      data={{
                        labels: monthsData.map(md => md.month.name),
                        datasets: [
                          {
                            label: 'Dochody',
                            data: monthsData.map(md => md.totalIncome),
                            borderColor: '#00ff99',
                            backgroundColor: 'rgba(0, 255, 153, 0.1)',
                            fill: false,
                            tension: 0.3,
                          },
                          {
                            label: 'Wydatki',
                            data: monthsData.map(md => md.totalExpenses),
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            fill: false,
                            tension: 0.3,
                          },
                        ],
                      }} 
                      options={chartOptions} 
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Charts;
