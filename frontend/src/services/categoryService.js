const API_URL = 'http://localhost:8005/api/categories';

export const getCategories = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
};

export const createCategory = async (category) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
};

export const deleteCategory = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return response.json();
};
