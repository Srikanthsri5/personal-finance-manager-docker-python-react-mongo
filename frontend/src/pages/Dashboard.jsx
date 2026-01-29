import { useState, useEffect } from 'react';
import ExpenseList from '../components/ExpenseList';
import AddExpenseForm from '../components/AddExpenseForm';

export default function Dashboard() {
    const [expenses, setExpenses] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'all'
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, [currentDate, viewMode]);

    const fetchExpenses = async () => {
        try {
            let url = 'http://localhost:8005/api/expenses/';
            if (viewMode === 'month') {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1; // 1-12
                url += `?year=${year}&month=${month}`;
            } else {
                url += `?view=all`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const handleAddExpense = (newExpense) => {
        setExpenses(prev => [...prev, newExpense]);
        setSidebarOpen(false); // Close on mobile after add
    };

    const handleDeleteExpense = (id) => {
        setExpenses(prev => prev.filter(exp => exp._id !== id));
    };

    const handleExport = (type) => {
        let url = `http://localhost:8005/api/expenses/export/${type}`;
        if (viewMode === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            url += `?year=${year}&month=${month}`;
        } else {
            url += `?view=all`;
        }
        window.open(url, '_blank');
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const formatMonthYear = (date) => {
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="main-content">
            <button className="mobile-fab" onClick={() => setSidebarOpen(true)}>+</button>
            
            <div className={`left-panel ${isSidebarOpen ? 'open' : ''}`}>
                <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>&times;</button>
                <AddExpenseForm onAddExpense={handleAddExpense} />
            </div>
            
            <div className="right-panel">
                <div className="summary-card">
                    <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                        {viewMode === 'month' ? formatMonthYear(currentDate) : 'All Time'}
                    </div>
                    <div className="summary-row">
                        <div className="summary-item">
                            <span className="summary-label">Total In</span>
                            <span className="summary-value income">
                                ₹{expenses.filter(e => e.type === 'cash_in').reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Out</span>
                            <span className="summary-value expense">
                                ₹{expenses.filter(e => e.type !== 'cash_in').reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Balance</span>
                            <span className="summary-value balance">
                                ₹{expenses.reduce((sum, item) => item.type === 'cash_in' ? sum + item.amount : sum - item.amount, 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-controls">
                    <div className="view-filters">
                        <button 
                            className={`filter-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            Monthly
                        </button>
                        <button 
                            className={`filter-btn ${viewMode === 'all' ? 'active' : ''}`}
                            onClick={() => setViewMode('all')}
                        >
                            All Time
                        </button>
                    </div>

                    {viewMode === 'month' && (
                        <div className="month-navigator">
                            <button onClick={() => changeMonth(-1)} className="nav-btn">&lt;</button>
                            <span className="current-month">{formatMonthYear(currentDate)}</span>
                            <button onClick={() => changeMonth(1)} className="nav-btn">&gt;</button>
                        </div>
                    )}

                    <div className="export-actions">
                         <button onClick={() => handleExport('excel')} className="export-btn excel">Excel</button>
                         <button onClick={() => handleExport('pdf')} className="export-btn pdf">PDF</button>
                    </div>
                </div>
                <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
            </div>
        </div>
    );
}
