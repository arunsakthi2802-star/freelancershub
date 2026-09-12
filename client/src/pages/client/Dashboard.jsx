import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService, applicationService } from '../../services/projectService';
import { DollarSign, Briefcase, Plus, Users, ChevronRight, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await projectService.getClientProjects({ limit: 5 });
      setProjects(res.data || []);
      setTotalProjects(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Calculations
  const activeCount = projects.filter((p) => p.status === 'in-progress').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Welcome back, {user?.companyName || user?.name}! 👋</h1>
          <p className="page-subtitle">Track your project listings, proposals, and contractor invoices.</p>
        </div>
        <Link to="/client/post-project" className="btn btn-primary" style={{ gap: 6 }}>
          <Plus size={16} /> Post a Project
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-4" style={{ gap: 20, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <DollarSign size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{formatCurrency(user?.totalSpent || 0)}</div>
          <div className="stat-label">Total Outflow Spent</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Briefcase size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{totalProjects}</div>
          <div className="stat-label">Projects Posted</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <FileText size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active Gigs Running</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Users size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Finished Jobs</div>
        </div>
      </div>

      {/* Recent Projects Posted */}
      <div className="card" style={{ padding: 24 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <h3 className="text-lg font-bold">Recent Project Postings</h3>
          <Link to="/client/projects" className="flex items-center gap-1 text-sm text-primary" style={{ fontWeight: 600 }}>
            View All Listings <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="spinner spinner-dark" />
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>You have not posted any project listings yet.</p>
            <Link to="/client/post-project" className="btn btn-secondary btn-sm">Post Your First Job</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Proposals</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <Link to={`/projects/${p._id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.title}
                      </Link>
                    </td>
                    <td>{p.category}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                      ${p.budget.min} {p.budget.max ? `- $${p.budget.max}` : ''}
                    </td>
                    <td>{p.totalApplications} bids</td>
                    <td>
                      <span className={`badge ${p.status === 'open' ? 'badge-success' : p.status === 'in-progress' ? 'badge-info' : 'badge-primary'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
