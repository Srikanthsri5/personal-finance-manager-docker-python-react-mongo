import { Link } from 'react-router-dom';

export default function NavBar() {
    return (
        <nav className="navbar">
            <div className="nav-brand">Finance Manager</div>
            <ul className="nav-links">
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/categories">Categories</Link></li>
            </ul>
        </nav>
    );
}
