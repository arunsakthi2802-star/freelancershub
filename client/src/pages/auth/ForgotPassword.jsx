import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: 32, opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <KeyRound size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
          Forgot Password
        </h2>
        <p className="text-secondary text-sm">
          {submitted ? "Check your email for reset link" : "Enter your email below and we will send a password reset link"}
        </p>
      </div>

      {submitted ? (
        <div className="text-center">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            An email has been sent to <strong>{email}</strong>. Please click the link in the email to set a new password.
          </p>
          <Link to="/login" className="btn btn-secondary btn-full">
            Back to Log In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? <div className="spinner" /> : 'Send Reset Link'}
          </button>

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Back to Log In
          </Link>
        </form>
      )}
    </div>
  );
}
