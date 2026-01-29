import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
           <NavBar />
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
