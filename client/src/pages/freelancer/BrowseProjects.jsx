import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, DollarSign, Tag, Filter, RefreshCw } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { CATEGORIES, EXPERIENCE_LEVELS, BUDGET_TYPES } from '../../utils/constants';
import { getBudgetLabel, formatRelativeTime, truncate } from '../../utils/helpers';

export default function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [budgetType, setBudgetType] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll({
        page,
        limit: 8,
        status: 'open',
        search: search || undefined,
        category: category || undefined,
        experience: experience || undefined,
        budgetType: budgetType || undefined,
      });
      setProjects(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setExperience('');
    setBudgetType('');
    setPage(1);
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Browse Projects</h1>
        <p className="page-subtitle">Find high-paying open contracts fitting your skillset.</p>
      </div>

      <div className="grid-layout-sidebar-left-280" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Filters Panel */}
        <form onSubmit={handleApplyFilters} className="filter-panel">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}><Filter size={14} /> Filter Search</h3>
            <button type="button" onClick={handleResetFilters} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>Reset</button>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label text-xs">Keywords</label>
            <input type="text" className="form-input" placeholder="Title, skills..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label text-xs">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label text-xs">Experience required</label>
            <select className="form-select" value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="">Any Experience</option>
              {EXPERIENCE_LEVELS.map(el => <option key={el.value} value={el.value}>{el.label}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label text-xs">Budget Type</label>
            <select className="form-select" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
              <option value="">Any Budget</option>
              {BUDGET_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full">Search Gigs</button>
        </form>

        {/* Results List */}
        <div>
          {loading ? (
            <div className="spinner spinner-lg spinner-dark" style={{ margin: '40px auto' }} />
          ) : projects.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
              <h4>No projects found matching query</h4>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {projects.map((p) => (
                <div key={p._id} className="card">
                  <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                    <div>
                      <Link to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }} className="text-primary">{p.title}</h4>
                      </Link>
                      <div className="flex gap-4 text-xs text-secondary" style={{ marginTop: 6 }}>
                        <span className="badge badge-info">{p.category}</span>
                        <span>• Posted {formatRelativeTime(p.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--color-success)', fontWeight: 800 }}>{getBudgetLabel(p.budget)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.experience} Level</div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>{truncate(p.description, 180)}</p>

                  <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    <div className="tags">
                      {p.skills.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
                    </div>
                    <Link to={`/projects/${p._id}`} className="btn btn-primary btn-sm">Bid Now</Link>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</button>
                  {[...Array(pages)].map((_, i) => (
                    <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                  ))}
                  <button className="page-btn" disabled={page === pages} onClick={() => setPage(page + 1)}>&gt;</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
