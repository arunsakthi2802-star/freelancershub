import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { projectService, applicationService } from '../services/projectService';
import { chatService } from '../services/chatService';
import {
  Calendar, Clock, DollarSign, Tag, Users, Award, Shield, FileText,
  AlertCircle, ChevronRight, MessageSquare, Check, X, ArrowLeft
} from 'lucide-react';
import { getBudgetLabel, formatDate, getDaysLeft } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const socket = useSocket();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [userApplication, setUserApplication] = useState(null);

  // Proposal form states
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const res = await projectService.getById(id);
      setProject(res.project);

      // If user is client owner or admin, fetch applications list
      if (isAuthenticated && (user.role === 'admin' || user._id === res.project.client._id)) {
        setLoadingApps(true);
        const appsRes = await applicationService.getProjectApplications(id);
        setApplications(appsRes.applications || []);
        setLoadingApps(false);
      }

      // If user is freelancer, check if they have applied
      if (isAuthenticated && user.role === 'freelancer') {
        const myAppsRes = await applicationService.getMyApplications();
        const found = myAppsRes.data?.find((app) => app.project._id === id);
        if (found) {
          setHasApplied(true);
          setUserApplication(found);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id, isAuthenticated, user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!coverLetter || !bidAmount || !deliveryTime) {
      toast.error('Please fill in all proposal fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await applicationService.apply({
        projectId: project._id,
        coverLetter,
        bidAmount: parseFloat(bidAmount),
        deliveryTime: parseInt(deliveryTime),
      });
      toast.success('Proposal submitted successfully!');
      setHasApplied(true);
      setUserApplication(res.application);
    } catch (error) {
      toast.error(error.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appId, status) => {
    try {
      await applicationService.updateStatus(appId, { status });
      toast.success(`Proposal ${status}`);
      // Refresh list
      fetchProjectData();
    } catch (error) {
      toast.error(error.message || 'Failed to update proposal status');
    }
  };

  const handleChat = async (otherUser) => {
    try {
      // Create chat session/room
      await chatService.sendMessage({
        receiverId: otherUser._id,
        content: `Hi ${otherUser.name}, I am interested in collaborating on this project: "${project.title}".`
      });
      const roomId = [user._id, otherUser._id].sort().join('_');
      navigate(`/${user.role}/chat/${roomId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner spinner-lg spinner-dark" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container text-center section">
        <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 16 }} />
        <h2>Project Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>This project listing does not exist or has been removed.</p>
        <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
      </div>
    );
  }

  const daysLeft = getDaysLeft(project.deadline);

  return (
    <div className="section" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - var(--navbar-height))' }}>
      <div className="container">
        <Link to="/projects" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, gap: 4 }}>
          <ArrowLeft size={16} /> Back to Browse
        </Link>

        <div className="grid-layout-sidebar-right-360">
          {/* Left Column: Project Details */}
          <div>
            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
              <div className="flex justify-between items-start" style={{ marginBottom: 20 }}>
                <div>
                  <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
                    {project.title}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-secondary">
                    <span className="badge badge-info">{project.category}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> Posted {formatDate(project.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {project.totalApplications} Proposals
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>
                    {getBudgetLabel(project.budget)}
                  </div>
                  <div className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>
                    {project.budget.type} - {project.experience} Experience Required
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ marginBottom: 32 }}>
                <h3 className="text-lg font-bold" style={{ marginBottom: 12 }}>Description</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {project.description}
                </p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3 className="text-lg font-bold" style={{ marginBottom: 12 }}>Required Skills</h3>
                <div className="tags">
                  {project.skills.map((s) => (
                    <span key={s} className="tag" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Attachments if any */}
              {project.attachments?.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 className="text-lg font-bold" style={{ marginBottom: 12 }}>Attachments</h3>
                  <div className="flex flex-col gap-2">
                    {project.attachments.map((file, idx) => (
                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary" style={{ textDecoration: 'underline' }}>
                        <FileText size={16} /> {file.filename || `Attachment-${idx}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Application Section for Freelancers */}
            {isAuthenticated && user.role === 'freelancer' && (
              <div className="card" style={{ padding: 32 }}>
                {hasApplied ? (
                  <div>
                    <h3 className="text-xl font-bold" style={{ marginBottom: 16 }}>Your Proposal Status</h3>
                    <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your Bid:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)', marginLeft: 8 }}>
                            ${userApplication.bidAmount}
                          </span>
                        </div>
                        <span className={`badge ${userApplication.status === 'accepted' ? 'badge-success' : userApplication.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                          {userApplication.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <strong>Delivery Time:</strong> {userApplication.deliveryTime} days
                      </div>
                      <div className="divider" />
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>Cover Letter:</strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 8, whiteSpace: 'pre-line' }}>
                          {userApplication.coverLetter}
                        </p>
                      </div>
                      {userApplication.status === 'accepted' && (
                        <div style={{ marginTop: 20 }}>
                          <button onClick={() => handleChat(project.client)} className="btn btn-primary btn-sm" style={{ gap: 8 }}>
                            <MessageSquare size={16} /> Chat with Client
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : project.status !== 'open' ? (
                  <div className="alert alert-warning">
                    <AlertCircle size={20} />
                    <span>This project is no longer accepting new proposals.</span>
                  </div>
                ) : (
                  <form onSubmit={handleApply}>
                    <h3 className="text-xl font-bold" style={{ marginBottom: 20 }}>Submit a Proposal</h3>
                    <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
                      <div className="form-group">
                        <label className="form-label">Your Bid Amount ($) <span>*</span></label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 500"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Delivery Time (Days) <span>*</span></label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 10"
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label">Cover Letter <span>*</span></label>
                      <textarea
                        className="form-textarea"
                        placeholder="Explain why you are the best fit for this project..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
                      {submitting ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Applications List for Client Owner */}
            {isAuthenticated && (user.role === 'admin' || user._id === project.client._id) && (
              <div className="card" style={{ padding: 32 }}>
                <h3 className="text-xl font-bold" style={{ marginBottom: 20 }}>
                  Received Proposals ({applications.length})
                </h3>

                {loadingApps ? (
                  <div className="spinner spinner-dark" />
                ) : applications.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No proposals received yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {applications.map((app) => (
                      <div key={app._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 20, background: 'var(--bg-secondary)' }}>
                        <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                          <div className="flex items-center gap-3">
                            <div className="avatar-placeholder avatar-md">
                              {app.freelancer.avatar ? (
                                <img src={app.freelancer.avatar} alt={app.freelancer.name} className="avatar avatar-md" />
                              ) : (
                                getInitials(app.freelancer.name)
                              )}
                            </div>
                            <div>
                              <Link to={`/freelancers/${app.freelancer._id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {app.freelancer.name}
                              </Link>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {app.freelancer.title || 'Freelancer'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                              ${app.bidAmount}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              in {app.deliveryTime} days
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, whiteSpace: 'pre-line' }}>
                          {app.coverLetter}
                        </p>

                        <div className="flex justify-between items-center">
                          <button onClick={() => handleChat(app.freelancer)} className="btn btn-secondary btn-sm" style={{ gap: 8 }}>
                            <MessageSquare size={14} /> Message
                          </button>

                          {app.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleStatusChange(app._id, 'rejected')} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                                <X size={14} /> Decline
                              </button>
                              <button onClick={() => handleStatusChange(app._id, 'accepted')} className="btn btn-primary btn-sm">
                                <Check size={14} /> Accept
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

          {/* Right Column: Client Info & Summary */}
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>About the Client</h3>
              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <div className="avatar-placeholder avatar-md" style={{ width: 44, height: 44 }}>
                  {project.client.avatar ? (
                    <img src={project.client.avatar} alt={project.client.name} className="avatar avatar-md" />
                  ) : (
                    getInitials(project.client.name)
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{project.client.companyName || project.client.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {project.client.location?.country || 'USA'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="font-semibold text-primary">★ {project.client.rating?.average?.toFixed(1) || '5.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Projects Posted:</span>
                  <span className="font-semibold">{project.client.completedProjects || 0} completed</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Project Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Budget</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.1rem' }}>
                    {getBudgetLabel(project.budget)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Timeline</div>
                  <div style={{ fontWeight: 600 }}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'} ({new Date(project.deadline).toLocaleDateString()})
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Experience Required</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {project.experience} level
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
