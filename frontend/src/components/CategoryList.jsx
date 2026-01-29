import { deleteCategory } from '../services/categoryService';

export default function CategoryList({ categories, onCategoryDeleted }) {

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;

        try {
            await deleteCategory(id);
            onCategoryDeleted(id);
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category");
        }
    };

    return (
        <div className="expense-list">
            <h3>Categories</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Budget</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: "center" }}>No categories found.</td>
                        </tr>
                    ) : (
                        categories.map((category) => (
                            <tr key={category._id}>
                                <td>
                                    <span className={`badge ${category.name.toLowerCase().split(' ')[0]}`}>
                                        {category.name}
                                    </span>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{category.type}</td>
                                <td>{category.budget ? `₹${category.budget.toFixed(2)}` : '-'}</td>
                                <td>
                                    <button onClick={() => handleDelete(category._id)} className="delete-btn">Delete</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
