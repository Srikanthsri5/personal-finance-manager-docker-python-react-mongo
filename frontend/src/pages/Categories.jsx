import { useState, useEffect } from 'react';
import CategoryList from '../components/CategoryList';
import AddCategoryForm from '../components/AddCategoryForm';
import { getCategories } from '../services/categoryService';

export default function Categories() {
    const [categories, setCategories] = useState([]);

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
    };

    const handleDeleteCategory = (id) => {
        setCategories(prev => prev.filter(cat => cat._id !== id));
    };

    return (
        <div className="main-content">
            <div className="left-panel">
                <AddCategoryForm onCategoryAdded={handleAddCategory} />
            </div>
            <div className="right-panel">
                <CategoryList categories={categories} onCategoryDeleted={handleDeleteCategory} />
            </div>
        </div>
    );
}
