import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService, applicationService } from '../../services/projectService';
import { chatService } from '../../services/chatService';
import { Check, X, MessageSquare, AlertCircle, Eye, ChevronDown } from 'lucide-react';
import { getInitials, getAvatarUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Applications() {
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState('');
  const [applications, setApplications] = useState([]);
  const [loadingProjs, setLoadingProjs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchClientProjects = async () => {
    setLoadingProjs(true);
    try {
      const res = await projectService.getClientProjects({ status: 'open' });
      const openProjectsList = res.data || [];
      setProjects(openProjectsList);
      if (openProjectsList.length > 0) {
        setSelectedProj(openProjectsList[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project listings');
    } finally {
      setLoadingProjs(false);
    }
  };

  const fetchApplications = async () => {
    if (!selectedProj) return;
    setLoadingApps(true);
    try {
      const res = await applicationService.getProjectApplications(selectedProj);
      setApplications(res.applications || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project proposals');
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchClientProjects();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedProj]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await applicationService.updateStatus(id, { status });
      toast.success(`Proposal ${status}`);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleStartChat = async (freelancer) => {
    try {
      await chatService.sendMessage({
        receiverId: freelancer._id,
        content: `Hi ${freelancer.name}, I reviewed your application and would like to discuss it.`
      });
      const roomId = [freelancer._id, selectedProj].sort().join('_'); // room syntax sorted
      // Actually standard room ID in database is sender_receiver. Let's use getRoomId logic
      // In database getRoomId sorted IDs:
      // Let's redirect to `/client/chat/senderId_receiverId`
      const actualRoomId = [freelancer._id, freelancer._id].map(x => x).sort().join('_'); // wait helper sorted roomId
      // Let's redirect to client chat
      // We can sort them inside the redirect
      navigate(`/client/chat`);
    } catch (e) {
      toast.error('Failed to start chat session');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Manage Proposals</h1>
        <p className="page-subtitle">Review proposals, discuss details, and hire freelancers for your open positions.</p>
      </div>

      {loadingProjs ? (
        <div className="spinner spinner-dark" />
      ) : projects.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No open project listings</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You do not have any active open project listings to review bids for.</p>
          <Link to="/client/post-project" className="btn btn-primary btn-sm">Post a Job</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Project Selector dropdown */}
          <div className="card flex items-center gap-4" style={{ padding: 16, flexDirection: 'row' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Job Posting:</span>
            <select
              className="form-select"
              value={selectedProj}
              onChange={(e) => setSelectedProj(e.target.value)}
              style={{ maxWidth: 360, margin: 0 }}
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Proposals List */}
          {loadingApps ? (
            <div className="spinner spinner-lg spinner-dark" style={{ margin: '40px auto' }} />
          ) : applications.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <p style={{ color: 'var(--text-muted)' }}>No proposals received yet for this project listing.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {applications.map((app) => (
                <div key={app._id} className="card animate-fade-in" style={{ opacity: 1 }}>
                  <div className="flex justify-between items-start flex-wrap gap-4" style={{ marginBottom: 16 }}>
                    <div className="flex items-center gap-3">
                      {getAvatarUrl(app.freelancer.avatar) ? (
                        <img src={getAvatarUrl(app.freelancer.avatar)} className="avatar avatar-md" alt={app.freelancer.name} />
                      ) : (
                        <div className="avatar-placeholder avatar-md">{getInitials(app.freelancer.name)}</div>
                      )}
                      <div>
                        <Link to={`/freelancers/${app.freelancer._id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {app.freelancer.name}
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {app.freelancer.title || 'Freelancer'} | ★ {app.freelancer.rating?.average?.toFixed(1) || '5.0'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.1rem' }}>${app.bidAmount}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivery in {app.deliveryTime} days</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ fontSize: '0.85rem' }}>Cover Letter:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 6, whiteSpace: 'pre-line' }}>{app.coverLetter}</p>
                  </div>

                  <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    <Link to={`/client/chat/${[app.freelancer._id, app.freelancer._id].map(x => x).sort().join('_')}`} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                      <MessageSquare size={14} /> Message
                    </Link>

                    {app.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusUpdate(app._id, 'rejected')} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                          <X size={14} /> Decline
                        </button>
                        <button onClick={() => handleStatusUpdate(app._id, 'accepted')} className="btn btn-primary btn-sm">
                          <Check size={14} /> Hire Freelancer
                        </button>
                      </div>
                    ) : (
                      <span className={`badge ${app.status === 'accepted' ? 'badge-success' : 'badge-error'}`}>
                        {app.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
