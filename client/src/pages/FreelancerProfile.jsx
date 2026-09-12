import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { MapPin, DollarSign, Star, Briefcase, Award, Globe, Link as LinkIcon, MessageSquare, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { getInitials, getAvatarUrl, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userService.getById(id);
      setProfile(res.user);
      setReviews(res.reviews || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load freelancer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleMessage = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await chatService.sendMessage({
        receiverId: profile._id,
        content: `Hi ${profile.name}, I would like to connect regarding a potential collaboration.`
      });
      const roomId = [user._id, profile._id].sort().join('_');
      navigate(`/${user.role}/chat/${roomId}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to start chat session');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner spinner-lg spinner-dark" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container text-center section">
        <h2>Profile Not Found</h2>
        <Link to="/freelancers" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Freelancers</Link>
      </div>
    );
  }

  return (
    <div className="section" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - var(--navbar-height))' }}>
      <div className="container">
        <Link to="/freelancers" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, gap: 4 }}>
          <ArrowLeft size={16} /> Back to Freelancers
        </Link>

        {/* Profile Header Card */}
        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <div className="flex justify-between items-start flex-wrap gap-6">
            <div className="flex items-center gap-6 flex-wrap">
              {getAvatarUrl(profile.avatar) ? (
                <img src={getAvatarUrl(profile.avatar)} className="avatar avatar-2xl" alt={profile.name} />
              ) : (
                <div className="avatar-placeholder avatar-2xl" style={{ fontSize: '2rem' }}>{getInitials(profile.name)}</div>
              )}

              <div>
                <h1 className="text-3xl font-bold" style={{ marginBottom: 6 }}>{profile.name}</h1>
                <p className="text-primary font-semibold text-lg" style={{ marginBottom: 8 }}>{profile.title || 'Expert Freelancer'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-secondary" style={{ marginBottom: 12 }}>
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {profile.location.city}, {profile.location.country}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star size={14} style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />
                    {profile.rating?.average?.toFixed(1) || '5.0'} ({profile.rating?.count || 0} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} /> {profile.completedProjects || 0} projects completed
                  </span>
                </div>
                {profile.skills && (
                  <div className="tags">
                    {profile.skills.map((s) => (
                      <span key={s} className="tag">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card-glass" style={{ padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hourly Rate</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                  {profile.hourlyRate ? `$${profile.hourlyRate}/hr` : 'Negotiable'}
                </div>
              </div>
              {user?._id !== profile._id && (
                <button onClick={handleMessage} className="btn btn-primary btn-full" style={{ gap: 8 }}>
                  <MessageSquare size={18} /> Contact Freelancer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid-layout-sidebar-right-340">
          {/* Main Details column */}
          <div>
            {/* About / Bio */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 className="text-xl font-bold" style={{ marginBottom: 16 }}>About Me</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {profile.bio || "No biography details provided yet."}
              </p>
            </div>

            {/* Portfolio Projects */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 className="text-xl font-bold" style={{ marginBottom: 16 }}>Portfolio</h2>
              {profile.portfolio?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No portfolio items uploaded.</p>
              ) : (
                <div className="grid grid-2" style={{ gap: 20 }}>
                  {profile.portfolio?.map((item) => (
                    <div key={item._id} className="card-glass" style={{ overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                      {item.image && (
                        <img src={getAvatarUrl(item.image)} alt={item.title} style={{ height: 180, width: '100%', objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: 16 }}>
                        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{item.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{item.description}</p>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary" style={{ fontWeight: 600 }}>
                            <LinkIcon size={12} /> View Live Project
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 className="text-xl font-bold" style={{ marginBottom: 16 }}>Experience</h2>
              {profile.experience?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No work experience added.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {profile.experience?.map((exp) => (
                    <div key={exp._id} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <h4 style={{ fontWeight: 700 }}>{exp.title}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                          {exp.company} | {formatDate(exp.from)} - {exp.current ? 'Present' : formatDate(exp.to)}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client Reviews */}
            <div className="card" style={{ padding: 24 }}>
              <h2 className="text-xl font-bold" style={{ marginBottom: 16 }}>Client Feedback</h2>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No reviews received yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <div key={r._id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: 600 }}>{r.reviewer?.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({r.project?.title})</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Star size={14} style={{ fill: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.rating}</span>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar panel info */}
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Availability</h3>
              <div className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, background: 'var(--color-success)', borderRadius: '50%' }} />
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {profile.availability || 'Full Time'}
                </span>
              </div>
            </div>

            {profile.resume?.url && (
              <div className="card" style={{ padding: 24 }}>
                <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Resume</h3>
                <a href={getAvatarUrl(profile.resume.url)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-full" style={{ gap: 8 }}>
                  <Briefcase size={16} /> View/Download CV
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
