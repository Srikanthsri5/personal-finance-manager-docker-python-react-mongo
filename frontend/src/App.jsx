import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';

function App() {
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8005';
      const apiUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
      const response = await fetch(`${apiUrl}/api/expenses/`);
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
    <Router>
      <div className="app-container">
        <header>
           <NavBar />
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
