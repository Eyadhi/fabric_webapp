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
  const { isAdmin, hasPermission } = useAuth();

  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: Home,
      description: 'Overview & Analytics',
      permission: null // Always visible
    },
    {
      path: '/workers',
      name: 'Workers',
      icon: Users,
      description: 'Manage Workers',
      permission: null // Always visible
    },
    {
      path: '/products',
      name: 'Products',
      icon: Package,
      description: 'Product Management',
      permission: null // Always visible
    },
    {
      path: '/meters',
      name: 'Machines',
      icon: Factory,
      description: 'Machine Operations',
      permission: null // Always visible
    },
    {
      path: '/shift-assignment',
      name: 'Shift Assignment',
      icon: Clock,
      description: 'Assign Worker Shifts',
      permission: null // Always visible
    },
    {
      path: '/salary-calculation',
      name: 'Salary Calculation',
      icon: DollarSign,
      description: 'Calculate Salaries',
      permission: null // Always visible
    },
    {
      path: '/stored-files',
      name: 'Files',
      icon: Archive,
      description: 'Document Storage',
      permission: null // Always visible
    },
    // Admin-only menu items
    {
      path: '/roles',
      name: 'Roles',
      icon: Shield,
      description: 'Manage User Roles',
      permission: 'create_role',
      adminOnly: true
    },
    {
      path: '/admin/users',
      name: 'User Management',
      icon: UserPlus,
      description: 'Add/Manage Users',
      permission: 'create_user',
      adminOnly: true
    }
  ];

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin()) {
      return false;
    }
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
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

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive ? 'active' : ''} ${item.adminOnly ? 'admin-only' : ''}`}
                  title={isCollapsed ? item.name : ''}
                >
                  <div className="nav-icon">
                    <Icon size={20} />
                  </div>
                  {!isCollapsed && (
                    <div className="nav-content">
                      <span className="nav-title">{item.name}</span>
                      <span className="nav-description">{item.description}</span>
                      {item.adminOnly && (
                        <span className="admin-label">Admin</span>
                      )}
                    </div>
                  )}
                  {isActive && <div className="active-indicator" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="footer-content">
            <p className="footer-text">Version 1.0.0</p>
            <p className="footer-subtext">© 2026 Fabric Management</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;