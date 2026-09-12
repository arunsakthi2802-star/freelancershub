import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { Sun, Moon, Bell, Menu, X, ChevronDown, Briefcase, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { notificationService } from '../../services/userService';
import { cmsService } from '../../services/cmsService';
import { getInitials, getAvatarUrl, formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { socket } = useSocket();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getAll({ limit: 5 }).then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 5));
        setUnreadCount((prev) => prev + 1);
        toast(notification.message, { icon: '🔔' });
      };

      socket.on(`notification:${user._id}`, handleNewNotification);
      return () => {
        socket.off(`notification:${user._id}`, handleNewNotification);
      };
    }
  }, [socket, user]);

  useEffect(() => {
    cmsService.getSettings()
      .then(res => setSettings(res.settings))
      .catch(() => {});
  }, []);

  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleNotifClick = (n) => {
    notificationService.markRead(n._id).catch(() => {});
    setUnreadCount(p => Math.max(0, p - 1));
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  const siteName = settings?.name || 'FreelanceHub';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
          {settings?.logo ? (
            <img src={settings.logo} alt={siteName} style={{ height: 32 }} />
          ) : (
            <div className="logo-icon"><span style={{ fontSize: 20 }}>💼</span></div>
          )}
          <span>{siteName}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-menu" style={{ display: 'flex' }}>
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Browse Jobs</NavLink>
          <NavLink to="/freelancers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Find Talent</NavLink>
          <a href="/#how-it-works" className="nav-link">How It Works</a>
          <a href="/#pricing" className="nav-link">Pricing</a>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Theme toggle */}
          <button className="btn btn-icon btn-ghost" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="dropdown notif-wrapper">
                <button className="btn btn-icon btn-ghost" onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}>
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="dropdown-menu" style={{ width: 340, right: 0 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => notificationService.markAllRead().then(() => setUnreadCount(0)).catch(() => {})}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n._id} className="dropdown-item" style={{ background: !n.isRead ? 'rgba(99,102,241,0.04)' : undefined }} onClick={() => handleNotifClick(n)}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{n.message}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{formatRelativeTime(n.createdAt)}</div>
                          </div>
                          {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))
                    )}
                    <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)' }}>
                      <Link to={`${dashboardPath.replace('/dashboard', '')}/settings`} style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }} onClick={() => setNotifOpen(false)}>
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="dropdown">
                <button className="btn btn-secondary btn-sm" style={{ gap: 8, paddingLeft: 8 }} onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}>
                  {getAvatarUrl(user?.avatar) ? (
                    <img src={getAvatarUrl(user?.avatar)} alt={user?.name} className="avatar avatar-sm" />
                  ) : (
                    <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.7rem' }}>{getInitials(user?.name)}</div>
                  )}
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="dropdown-menu">
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user?.role}</div>
                    </div>
                    <Link to={dashboardPath} className="dropdown-item" onClick={() => setUserMenuOpen(false)}><LayoutDashboard size={16} />Dashboard</Link>
                    <Link to={`${dashboardPath.replace('/dashboard', '/profile')}`} className="dropdown-item" onClick={() => setUserMenuOpen(false)}><User size={16} />Profile</Link>
                    <Link to={`${dashboardPath.replace('/dashboard', '/settings')}`} className="dropdown-item" onClick={() => setUserMenuOpen(false)}><Settings size={16} />Settings</Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" style={{ color: 'var(--color-error)' }} onClick={handleLogout}><LogOut size={16} />Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button className="btn btn-icon btn-ghost show-mobile-flex" onClick={() => setMobileOpen(o => !o)} id="mobile-menu-btn">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavLink to="/projects" className="nav-link" onClick={() => setMobileOpen(false)}>Browse Jobs</NavLink>
          <NavLink to="/freelancers" className="nav-link" onClick={() => setMobileOpen(false)}>Find Talent</NavLink>
          <a href="/#how-it-works" className="nav-link" onClick={() => setMobileOpen(false)}>How It Works</a>
          {!isAuthenticated ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Link to="/login" className="btn btn-secondary btn-sm btn-full" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm btn-full" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          ) : (
            <Link to={dashboardPath} className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {(userMenuOpen || notifOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => { setUserMenuOpen(false); setNotifOpen(false); }} />
      )}
    </nav>
  );
}
