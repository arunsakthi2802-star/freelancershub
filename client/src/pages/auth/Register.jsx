import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, UserCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') || 'freelancer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role || !phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (role === 'freelancer' && !skills) {
      toast.error('Please add at least one skill');
      return;
    }
    if ((role === 'client' || role === 'agency') && !companyName) {
      toast.error('Please enter your company name');
      return;
    }

    setLoading(true);
    try {
      const payload = { name, email, password, role, phone };
      if (role === 'freelancer') {
        payload.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        payload.companyName = companyName;
      }
      
      await register(payload);
      toast.success('Registration successful! Please check your email to verify.');
      if (role === 'client' || role === 'agency') {
        navigate('/client/dashboard');
      } else {
        navigate('/freelancer/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: 32, opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
          Join FreelanceHub
        </h2>
        <p className="text-secondary text-sm">Create an account to start hiring or finding work today</p>
      </div>

      {/* Role Selection Tabs */}
      <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        <button
          type="button"
          className={`tab-btn ${role === 'freelancer' ? 'active' : ''}`}
          onClick={() => setRole('freelancer')}
          style={{ flex: 1 }}
        >
          🙋 Freelancer
        </button>
        <button
          type="button"
          className={`tab-btn ${role === 'client' ? 'active' : ''}`}
          onClick={() => setRole('client')}
          style={{ flex: 1 }}
        >
          🏢 Client
        </button>
        <button
          type="button"
          className={`tab-btn ${role === 'agency' ? 'active' : ''}`}
          onClick={() => setRole('agency')}
          style={{ flex: 1 }}
        >
          🏛️ Agency
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-group">
            <User size={16} className="input-icon" />
            <input
              type="text"
              placeholder="e.g. John Doe"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-group">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="name@domain.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <div className="input-group">
            <User size={16} className="input-icon" />
            <input
              type="tel"
              placeholder="+1 (234) 567-890"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {role === 'freelancer' && (
          <div className="form-group">
            <label className="form-label">Skills (comma separated)</label>
            <div className="input-group">
              <User size={16} className="input-icon" />
              <input
                type="text"
                placeholder="React, Node.js, Design"
                className="form-input"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {(role === 'client' || role === 'agency') && (
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <div className="input-group">
              <User size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Your Company Inc."
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Password</label>
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

        <button type="submit" disabled={loading} className="btn btn-primary btn-full">
          {loading ? <div className="spinner" /> : 'Register Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Log In
        </Link>
      </div>
    </div>
  );
}
