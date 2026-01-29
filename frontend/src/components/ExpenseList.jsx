import { useMemo } from 'react';

export default function ExpenseList({ expenses, onDeleteExpense }) {
  
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
        const response = await fetch(`http://localhost:8005/api/expenses/${id}`, {
            method: 'DELETE'
        });
        if(response.ok) {
            onDeleteExpense(id);
        } else {
            console.error("Failed to delete");
        }
    } catch(error) {
        console.error("Error deleting:", error);
    }
  }

  // Create groupings
  const groupedExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return {};
    
    // Sort by date desc
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return sorted.reduce((acc, expense) => {
        const dateStr = expense.date.split('T')[0]; // simple YYYY-MM-DD
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(expense);
        return acc;
    }, {});
  }, [expenses]);

  return (
    <div className="expense-list-container">
      {Object.keys(groupedExpenses).length === 0 ? (
          <div className="empty-state">No transactions recorded for this period.</div>
      ) : (
          Object.keys(groupedExpenses).map(date => {
              const dayTotal = groupedExpenses[date].reduce((sum, item) => sum + item.amount, 0);
              const dateObj = new Date(date);
              const displayDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
              
              return (
                  <div key={date} className="day-group">
                      <div className="day-header">
                          <span className="day-date">{displayDate}</span>
                          <span className="day-total">₹{dayTotal.toFixed(2)}</span>
                      </div>
                      <div className="day-entries">
                          {groupedExpenses[date].map(expense => (
                              <div key={expense._id} className="entry-card">
                                  <div className="entry-left">
                                      <div className={`category-icon ${expense.category.toLowerCase().split(' ')[0]}`}>
                                          {expense.category.charAt(0)}
                                      </div>
                                      <div className="entry-details">
                                          <span className="entry-title">{expense.title}</span>
                                          <span className="entry-category">{expense.category}</span>
                                      </div>
                                  </div>
                                  <div className="entry-right">
                                      <span className="entry-amount expense">- ₹{expense.amount.toFixed(2)}</span>
                                      <button onClick={() => handleDelete(expense._id)} className="icon-btn delete" title="Delete">
                                          &times;
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )
          })
      )}
    </div>
  );
}
