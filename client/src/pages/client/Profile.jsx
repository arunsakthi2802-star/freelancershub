import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { Edit2, Upload, Link as LinkIcon, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAvatarUrl, getInitials } from '../../utils/helpers';

export default function ClientProfile() {
  const { user, updateUser } = useAuth();

  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.companyWebsite || '');
  const [companySize, setCompanySize] = useState(user?.companySize || '1-10');
  const [industry, setIndustry] = useState(user?.industry || '');
  const [companyDescription, setCompanyDescription] = useState(user?.companyDescription || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.updateProfile({
        companyName,
        companyWebsite,
        companySize,
        industry,
        companyDescription,
      });
      updateUser(res.user);
      setIsEditing(false);
      toast.success('Company profile updated successfully');
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
      toast.success('Company avatar updated');
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Company Profile</h1>
        <p className="page-subtitle">Configure your public facing enterprise details and brand specs.</p>
      </div>

      <div className="grid-layout-sidebar-right-340" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
            <h3 className="text-lg font-bold">Company Profile Information</h3>
            <button onClick={() => setIsEditing(!isEditing)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
              <Edit2 size={12} /> {isEditing ? 'Cancel' : 'Edit Info'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Company Legal Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry Sector</label>
                  <input
                    type="text"
                    className="form-input"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Technology, Finance"
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Company Website URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Count Size</label>
                  <select className="form-select" value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="201-500">201-500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Overview Description</label>
                <textarea
                  className="form-textarea"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Describe your organization's focus, mission, and work environment..."
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm align-self-start">Save Profile</button>
            </form>
          ) : (
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 4 }}>
                {user?.companyName || 'No Company Name Configured'}
              </h4>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                {user?.industry || 'No Industry Specified'} | Size: {user?.companySize || '1-10'} Employees
              </div>

              {user?.companyWebsite && (
                <a href={user.companyWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm" style={{ marginBottom: 20, textDecoration: 'underline' }}>
                  <LinkIcon size={14} /> Visit Corporate Website
                </a>
              )}

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {user?.companyDescription || 'Write an description of your organization to attract the best freelancer bids.'}
              </p>
            </div>
          )}
        </div>

        {/* Right card: Corporate brand image/logo upload */}
        <div className="card" style={{ padding: 24, textAlign: 'center', height: 'fit-content' }}>
          <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Brand Logo</h3>
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
            {getAvatarUrl(user?.avatar) ? (
              <img src={getAvatarUrl(user?.avatar)} className="avatar avatar-2xl" alt={user?.name} />
            ) : (
              <div className="avatar-placeholder avatar-2xl" style={{ fontSize: '2rem' }}>{getInitials(user?.companyName || user?.name)}</div>
            )}
            <label style={{ position: 'absolute', bottom: 0, right: 0, padding: 8, background: 'var(--color-primary)', color: '#fff', borderRadius: '50%', cursor: 'pointer' }}>
              <Upload size={14} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported formats: JPG, PNG, WEBP. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}
