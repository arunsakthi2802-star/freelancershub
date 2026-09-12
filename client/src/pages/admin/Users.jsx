import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Search, Ban, CheckCircle, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        role: role || undefined,
      });
      setUsers(res.data || []);
      setPages(res.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user directories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleBan = async (id) => {
    try {
      const res = await adminService.toggleBan(id);
      toast.success(res.message || 'User status updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user ban status');
    }
  };

  const handleVerifyEmail = async (id) => {
    try {
      await adminService.verifyEmail(id);
      toast.success('User email verified successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Deactivation failed');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Manage Platform Users</h1>
        <p className="page-subtitle">Moderate accounts, manage suspensions, and verify registrations.</p>
      </div>

      {/* Search Filter Tools */}
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <form onSubmit={handleSearch} className="flex gap-4 items-center flex-wrap">
          <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <div className="input-group">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ width: 180, margin: 0 }}>
            <select className="form-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="freelancer">Freelancers</option>
              <option value="client">Clients</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />
      ) : users.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <p style={{ color: 'var(--text-muted)' }}>No users found matching query.</p>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Email Verification</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="font-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>
                    {u.isEmailVerified ? (
                      <span className="badge badge-success">Verified</span>
                    ) : (
                      <button onClick={() => handleVerifyEmail(u._id)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Verify Now
                      </button>
                    )}
                  </td>
                  <td>
                    {u.isBanned ? (
                      <span className="badge badge-error">Suspended</span>
                    ) : (
                      <span className="badge badge-success">Active</span>
                    )}
                  </td>
                  <td className="text-right">
                    {u.role !== 'admin' && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleToggleBan(u._id)} className="btn btn-secondary btn-sm" style={{ padding: 6, color: u.isBanned ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          <Ban size={14} /> {u.isBanned ? 'Lift Ban' : 'Suspend'}
                        </button>
                        <button onClick={() => handleDeleteUser(u._id)} className="btn btn-secondary btn-sm" style={{ padding: 6, color: 'var(--color-error)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
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
