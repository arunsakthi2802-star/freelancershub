import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../../services/projectService';
import { Calendar, DollarSign, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getMyApplications({ status: filterStatus || undefined });
      setApplications(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application proposal?')) return;
    try {
      await applicationService.withdraw(appId);
      toast.success('Proposal withdrawn successfully');
      fetchApplications();
    } catch (error) {
      toast.error(error.message || 'Failed to withdraw proposal');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }} className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="page-title">My Proposals</h1>
          <p className="page-subtitle">Track, manage, and withdraw your submitted bids and job applications.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['', 'pending', 'accepted', 'rejected'].map((status) => (
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
      ) : applications.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No applications found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Submit proposals to projects listed on the marketplace.</p>
          <Link to="/freelancer/browse" className="btn btn-primary btn-sm">Browse Projects</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {applications.map((app) => (
            <div key={app._id} className="card">
              <div className="flex justify-between items-start flex-wrap gap-4" style={{ marginBottom: 16 }}>
                <div>
                  <Link to={`/projects/${app.project._id}`}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }} className="text-primary">{app.project.title}</h3>
                  </Link>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Client: {app.project.client?.companyName || app.project.client?.name}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <span className={`badge ${app.status === 'accepted' ? 'badge-success' : app.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid-layout-3-col" style={{ gap: 16, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Bid Amount</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)', marginTop: 4 }}>${app.bidAmount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Delivery</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{app.deliveryTime} days</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applied On</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{formatDate(app.createdAt)}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: '0.85rem' }}>Cover Letter:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 6, whiteSpace: 'pre-line' }}>{app.coverLetter}</p>
              </div>

              {app.status === 'pending' && (
                <div className="flex justify-end" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <button onClick={() => handleWithdraw(app._id)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', gap: 6 }}>
                    <Trash2 size={14} /> Withdraw Proposal
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
