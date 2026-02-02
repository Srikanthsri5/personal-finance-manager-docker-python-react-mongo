export const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:8005';
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    return url;
};
