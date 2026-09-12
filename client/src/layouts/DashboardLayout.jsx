import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, User, Search, FileText, DollarSign, MessageSquare,
  Settings, Building2, PlusSquare, FolderKanban, Users, Star, Shield,
  Bell, Sun, Moon, LogOut, Menu, X, ChevronRight, Globe
} from 'lucide-react';
import { getInitials, getAvatarUrl, formatRelativeTime } from '../utils/helpers';
import { notificationService } from '../services/userService';

const navItems = {
  freelancer: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/freelancer/dashboard' },
    { icon: User, label: 'My Profile', to: '/freelancer/profile' },
    { icon: Search, label: 'Browse Jobs', to: '/freelancer/browse' },
    { icon: FileText, label: 'Applications', to: '/freelancer/applications', badge: true },
    { icon: DollarSign, label: 'Earnings', to: '/freelancer/earnings' },
    { icon: MessageSquare, label: 'Messages', to: '/freelancer/chat' },
    { icon: Settings, label: 'Settings', to: '/freelancer/settings' },
  ],
  client: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/client/dashboard' },
    { icon: Building2, label: 'Company Profile', to: '/client/profile' },
    { icon: PlusSquare, label: 'Post Project', to: '/client/post-project' },
    { icon: FolderKanban, label: 'My Projects', to: '/client/projects' },
    { icon: Users, label: 'Applications', to: '/client/applications', badge: true },
    { icon: MessageSquare, label: 'Messages', to: '/client/chat' },
    { icon: DollarSign, label: 'Payments', to: '/client/payments' },
    { icon: Settings, label: 'Settings', to: '/client/settings' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: Users, label: 'Manage Users', to: '/admin/users' },
    { icon: FolderKanban, label: 'Manage Projects', to: '/admin/projects' },
    { icon: Star, label: 'Reviews', to: '/admin/reviews' },
    { icon: Globe, label: 'Website Editor', to: '/admin/editor' },
  ],
};

export default function DashboardLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    notificationService.getAll({ limit: 5 }).then((data) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const items = navItems[role] || [];

  return (
    <div className="dashboard-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 799 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
            <div className="logo-icon"><span style={{ fontSize: 18 }}>💼</span></div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>FreelanceHub</span>
          </NavLink>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {getAvatarUrl(user?.avatar) ? (
              <img src={getAvatarUrl(user?.avatar)} className="avatar avatar-md" alt={user?.name} />
            ) : (
              <div className="avatar-placeholder avatar-md" style={{ fontSize: '0.8rem' }}>{getInitials(user?.name)}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, background: 'var(--color-success)', borderRadius: '50%', display: 'block' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="sidebar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="sidebar-item" style={{ width: '100%' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="sidebar-item" style={{ width: '100%', color: 'var(--color-error)' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="dashboard-main">
        {/* Dashboard Header */}
        <header className="dashboard-header">
          <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(true)} style={{ display: 'none' }} id="sidebar-toggle">
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span style={{ textTransform: 'capitalize' }}>{role} Portal</span>
            <ChevronRight size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-icon btn-ghost" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="notif-wrapper">
              <button className="btn btn-icon btn-ghost">
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {getAvatarUrl(user?.avatar) ? (
                <img src={getAvatarUrl(user?.avatar)} className="avatar avatar-sm" alt={user?.name} />
              ) : (
                <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.7rem' }}>{getInitials(user?.name)}</div>
              )}
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
