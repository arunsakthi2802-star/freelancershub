import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Search, Star, Trash2, ShieldAlert } from 'lucide-react';
import { getBudgetLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await adminService.getProjects({
        page,
        limit: 10,
        search: search || undefined,
      });
      setProjects(res.data || []);
      setPages(res.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const handleToggleFeature = async (id) => {
    try {
      const res = await adminService.toggleFeature(id);
      toast.success(res.message || 'Project status updated');
      fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to update feature status');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Manage Projects</h1>
        <p className="page-subtitle">Vet project listings, toggle homepage features, and cancel listings.</p>
      </div>

      {/* Filter panel */}
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <form onSubmit={handleSearch} className="flex gap-4 items-center flex-wrap">
          <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <div className="input-group">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Search projects by title..."
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />
      ) : projects.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <p style={{ color: 'var(--text-muted)' }}>No projects found matching search query.</p>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Client</th>
                <th>Required Skills</th>
                <th>Budget</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id}>
                  <td className="font-semibold">{p.title}</td>
                  <td>{p.client?.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.skills.slice(0, 3).map(s => <span key={s} className="tag" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{s}</span>)}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{getBudgetLabel(p.budget)}</td>
                  <td>
                    <span className={`badge ${p.status === 'open' ? 'badge-success' : 'badge-info'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleToggleFeature(p._id)} className="btn btn-secondary btn-sm" style={{ padding: 6, color: p.isFeatured ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                        <Star size={14} style={{ fill: p.isFeatured ? 'var(--color-warning)' : 'none' }} /> Feature
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
  );
}
