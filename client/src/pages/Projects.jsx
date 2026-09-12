import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, DollarSign, Tag, Filter, RefreshCw } from 'lucide-react';
import { projectService } from '../services/projectService';
import { CATEGORIES, EXPERIENCE_LEVELS, PROJECT_DURATIONS, BUDGET_TYPES } from '../utils/constants';
import { getBudgetLabel, formatRelativeTime, truncate } from '../utils/helpers';

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [budgetType, setBudgetType] = useState(searchParams.get('budgetType') || '');
  const [minBudget, setMinBudget] = useState(searchParams.get('minBudget') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('maxBudget') || '');
  const [duration, setDuration] = useState(searchParams.get('duration') || '');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        status: 'open',
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        experience: searchParams.get('experience') || undefined,
        budgetType: searchParams.get('budgetType') || undefined,
        minBudget: searchParams.get('minBudget') || undefined,
        maxBudget: searchParams.get('maxBudget') || undefined,
        duration: searchParams.get('duration') || undefined,
      };

      const res = await projectService.getAll(params);
      setProjects(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchParams, page]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (search) newParams.search = search;
    if (category) newParams.category = category;
    if (experience) newParams.experience = experience;
    if (budgetType) newParams.budgetType = budgetType;
    if (minBudget) newParams.minBudget = minBudget;
    if (maxBudget) newParams.maxBudget = maxBudget;
    if (duration) newParams.duration = duration;
    setSearchParams(newParams);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setExperience('');
    setBudgetType('');
    setMinBudget('');
    setMaxBudget('');
    setDuration('');
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="section" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - var(--navbar-height))' }}>
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Browse Jobs</h1>
          <p className="text-secondary">Find the latest freelance projects and bid on work that matches your skills.</p>
        </div>

        <div className="grid-layout-sidebar-left-300">
          {/* Filters Sidebar */}
          <form onSubmit={handleApplyFilters} className="filter-panel">
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <h2 className="filter-title text-lg font-bold" style={{ margin: 0 }}><Filter size={18} /> Filters</h2>
              <button type="button" onClick={handleResetFilters} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div className="filter-section">
              <label className="filter-section-label">Search Keyword</label>
              <div className="input-group">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Title, skills, etc..."
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category */}
            <div className="filter-section">
              <label className="filter-section-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Budget Type */}
            <div className="filter-section">
              <label className="filter-section-label">Budget Type</label>
              <select className="form-select" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
                <option value="">Any Type</option>
                {BUDGET_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Budget Range */}
            <div className="filter-section">
              <label className="filter-section-label">Budget Range ($)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className="filter-section">
              <label className="filter-section-label">Experience Level</label>
              <select className="form-select" value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">Any Level</option>
                {EXPERIENCE_LEVELS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            {/* Project Duration */}
            <div className="filter-section">
              <label className="filter-section-label">Project Duration</label>
              <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="">Any Duration</option>
                {PROJECT_DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-full mt-auto">Apply Filters</button>
          </form>

          {/* Projects List */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <div className="text-secondary text-sm">
                Found <span className="font-semibold text-primary">{total}</span> open projects
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card">
                    <div className="skeleton skeleton-title" style={{ marginBottom: 12 }} />
                    <div className="skeleton skeleton-text" style={{ marginBottom: 8 }} />
                    <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-icon">📁</div>
                <h3 className="empty-title">No projects found</h3>
                <p className="empty-desc">Try loosening your search filters or check back later for new listings.</p>
                <button onClick={handleResetFilters} className="btn btn-primary btn-sm">Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {projects.map((p) => (
                  <div key={p._id} className="card animate-fade-in" style={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <Link to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
                          <h2 className="text-xl font-bold" style={{ marginBottom: 6, cursor: 'pointer' }}>{p.title}</h2>
                        </Link>
                        <div className="flex gap-4 text-xs text-secondary items-center">
                          <span className="badge badge-info">{p.category}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {formatRelativeTime(p.createdAt)}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> Deadline: {new Date(p.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                          {getBudgetLabel(p.budget)}
                        </div>
                        <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                          {p.budget.type} - {p.experience}
                        </div>
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                      {truncate(p.description, 200)}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.skills.slice(0, 5).map((s) => (
                          <span key={s} className="tag"><Tag size={10} style={{ marginRight: 4 }} /> {s}</span>
                        ))}
                      </div>
                      <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}

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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
