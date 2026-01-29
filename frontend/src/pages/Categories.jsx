import { useState, useEffect } from 'react';
import CategoryList from '../components/CategoryList';
import AddCategoryForm from '../components/AddCategoryForm';
import { getCategories } from '../services/categoryService';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleAddCategory = (newCategory) => {
        setCategories(prev => [...prev, newCategory]);
        setSidebarOpen(false); // Close on mobile
    };

    const handleDeleteCategory = (id) => {
        setCategories(prev => prev.filter(cat => cat._id !== id));
    };

    return (
        <div className="main-content">
            <button className="mobile-fab" onClick={() => setSidebarOpen(true)}>+</button>

            <div className={`left-panel ${isSidebarOpen ? 'open' : ''}`}>
                <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>&times;</button>
                <AddCategoryForm onCategoryAdded={handleAddCategory} />
            </div>
            <div className="right-panel">
                <CategoryList categories={categories} onCategoryDeleted={handleDeleteCategory} />
            </div>
        </div>
    );
}
