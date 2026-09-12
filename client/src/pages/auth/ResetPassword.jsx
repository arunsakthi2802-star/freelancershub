import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password reset successful! Please log in.');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: 32, opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldCheck size={24} style={{ color: 'var(--color-success)' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
          Reset Password
        </h2>
        <p className="text-secondary text-sm">Create a strong new password for your account</p>
      </div>

      {success ? (
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            Your password has been successfully updated. You can now use your new password to log in.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">
            Log In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-group">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="Min 6 characters"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div className="input-group">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="Repeat password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? <div className="spinner" /> : 'Update Password'}
          </button>

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Cancel
          </Link>
        </form>
      )}
    </div>
  );
}
