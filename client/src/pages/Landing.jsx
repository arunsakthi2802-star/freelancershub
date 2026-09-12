import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Star, Users, Briefcase, DollarSign, Check, ChevronDown, ChevronUp, Shield, Zap, Globe, Award, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { CATEGORIES, POPULAR_SKILLS, TESTIMONIALS, FAQS } from '../utils/constants';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import { cmsService } from '../services/cmsService';
import { getInitials, getAvatarUrl, getBudgetLabel, formatDate } from '../utils/helpers';

export default function Landing() {
  const [search, setSearch] = useState('');
  const [searchCat, setSearchCat] = useState('');
  const [freelancers, setFreelancers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  
  // Dynamic CMS States
  const [homepage, setHomepage] = useState(null);
  const [settings, setSettings] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    userService.getTopFreelancers().then((d) => setFreelancers(d.freelancers || [])).catch(() => {});
    projectService.getFeatured().then((d) => setProjects(d.projects || [])).catch(() => {});
    cmsService.getHomepage().then((d) => setHomepage(d.content)).catch(() => {});
    cmsService.getSettings().then((d) => setSettings(d.settings)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/projects?search=${search}${searchCat ? `&category=${searchCat}` : ''}`);
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg-orb hero-bg-orb-1" />
        <div className="hero-bg-orb hero-bg-orb-2" />
        <div className="hero-bg-orb hero-bg-orb-3" />
        <div className="container" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="hero-content animate-fade-in">
            <div className="hero-badge">
              <span>✨</span> Trusted by 50,000+ professionals worldwide
            </div>
            <h1 className="hero-title">
              {homepage?.hero?.title ? (
                homepage.hero.title
              ) : (
                <>Find the <span className="text-gradient">Perfect Freelancer</span><br />for Any Project</>
              )}
            </h1>
            <p className="hero-subtitle">
              {homepage?.hero?.subtitle || 'Connect with world-class freelancers, collaborate seamlessly, and bring your vision to life — all on one secure platform.'}
            </p>

            {/* Search */}
            <form onSubmit={handleSearch}>
              <div className="search-box">
                <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  className="search-input"
                  placeholder="Search for skills, services, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="search-divider" />
                <select className="search-category" value={searchCat} onChange={(e) => setSearchCat(e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <button type="submit" className="btn btn-primary">Search</button>
              </div>
            </form>

            {/* Popular searches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Popular:</span>
              {['React Developer', 'UI/UX Designer', 'Python', 'WordPress', 'Mobile App'].map((s) => (
                <button key={s} className="tag" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects?search=${s}`)}>{s}</button>
              ))}
            </div>

            {/* Hero stats */}
            <div className="hero-stats">
              {[
                { num: '50K+', label: 'Active Freelancers' },
                { num: '12K+', label: 'Happy Clients' },
                { num: '95K+', label: 'Projects Done' },
                { num: '$8M+', label: 'Total Paid Out' },
              ].map((s) => (
                <div key={s.label} className="hero-stat">
                  <div className="hero-stat-num">{s.num}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {homepage?.sectionsVisibility?.categories !== false && (
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">🗂️ Browse by Category</span>
            <h2 className="section-title">Explore Top <span className="text-gradient">Job Categories</span></h2>
            <p className="section-desc">Find the perfect freelance service in your industry from our wide range of specialized categories.</p>
          </div>
          <div className="grid grid-4" style={{ gap: 16 }}>
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.name} to={`/projects?category=${cat.name}`}
                className="card animate-fade-in"
                style={{ textAlign: 'center', padding: '28px 16px', animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{cat.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{cat.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browse projects →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Featured Freelancers ── */}
      {homepage?.sectionsVisibility?.featuredFreelancers !== false && (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">⭐ Top Talent</span>
            <h2 className="section-title">Featured <span className="text-gradient">Freelancers</span></h2>
            <p className="section-desc">Work with our top-rated professionals who have been vetted for their expertise and reliability.</p>
          </div>

          {freelancers.length === 0 ? (
            <div className="grid grid-4" style={{ gap: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <div className="skeleton skeleton-avatar" style={{ width: 64, height: 64, marginBottom: 16 }} />
                  <div className="skeleton skeleton-title" style={{ marginBottom: 8 }} />
                  <div className="skeleton skeleton-text" style={{ marginBottom: 6 }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-4" style={{ gap: 20 }}>
              {freelancers.slice(0, 8).map((f, i) => (
                <Link key={f._id} to={`/freelancers/${f._id}`} className="card animate-fade-in" style={{ animationDelay: `${i * 0.08}s`, opacity: 0, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {getAvatarUrl(f.avatar) ? (
                      <img src={getAvatarUrl(f.avatar)} className="avatar avatar-xl" style={{ marginBottom: 16 }} alt={f.name} />
                    ) : (
                      <div className="avatar-placeholder avatar-xl" style={{ fontSize: '1.5rem', marginBottom: 16 }}>{getInitials(f.name)}</div>
                    )}
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 10 }}>{f.title || 'Freelancer'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                      <span style={{ color: 'var(--color-warning)', fontSize: '0.9rem' }}>★</span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.rating?.average?.toFixed(1) || '5.0'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({f.rating?.count || 0})</span>
                    </div>
                    {f.skills && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
                        {f.skills.slice(0, 3).map((s) => <span key={s} className="tag" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                      </div>
                    )}
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {f.hourlyRate ? `$${f.hourlyRate}/hr` : 'Negotiable'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/freelancers" className="btn btn-outline btn-lg">View All Freelancers <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
      )}

      {/* ── Featured Projects ── */}
      {homepage?.sectionsVisibility?.featuredProjects !== false && (
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">🚀 Latest Opportunities</span>
            <h2 className="section-title">Featured <span className="text-gradient">Projects</span></h2>
            <p className="section-desc">Discover exciting projects posted by industry-leading companies looking for talented professionals.</p>
          </div>
          {projects.length === 0 ? (
            <div className="grid grid-3" style={{ gap: 20 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton skeleton-title" style={{ marginBottom: 12 }} />
                  <div className="skeleton skeleton-text" style={{ marginBottom: 6 }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-3" style={{ gap: 20 }}>
              {projects.map((p, i) => (
                <Link key={p._id} to={`/projects/${p._id}`} className="card animate-fade-in" style={{ animationDelay: `${i * 0.08}s`, opacity: 0, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className={`badge badge-success`}>{p.status}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem', lineHeight: 1.4 }} className="line-clamp-2">{p.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 14 }} className="line-clamp-2">{p.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {p.skills?.slice(0, 3).map((s) => <span key={s} className="tag">{s}</span>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>{getBudgetLabel(p.budget)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} />{p.totalApplications} proposals
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/projects" className="btn btn-outline btn-lg">Browse All Projects <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
      )}

      {/* ── Popular Skills ── */}
      {homepage?.sectionsVisibility?.popularSkills !== false && (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">🔥 Trending</span>
            <h2 className="section-title">Popular <span className="text-gradient">Skills</span></h2>
            <p className="section-desc">Explore the most in-demand skills and find your next opportunity.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {POPULAR_SKILLS.map((skill, i) => (
              <Link key={skill} to={`/projects?search=${skill}`}
                className="tag animate-fade-in"
                style={{ padding: '10px 18px', fontSize: '0.875rem', animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                {skill}
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Why Choose Us ── */}
      {homepage?.sectionsVisibility?.whyChooseUs !== false && (
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">💡 Why FreelanceHub</span>
            <h2 className="section-title">Built for <span className="text-gradient">Success</span></h2>
            <p className="section-desc">We provide everything you need to hire, collaborate, and grow — all in one place.</p>
          </div>
          <div className="grid grid-3" style={{ gap: 24 }}>
            {[
              { icon: Shield, color: '#6366f1', title: 'Secure Payments', desc: 'Escrow-based payment protection. Your money is safe until you approve the work.' },
              { icon: Award, color: '#8b5cf6', title: 'Verified Talent', desc: 'Every freelancer is vetted and reviewed. Work only with trusted professionals.' },
              { icon: Zap, color: '#06b6d4', title: 'Fast Hiring', desc: 'Get proposals within hours. Our smart matching connects you with the right talent instantly.' },
              { icon: Globe, color: '#10b981', title: 'Global Talent', desc: 'Access 50,000+ freelancers across 150+ countries. No borders, no limits.' },
              { icon: TrendingUp, color: '#f59e0b', title: 'Grow Your Business', desc: 'Scale your team flexibly. Hire for any duration without long-term commitments.' },
              { icon: MessageCircle, color: '#ef4444', title: 'Real-time Collaboration', desc: 'Chat, share files, and track progress in real-time with our built-in tools.' },
            ].map((item, i) => (
              <div key={item.title} className="card animate-fade-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: `1px solid ${item.color}30` }}>
                  <item.icon size={24} style={{ color: item.color }} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: '1.05rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── How It Works ── */}
      {homepage?.sectionsVisibility?.howItWorks !== false && (
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-label">🗺️ Simple Process</span>
            <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>
            <p className="section-desc">Get started in minutes with our simple, intuitive process.</p>
          </div>
          <div className="grid grid-2" style={{ gap: 60, alignItems: 'center' }}>
            {/* For clients */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 32, color: 'var(--color-primary)' }}>For Clients</h3>
              {[
                { step: '01', title: 'Post Your Project', desc: 'Describe your project, set your budget and timeline.' },
                { step: '02', title: 'Review Proposals', desc: 'Receive proposals from qualified freelancers and compare.' },
                { step: '03', title: 'Hire the Best', desc: 'Select the perfect freelancer and get started immediately.' },
                { step: '04', title: 'Pay Securely', desc: 'Release payments only when you\'re 100% satisfied.' },
              ].map((s, i) => (
                <div key={s.step} className="animate-fade-in" style={{ display: 'flex', gap: 20, marginBottom: 28, animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <Link to="/register?role=client" className="btn btn-primary btn-lg">Post a Project <ArrowRight size={16} /></Link>
            </div>

            {/* For freelancers */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 32, color: 'var(--color-secondary)' }}>For Freelancers</h3>
              {[
                { step: '01', title: 'Create Your Profile', desc: 'Showcase your skills, portfolio, and set your rates.' },
                { step: '02', title: 'Browse & Apply', desc: 'Find projects matching your expertise and submit proposals.' },
                { step: '03', title: 'Deliver Excellence', desc: 'Collaborate seamlessly and deliver outstanding work.' },
                { step: '04', title: 'Get Paid Fast', desc: 'Receive secure payments directly to your account.' },
              ].map((s, i) => (
                <div key={s.step} className="animate-fade-in" style={{ display: 'flex', gap: 20, marginBottom: 28, animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <Link to="/register?role=freelancer" className="btn btn-outline btn-lg" style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}>
                Join as Freelancer <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Testimonials ── */}
      {homepage?.sectionsVisibility?.testimonials !== false && (
      <section className="section" id="testimonials" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">💬 What They Say</span>
            <h2 className="section-title">Loved by <span className="text-gradient">Thousands</span></h2>
            <p className="section-desc">Hear from our community of freelancers and clients who have transformed their careers on FreelanceHub.</p>
          </div>
          <div className="grid grid-3" style={{ gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.id} className="testimonial-card animate-fade-in" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                <div className="testimonial-quote">"</div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {[...Array(t.rating)].map((_, j) => <span key={j} style={{ color: 'var(--color-warning)' }}>★</span>)}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="avatar-placeholder avatar-md" style={{ fontSize: '0.75rem', background: 'var(--gradient-primary)' }}>{getInitials(t.name)}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Pricing ── */}
      {homepage?.sectionsVisibility?.pricing !== false && (
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-label">💳 Transparent Pricing</span>
            <h2 className="section-title">Simple, <span className="text-gradient">Honest Pricing</span></h2>
            <p className="section-desc">No hidden fees. Choose the plan that works best for your needs.</p>
          </div>
          <div className="grid grid-3" style={{ gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {[
              {
                name: 'Starter', price: 0, period: '/month',
                desc: 'Perfect for getting started',
                features: ['5 project applications', 'Basic profile', 'Standard support', 'Community access'],
                btn: 'Get Started Free', variant: 'secondary',
              },
              {
                name: 'Professional', price: 19, period: '/month',
                desc: 'For serious freelancers & clients',
                features: ['Unlimited applications', 'Featured profile badge', 'Priority support', 'Advanced analytics', 'Portfolio showcase', 'Verified badge'],
                btn: 'Start Pro', variant: 'primary', popular: true,
              },
              {
                name: 'Enterprise', price: 49, period: '/month',
                desc: 'For teams and agencies',
                features: ['Everything in Pro', 'Team management', 'Dedicated account manager', 'Custom contracts', 'API access', 'White-label options'],
                btn: 'Contact Sales', variant: 'secondary',
              },
            ].map((plan) => (
              <div key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="pricing-popular-badge"><span className="badge badge-primary">Most Popular</span></div>}
                <div className="pricing-name">{plan.name}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 8 }}>{plan.desc}</p>
                <div className="pricing-price">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  <span>{plan.price > 0 ? plan.period : ''}</span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((f) => (
                    <li key={f} className="pricing-feature">
                      <Check size={16} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`btn btn-${plan.variant} btn-full`}>{plan.btn}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── FAQ ── */}
      {homepage?.sectionsVisibility?.faq !== false && (
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="section-header">
            <span className="section-label">❓ Got Questions</span>
            <h2 className="section-title">Frequently Asked <span className="text-gradient">Questions</span></h2>
          </div>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> : <ChevronDown size={20} style={{ flexShrink: 0 }} />}
                </div>
                {openFaq === i && <div className="faq-answer animate-fade-in">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── CTA ── */}
      {homepage?.sectionsVisibility?.contact !== false && (
      <section className="section" id="contact">
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ background: 'var(--gradient-primary)', borderRadius: 'var(--radius-xl)', padding: '64px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
                Ready to Transform Your Career?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
                Join 50,000+ professionals already building their future on FreelanceHub.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register?role=freelancer" className="btn btn-xl" style={{ background: '#fff', color: 'var(--color-primary)', fontWeight: 700 }}>
                  Start as Freelancer <ArrowRight size={18} />
                </Link>
                <Link to="/register?role=client" className="btn btn-xl" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }}>
                  Hire Talent Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
