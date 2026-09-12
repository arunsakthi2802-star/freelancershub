import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { Trash2, Edit2, Calendar, FileText, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { getBudgetLabel, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getClientProjects({ status: filterStatus || undefined });
      setProjects(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete/cancel this project listing?')) return;
    try {
      await projectService.delete(id);
      toast.success('Project cancelled successfully');
      fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Cancellation failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Manage Project Postings</h1>
          <p className="page-subtitle">Track bids, project progress, and manage posted descriptions.</p>
        </div>

        <div className="flex gap-2">
          {['', 'open', 'in-progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />
      ) : projects.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No projects found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You have not posted any project matching status criteria.</p>
          <Link to="/client/post-project" className="btn btn-primary btn-sm">Post a Project</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projects.map((p) => (
            <div key={p._id} className="card">
              <div className="flex justify-between items-start flex-wrap gap-4" style={{ marginBottom: 16 }}>
                <div>
                  <Link to={`/projects/${p._id}`}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }} className="text-primary">{p.title}</h3>
                  </Link>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {p.category} | Created {formatDate(p.createdAt)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className={`badge ${p.status === 'open' ? 'badge-success' : p.status === 'in-progress' ? 'badge-info' : 'badge-primary'}`}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid-layout-3-col" style={{ gap: 16, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Project Budget</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)', marginTop: 4 }}>
                    {getBudgetLabel(p.budget)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required Experience</div>
                  <div style={{ fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>{p.experience} Level</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Proposals</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{p.totalApplications} proposals</div>
                </div>
              </div>

              <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                  <FileText size={14} /> View Proposals
                </Link>

                {p.status === 'open' && (
                  <button onClick={() => handleDelete(p._id)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', gap: 6 }}>
                    <Trash2 size={14} /> Cancel Project
                  </button>
                )}

                {p.status === 'in-progress' && (
                  <Link to={`/client/payments/checkout/${p._id}`} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                    <ShieldCheck size={14} /> Complete & Pay Contractor
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
