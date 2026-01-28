import { useState } from 'react';

export default function AddExpenseForm({ onAddExpense }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/expenses/', {
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
      <h3>Add New Expense</h3>
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
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
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
      <button type="submit">Add Expense</button>
    </form>
  );
}
