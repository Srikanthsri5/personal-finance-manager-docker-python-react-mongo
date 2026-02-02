import { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { getCategories } from '../services/categoryService';
import { getBaseUrl } from '../utils/apiConfig';

export default function AddExpenseForm({ onAddExpense }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    type: 'cash_out',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };
    fetchCats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type) => {
      setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${getBaseUrl()}/api/expenses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount)
        }),
      });

      if (response.ok) {
        const newExpense = await response.json();
        onAddExpense(newExpense);
        setFormData({
            title: '',
            amount: '',
            category: '',
            type: 'cash_out',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
      } else {
        console.error('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h3>Add New Transaction</h3>
      
      <div className="form-group type-toggle-container">
          <label>Type</label>
          <div className="type-toggle">
              <button 
                type="button" 
                className={`type-btn cash-in ${formData.type === 'cash_in' ? 'active' : ''}`}
                onClick={() => handleTypeChange('cash_in')}
              >
                  (+) Cash In
              </button>
              <button 
                type="button" 
                className={`type-btn cash-out ${formData.type === 'cash_out' ? 'active' : ''}`}
                onClick={() => handleTypeChange('cash_out')}
              >
                  (-) Cash Out
              </button>
          </div>
      </div>

      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          name="amount"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select name="category" value={formData.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
        </select>
      </div>
      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>
      <button type="submit" className={formData.type === 'cash_in' ? 'btn-green' : 'btn-red'}>
          Add {formData.type === 'cash_in' ? 'Income' : 'Expense'}
      </button>
    </form>
  );
}
