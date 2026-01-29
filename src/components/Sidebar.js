import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Package,
  Archive,
  ChevronLeft,
  ChevronRight,
  Factory,
  Clock,
  DollarSign,
  Shield,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { isAdmin } = useAuth(); // 🔥 ONLY isAdmin used

  /* =========================
     MENU CONFIG
  ========================== */
  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: Home,
      description: 'Overview & Analytics',
      showFor: ['USER']
    },
    {
      path: '/workers',
      name: 'Workers',
      icon: Users,
      description: 'Manage Workers',
      showFor: ['USER']
    },
    {
      path: '/products',
      name: 'Products',
      icon: Package,
      description: 'Product Management',
      showFor: ['USER']
    },
    {
      path: '/meters',
      name: 'Machines',
      icon: Factory,
      description: 'Machine Operations',
      showFor: ['USER']
    },
    {
      path: '/shift-assignment',
      name: 'Shift Assignment',
      icon: Clock,
      description: 'Assign Worker Shifts',
      showFor: ['USER']
    },
    {
      path: '/salary-calculation',
      name: 'Salary Calculation',
      icon: DollarSign,
      description: 'Calculate Salaries',
      showFor: ['USER']
    },
    {
      path: '/stored-files',
      name: 'Files',
      icon: Archive,
      description: 'Document Storage',
      showFor: ['USER']
    },
    {
      path: '/expenses',
      name: 'Expenses',
      icon: Package,
      description: 'Expense Management',
      showFor: ['USER']
    },

    // ADMIN MODULES
    {
      path: '/roles',
      name: 'Roles',
      icon: Shield,
      description: 'Manage User Roles',
      showFor: ['ADMIN']
    },
    {
      path: '/admin/users',
      name: 'User Management',
      icon: UserPlus,
      description: 'Add / Manage Users',
      showFor: ['ADMIN']
    }
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (isAdmin()) {
      return item.showFor.includes('ADMIN');
    }
    return item.showFor.includes('USER');
  });

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {!isCollapsed && (
            <div>
              <h2 className="brand-title">Fabric MS</h2>
              <p className="brand-subtitle">Management System</p>
              {isAdmin() && (
                <span className="admin-badge">Admin</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-btn"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.name : ''}
                >
                  <div className="nav-icon">
                    <Icon size={20} />
                  </div>

                  {!isCollapsed && (
                    <div className="nav-content">
                      <span className="nav-title">{item.name}</span>
                      <span className="nav-description">
                        {item.description}
                      </span>
                    </div>
                  )}

                  {isActive && <div className="active-indicator" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <p className="footer-text">Version 1.0.0</p>
          <p className="footer-subtext">© 2026 Fabric Management</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;