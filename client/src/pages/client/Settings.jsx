import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { Lock, Bell, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Notification settings states
  const [notifEmail, setNotifEmail] = useState(user?.notificationSettings?.email ?? true);
  const [notifPush, setNotifPush] = useState(user?.notificationSettings?.push ?? true);
  const [notifChat, setNotifChat] = useState(user?.notificationSettings?.chat ?? true);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoadingPass(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setLoadingNotif(true);
    try {
      const res = await userService.updateProfile({
        notificationSettings: {
          email: notifEmail,
          push: notifPush,
          chat: notifChat,
        },
      });
      updateUser({ notificationSettings: res.user.notificationSettings });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setLoadingNotif(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you sure you want to deactivate your company account? This is irreversible.')) return;
    try {
      await userService.deleteAccount();
      toast.success('Account deactivated. Logging out...');
      logout();
    } catch (err) {
      toast.error(err.message || 'Deactivation failed');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Company Settings</h1>
        <p className="page-subtitle">Configure your password, notifications, and company deactivation preferences.</p>
      </div>

      <div className="grid grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Change Password Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-lg font-bold" style={{ marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="showPass" checked={showPass} onChange={(e) => setShowPass(e.target.checked)} />
              <label htmlFor="showPass" style={{ fontSize: '0.85rem' }}>Show passwords</label>
            </div>

            <button type="submit" disabled={loadingPass} className="btn btn-primary btn-sm align-self-start">
              Update Password
            </button>
          </form>
        </div>

        {/* Notifications Preference and Deactivation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Notifications preferences */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 20 }}><Bell size={18} /> Notification Preferences</h3>
            <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get email notices for new job applications</div>
                </div>
                <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} style={{ width: 20, height: 20 }} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Desktop Push Alerts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enable browser notifications for chat signals</div>
                </div>
                <input type="checkbox" checked={notifPush} onChange={(e) => setNotifPush(e.target.checked)} style={{ width: 20, height: 20 }} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chat Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive messages in dashboard overlay</div>
                </div>
                <input type="checkbox" checked={notifChat} onChange={(e) => setNotifChat(e.target.checked)} style={{ width: 20, height: 20 }} />
              </div>

              <button type="submit" disabled={loadingNotif} className="btn btn-primary btn-sm align-self-start">
                Save Preferences
              </button>
            </form>
          </div>

          {/* Deactivation card */}
          <div className="card" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 12, color: 'var(--color-error)' }}><UserX size={18} /> Danger Zone</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Deactivating your account will permanently suspend all your posted job listings.
            </p>
            <button onClick={handleDeleteAccount} className="btn btn-danger btn-sm">Deactivate Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
