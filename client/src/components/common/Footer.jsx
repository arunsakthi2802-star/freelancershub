import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { cmsService } from '../../services/cmsService';

const defaultFooterLinks = {
  Platform: [
    { label: 'Find Freelancers', to: '/freelancers' },
    { label: 'Browse Projects', to: '/projects' },
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Pricing Plans', to: '/#pricing' },
    { label: 'Success Stories', to: '/#testimonials' },
  ],
  Freelancers: [
    { label: 'Create Profile', to: '/register?role=freelancer' },
    { label: 'Find Jobs', to: '/projects' },
    { label: 'Freelancer Guide', to: '#' },
    { label: 'Skills Assessment', to: '#' },
    { label: 'Community Forum', to: '#' },
  ],
  Company: [
    { label: 'About Us', to: '#' },
    { label: 'Careers', to: '#' },
    { label: 'Blog', to: '#' },
    { label: 'Press', to: '#' },
    { label: 'Contact Us', to: '/#contact' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
    { label: 'Cookie Policy', to: '#' },
    { label: 'Report Abuse', to: '#' },
  ],
};

const socials = [
  { icon: Twitter, label: 'twitter' },
  { icon: Linkedin, label: 'linkedin' },
  { icon: Github, label: 'github' },
  { icon: Instagram, label: 'instagram' },
  { icon: Facebook, label: 'facebook' },
];

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    cmsService.getSettings()
      .then(res => setSettings(res.settings))
      .catch(() => {});
  }, []);

  const siteName = settings?.name || 'FreelanceHub';
  const socialLinks = settings?.socialLinks || {};

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)', marginBottom: 16 }}>
              {settings?.logo ? (
                <img src={settings.logo} alt={siteName} style={{ height: 32 }} />
              ) : (
                <div className="logo-icon"><span style={{ fontSize: 20 }}>💼</span></div>
              )}
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>{siteName}</span>
            </Link>
            <p>The world's leading platform connecting talented freelancers with innovative businesses. Build your future today.</p>
            <div className="footer-social">
              {socials.map(({ icon: Icon, label }) => (
                socialLinks[label] && (
                  <a key={label} href={socialLinks[label]} className="social-btn" title={label} target="_blank" rel="noopener noreferrer">
                    <Icon size={16} />
                  </a>
                )
              ))}

            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Mail, text: settings?.contactInfo?.email || 'support@freelancehub.com' },
                { icon: Phone, text: settings?.contactInfo?.phone || '+1 (555) 123-4567' },
                { icon: MapPin, text: settings?.contactInfo?.address || 'San Francisco, CA, USA' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <Icon size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(defaultFooterLinks).map(([title, links]) => (
            <div key={title} className="footer-links">
              <h4>{title}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{ background: 'var(--gradient-card)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 'var(--radius-lg)', padding: '32px 40px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 6 }}>Stay in the loop 📬</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Get the latest jobs, tips, and platform updates delivered to your inbox.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 420 }}>
            <input type="email" placeholder="Enter your email address" className="form-input" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Subscribe</button>
          </form>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} FreelanceHub, Inc. All rights reserved. Made with ❤️ for freelancers worldwide.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Privacy</a>
            <a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Terms</a>
            <a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
