import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Archive, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Fabric Management System
        </Link>

        {user && (
          <div className="flex items-center gap-10">
            <ul className="navbar-nav">
              <li>
                <Link
                  to="/"
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/workers"
                  className={`nav-link ${location.pathname === '/workers' ? 'active' : ''}`}
                >
                  Workers
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/meters"
                  className={`nav-link ${location.pathname === '/meters' ? 'active' : ''}`}
                >
                  Machines
                </Link>
              </li>
              <li>
                <Link
                  to="/expenses"
                  className={`nav-link ${location.pathname === '/expenses' ? 'active' : ''}`}
                >
                  Expenses
                </Link>
              </li>
              <li>
                <Link
                  to="/stored-files"
                  className={`nav-link ${location.pathname === '/stored-files' ? 'active' : ''}`}
                >
                  <Archive size={16} style={{ marginRight: '5px' }} />
                  Files
                </Link>
              </li>
            </ul>

            <button
              onClick={handleLogout}
              className="btn btn-secondary flex items-center gap-10"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;