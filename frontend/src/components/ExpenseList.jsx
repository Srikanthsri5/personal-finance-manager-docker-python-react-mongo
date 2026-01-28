export default function ExpenseList({ expenses, onDeleteExpense }) {
  
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
        const response = await fetch(`http://localhost:8000/api/expenses/${id}`, {
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

  return (
    <div className="expense-list">
      <h3>Recent Expenses</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan="5" style={{textAlign: "center"}}>No expenses found.</td>
            </tr>
          ) : (
            expenses.map((expense) => (
              <tr key={expense._id}>
                <td>{new Date(expense.date).toLocaleDateString()}</td>
                <td>{expense.title}</td>
                <td><span className={`badge ${expense.category.toLowerCase()}`}>{expense.category}</span></td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>
                    <button onClick={() => handleDelete(expense._id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
