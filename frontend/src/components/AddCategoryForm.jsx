import { useState } from 'react';
import { createCategory } from '../services/categoryService';

export default function AddCategoryForm({ onCategoryAdded }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('expense'); // Default to expense
    const [budget, setBudget] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !type) return;

        try {
            const newCategory = {
                name,
                type,
                budget: budget ? parseFloat(budget) : null
            };
            const savedCategory = await createCategory(newCategory);
            onCategoryAdded(savedCategory);
            setName('');
            setBudget('');
            setType('expense');
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category");
        }
    };

    return (
        <form className="expense-form" onSubmit={handleSubmit}>
            <h3>Add New Category</h3>
            <div className="form-group">
                <label>Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Groceries"
                    required
                />
            </div>
            
            <div className="form-group">
                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
            </div>

            <div className="form-group">
                <label>Budget Limit (Optional)</label>
                <input 
                    type="number" 
                    value={budget} 
                    onChange={(e) => setBudget(e.target.value)} 
                    placeholder="e.g. 5000"
                    step="0.01"
                />
            </div>

            <button type="submit">Add Category</button>
        </form>
    );
}
