/**
 * Sidebar.jsx — App navigation sidebar
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'My Tasks',  icon: '✅', path: '/tasks' },
];

const adminItems = [
  { label: 'Admin Panel', icon: '🛡️', path: '/admin' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <span>TaskFlow</span>
      </div>

      <nav className="nav-section">
        <div className="nav-section-label">Menu</div>
        {navItems.map((item) => (
          <button
            key={item.path}
            id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {user?.role === 'ADMIN' && (
        <nav className="nav-section" style={{ marginTop: 8 }}>
          <div className="nav-section-label">Admin</div>
          {adminItems.map((item) => (
            <button
              key={item.path}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-email">{user?.email}</div>
            <div className="user-role">
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
        <button
          id="btn-logout"
          className="btn btn-ghost btn-full btn-sm"
          onClick={logout}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
