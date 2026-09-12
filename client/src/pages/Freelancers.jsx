import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, DollarSign, Star, Tag, Filter, RefreshCw, Briefcase } from 'lucide-react';
import { userService } from '../services/userService';
import { POPULAR_SKILLS, AVAILABILITY_OPTIONS } from '../utils/constants';
import { getInitials, getAvatarUrl } from '../utils/helpers';

export default function Freelancers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [skills, setSkills] = useState(searchParams.get('skills') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');
  const [minRate, setMinRate] = useState(searchParams.get('minRate') || '');
  const [maxRate, setMaxRate] = useState(searchParams.get('maxRate') || '');

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const params = {
        role: 'freelancer',
        page,
        limit: 12,
        search: searchParams.get('search') || undefined,
        skills: searchParams.get('skills') || undefined,
        availability: searchParams.get('availability') || undefined,
        minRate: searchParams.get('minRate') || undefined,
        maxRate: searchParams.get('maxRate') || undefined,
      };

      const res = await userService.getAll(params);
      setFreelancers(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, [searchParams, page]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (search) newParams.search = search;
    if (skills) newParams.skills = skills;
    if (availability) newParams.availability = availability;
    if (minRate) newParams.minRate = minRate;
    if (maxRate) newParams.maxRate = maxRate;
    setSearchParams(newParams);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSkills('');
    setAvailability('');
    setMinRate('');
    setMaxRate('');
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="section" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - var(--navbar-height))' }}>
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Find Top Freelance Talent</h1>
          <p className="text-secondary">Hire the best experts and developers for your next business project.</p>
        </div>

        <div className="grid-layout-sidebar-left-300">
          {/* Sidebar Filters */}
          <form onSubmit={handleApplyFilters} className="filter-panel">
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <h2 className="filter-title text-lg font-bold" style={{ margin: 0 }}><Filter size={18} /> Filters</h2>
              <button type="button" onClick={handleResetFilters} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div className="filter-section">
              <label className="filter-section-label">Name or Title</label>
              <div className="input-group">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="e.g. Designer, React..."
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Skills filter */}
            <div className="filter-section">
              <label className="filter-section-label">Skills (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. React, Node"
                className="form-input"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            {/* Hourly Rate */}
            <div className="filter-section">
              <label className="filter-section-label">Hourly Rate ($/hr)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="filter-section">
              <label className="filter-section-label">Availability</label>
              <select className="form-select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="">Any Availability</option>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-full mt-auto">Apply Filters</button>
          </form>

          {/* Freelancers List */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <div className="text-secondary text-sm">
                Found <span className="font-semibold text-primary">{total}</span> professional freelancers
              </div>
            </div>

            {loading ? (
              <div className="grid grid-3" style={{ gap: 20 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card" style={{ padding: 24 }}>
                    <div className="skeleton skeleton-avatar" style={{ width: 64, height: 64, margin: '0 auto 16px' }} />
                    <div className="skeleton skeleton-title" style={{ width: '60%', margin: '0 auto 8px' }} />
                    <div className="skeleton skeleton-text" style={{ marginBottom: 6 }} />
                    <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : freelancers.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-icon">👥</div>
                <h3 className="empty-title">No freelancers found</h3>
                <p className="empty-desc">Try search filters with different options or search terms.</p>
                <button onClick={handleResetFilters} className="btn btn-primary btn-sm">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-3" style={{ gap: 20 }}>
                  {freelancers.map((f) => (
                    <div key={f._id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: 1 }}>
                      {getAvatarUrl(f.avatar) ? (
                        <img src={getAvatarUrl(f.avatar)} className="avatar avatar-lg" style={{ marginBottom: 12 }} alt={f.name} />
                      ) : (
                        <div className="avatar-placeholder avatar-lg" style={{ fontSize: '1.2rem', marginBottom: 12 }}>{getInitials(f.name)}</div>
                      )}

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{f.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 10 }}>{f.title || 'Expert Freelancer'}</p>

                      <div className="flex items-center gap-1" style={{ marginBottom: 12, fontSize: '0.85rem' }}>
                        <Star size={14} style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />
                        <span style={{ fontWeight: 600 }}>{f.rating?.average?.toFixed(1) || '5.0'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({f.rating?.count || 0})</span>
                      </div>

                      {f.skills && (
                        <div className="flex flex-wrap gap-1 justify-center" style={{ marginBottom: 16 }}>
                          {f.skills.slice(0, 3).map((s) => (
                            <span key={s} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{s}</span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto w-full flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {f.hourlyRate ? `$${f.hourlyRate}/hr` : 'Negotiable'}
                        </div>
                        <Link to={`/freelancers/${f._id}`} className="btn btn-secondary btn-sm">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      &lt;
                    </button>
                    {[...Array(pages)].map((_, i) => (
                      <button
                        key={i}
                        className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="page-btn"
                      disabled={page === pages}
                      onClick={() => setPage(page + 1)}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
