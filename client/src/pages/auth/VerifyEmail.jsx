import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const doVerify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (res.user) {
          updateUser({ isEmailVerified: true });
        }
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    if (token) {
      doVerify();
    }
  }, [token]);

  return (
    <div className="card animate-fade-in text-center" style={{ padding: 32, opacity: 1 }}>
      {status === 'verifying' && (
        <div>
          <div style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <div className="spinner spinner-dark" />
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            Verifying Email...
          </h2>
          <p className="text-secondary text-sm">Please wait while we verify your registration details.</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            Email Verified!
          </h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 20 }}>
            Your account is verified. You can now access all marketplace features.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">
            Proceed to Log In
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <XCircle size={24} style={{ color: 'var(--color-error)' }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            Verification Failed
          </h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 20 }}>
            The link is invalid or expired. Please sign in to request another link.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">
            Go to Log In
          </Link>
        </div>
      )}
    </div>
  );
}

