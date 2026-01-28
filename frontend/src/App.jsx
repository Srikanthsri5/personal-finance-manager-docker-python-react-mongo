import { useState, useEffect } from 'react'
import './App.css'
import ExpenseList from './components/ExpenseList'
import AddExpenseForm from './components/AddExpenseForm'

function App() {
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/expenses/');
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

  return (
    <div className="app-container">
      <header>
        <h1>Personal Finance Manager</h1>
      </header>
      <main className="main-content">
        <div className="left-panel">
            <AddExpenseForm onAddExpense={handleAddExpense} />
        </div>
        <div className="right-panel">
            <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
        </div>
      </main>
    </div>
  )
}

export default App
