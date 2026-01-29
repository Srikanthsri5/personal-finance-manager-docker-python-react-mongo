import { useState, useEffect } from 'react';
import ExpenseList from '../components/ExpenseList';
import AddExpenseForm from '../components/AddExpenseForm';

export default function Dashboard() {
    const [expenses, setExpenses] = useState([]);
    const [view, setView] = useState('all');

    useEffect(() => {
        fetchExpenses(view);
    }, [view]);

    const fetchExpenses = async (currentView) => {
        try {
            const response = await fetch(`http://localhost:8005/api/expenses/?view=${currentView}`);
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
    };

    const handleDeleteExpense = (id) => {
        setExpenses(prev => prev.filter(exp => exp._id !== id));
    };

    const handleExport = (type) => {
        window.open(`http://localhost:8005/api/expenses/export/${type}?view=${view}`, '_blank');
    };

    return (
        <div className="main-content">
            <div className="left-panel">
                <AddExpenseForm onAddExpense={handleAddExpense} />
            </div>
            <div className="right-panel">
                <div className="summary-card">
                    <div className="summary-item">
                        <span className="summary-label">Total Expenses ({view})</span>
                        <span className="summary-value">₹{expenses.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                    </div>
                </div>

                <div className="dashboard-controls">
                    <div className="view-filters">
                        {['daily', 'weekly', 'monthly', 'yearly', 'all'].map(v => (
                            <button 
                                key={v} 
                                onClick={() => setView(v)}
                                className={`filter-btn ${view === v ? 'active' : ''}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
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
