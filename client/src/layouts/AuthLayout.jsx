import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--gradient-hero)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div className="hero-bg-orb hero-bg-orb-1" />
      <div className="hero-bg-orb hero-bg-orb-2" />

      {/* Left branding panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        zIndex: 1,
      }} className="hide-mobile">
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', textDecoration: 'none' }}>
          <div className="logo-icon" style={{ width: 48, height: 48 }}>
            <span style={{ fontSize: '24px' }}>💼</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            FreelanceHub
          </span>
        </a>

        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Join <span className="text-gradient">50,000+</span> professionals worldwide
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: 40 }}>
            Connect with top talent, build amazing projects, and grow your career with FreelanceHub.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { num: '50K+', label: 'Freelancers' },
              { num: '12K+', label: 'Clients' },
              { num: '$8M+', label: 'Paid Out' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.num}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth form panel */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 40px',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-color)',
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center', textDecoration: 'none' }} className="show-mobile">
            <div className="logo-icon"><span style={{ fontSize: 20 }}>💼</span></div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>FreelanceHub</span>
          </a>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
