import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleRedirect = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isAdmin) {
        result = await login({ email, password, isAdmin: true });
      } else {
        result = await login({ email, password });
      }
      const { user } = result;
      toast.success(`Welcome back, ${user.name}!`);

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'client' || user.role === 'agency') {
        navigate('/client/dashboard');
      } else {
        navigate('/freelancer/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: 32, opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
          {isAdmin ? 'Admin Portal Access' : 'Welcome Back'}
        </h2>
        <p className="text-secondary text-sm">
          {isAdmin ? 'Authorized personnel access' : 'Enter your details to log in to your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-group">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="name@company.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="form-label">Password</label>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
              Forgot password?
            </Link>
          </div>
          <div className="input-group">
            <Lock size={16} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Portal choice checkbox */}
        <div className="flex items-center gap-2" style={{ padding: '4px 0' }}>
          <input
            type="checkbox"
            id="isAdmin"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="isAdmin" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Access Admin System Portal
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-full">
          {loading ? <div className="spinner" /> : 'Log In'}
        </button>
      </form>

      {!isAdmin && (
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>
      )}
    </div>
  );
}
