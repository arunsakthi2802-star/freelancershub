import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { Trash2, Plus, Edit2, Upload, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAvatarUrl, getInitials } from '../../utils/helpers';

export default function FreelancerProfile() {
  const { user, updateUser } = useAuth();

  // Basic info states
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [isEditingBasic, setIsEditingBasic] = useState(false);

  // Portfolio items states
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioDesc, setPortfolioDesc] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);

  // Experience states
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [showAddExp, setShowAddExp] = useState(false);

  // Resume states
  const [resumeFile, setResumeFile] = useState(null);

  const handleUpdateBasicInfo = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const res = await userService.updateProfile({
        title,
        bio,
        hourlyRate: parseFloat(hourlyRate),
        skills: skillsArray,
      });
      updateUser(res.user);
      setIsEditingBasic(false);
      toast.success('Basic profile information updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await userService.uploadAvatar(formData);
      updateUser({ avatar: res.avatar });
      toast.success('Profile avatar updated');
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed');
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await userService.uploadResume(formData);
      updateUser({ resume: res.resume });
      toast.success('Resume uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Resume upload failed');
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', portfolioTitle);
    formData.append('description', portfolioDesc);
    formData.append('url', portfolioUrl);
    if (portfolioImage) formData.append('portfolio', portfolioImage);

    try {
      const res = await userService.addPortfolio(formData);
      updateUser({ portfolio: res.portfolio });
      setShowAddPortfolio(false);
      setPortfolioTitle('');
      setPortfolioDesc('');
      setPortfolioUrl('');
      setPortfolioImage(null);
      toast.success('Portfolio item added successfully');
    } catch (err) {
      toast.error(err.message || 'Portfolio item submission failed');
    }
  };

  const handleDeletePortfolio = async (itemId) => {
    try {
      const res = await userService.deletePortfolio(itemId);
      updateUser({ portfolio: res.portfolio });
      toast.success('Portfolio item deleted');
    } catch (err) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    const newExp = {
      title: expTitle,
      company: expCompany,
      from: expFrom,
      to: expCurrent ? null : expTo,
      current: expCurrent,
      description: expDesc,
    };

    try {
      const updatedExperienceList = [...(user?.experience || []), newExp];
      const res = await userService.updateProfile({ experience: updatedExperienceList });
      updateUser({ experience: res.user.experience });
      setShowAddExp(false);
      setExpTitle('');
      setExpCompany('');
      setExpFrom('');
      setExpTo('');
      setExpDesc('');
      setExpCurrent(false);
      toast.success('Experience record added');
    } catch (err) {
      toast.error(err.message || 'Failed to add experience');
    }
  };

  const handleDeleteExperience = async (idx) => {
    try {
      const updatedList = user.experience.filter((_, i) => i !== idx);
      const res = await userService.updateProfile({ experience: updatedList });
      updateUser({ experience: res.user.experience });
      toast.success('Experience record removed');
    } catch (err) {
      toast.error(err.message || 'Removal failed');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Manage Freelancer Profile</h1>
        <p className="page-subtitle">Configure your public facing resume, rates, skills, and portfolio.</p>
      </div>

      <div className="grid-layout-sidebar-right-340" style={{ gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Basic Bio & Info Card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 className="text-lg font-bold">Profile Details</h3>
              <button onClick={() => setIsEditingBasic(!isEditingBasic)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                <Edit2 size={12} /> {isEditingBasic ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditingBasic ? (
              <form onSubmit={handleUpdateBasicInfo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Professional Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Skills (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Node, TypeScript, Docker"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Profile Biography</label>
                  <textarea
                    className="form-textarea"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your experience, past work, and skill levels..."
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm align-self-start">Save Profile Details</button>
              </form>
            ) : (
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>{user?.title || 'No Professional Title Set'}</h4>
                <div style={{ color: 'var(--color-success)', fontWeight: 700, marginBottom: 12 }}>
                  Hourly Rate: {user?.hourlyRate ? `$${user?.hourlyRate}/hr` : 'Negotiable'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16 }}>
                  {user?.bio || 'Write a short professional bio describing your skills and focus area.'}
                </p>
                <div className="tags">
                  {user?.skills?.map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Portfolio Card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 className="text-lg font-bold">My Portfolio ({user?.portfolio?.length || 0})</h3>
              <button onClick={() => setShowAddPortfolio(!showAddPortfolio)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            {showAddPortfolio && (
              <form onSubmit={handleAddPortfolio} style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Portfolio Title <span>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={portfolioTitle}
                    onChange={(e) => setPortfolioTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project URL (Optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Showcase Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPortfolioImage(e.target.files[0])}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span>*</span></label>
                  <textarea
                    className="form-textarea"
                    value={portfolioDesc}
                    onChange={(e) => setPortfolioDesc(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm">Add Item</button>
                  <button type="button" onClick={() => setShowAddPortfolio(false)} className="btn btn-secondary btn-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="grid grid-2" style={{ gap: 16 }}>
              {user?.portfolio?.map((item) => (
                <div key={item._id} className="card-glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {item.image && (
                    <img src={getAvatarUrl(item.image)} alt={item.title} style={{ height: 160, width: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: 16 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                      <h4 style={{ fontWeight: 600 }} className="truncate">{item.title}</h4>
                      <button onClick={() => handleDeletePortfolio(item._id)} className="btn btn-icon btn-ghost" style={{ padding: 4, color: 'var(--color-error)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Timeline Card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 className="text-lg font-bold">Work Experience</h3>
              <button onClick={() => setShowAddExp(!showAddExp)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                <Plus size={14} /> Add Experience
              </button>
            </div>

            {showAddExp && (
              <form onSubmit={handleAddExperience} style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Job Title <span>*</span></label>
                    <input type="text" className="form-input" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company <span>*</span></label>
                    <input type="text" className="form-input" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">From Date <span>*</span></label>
                    <input type="date" className="form-input" value={expFrom} onChange={(e) => setExpFrom(e.target.value)} required />
                  </div>
                  {!expCurrent && (
                    <div className="form-group">
                      <label className="form-label">To Date</label>
                      <input type="date" className="form-input" value={expTo} onChange={(e) => setExpTo(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="expCurrent" checked={expCurrent} onChange={(e) => setExpCurrent(e.target.checked)} />
                  <label htmlFor="expCurrent" style={{ fontSize: '0.85rem' }}>I currently work here</label>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm">Save Experience</button>
                  <button type="button" onClick={() => setShowAddExp(false)} className="btn btn-secondary btn-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-4">
              {user?.experience?.map((exp, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600 }}>{exp.title}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {exp.company} | {exp.from ? exp.from.split('T')[0] : ''} - {exp.current ? 'Present' : exp.to ? exp.to.split('T')[0] : ''}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{exp.description}</p>
                  </div>
                  <button onClick={() => handleDeleteExperience(idx)} className="btn btn-icon btn-ghost" style={{ alignSelf: 'flex-start', color: 'var(--color-error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Avatar, Resume Uploads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Profile Photo / Avatar Card */}
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Avatar Image</h3>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
              {getAvatarUrl(user?.avatar) ? (
                <img src={getAvatarUrl(user?.avatar)} className="avatar avatar-2xl" alt={user?.name} />
              ) : (
                <div className="avatar-placeholder avatar-2xl" style={{ fontSize: '2rem' }}>{getInitials(user?.name)}</div>
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, padding: 8, background: 'var(--color-primary)', color: '#fff', borderRadius: '50%', cursor: 'pointer' }}>
                <Upload size={14} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported types: JPG, PNG, WEBP. Max size: 5MB.</p>
          </div>

          {/* Resume Upload CV Card */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Resume Document</h3>
            {user?.resume?.url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: 16 }}>
                <FileText size={24} style={{ color: 'var(--color-primary)' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }} className="truncate">{user.resume.filename}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Uploaded recently</div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>No resume uploaded. Upload a PDF resume to apply to client projects.</p>
            )}

            <label className="btn btn-secondary btn-full" style={{ gap: 8, cursor: 'pointer' }}>
              <Upload size={16} /> Choose CV File
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
