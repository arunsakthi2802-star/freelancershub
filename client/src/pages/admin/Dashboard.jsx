import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Users, FolderKanban, DollarSign, ShieldAlert, TrendingUp, UserCheck, ShieldClose } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [signupData, setSignupData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const res = await adminService.getStats();
      setStats(res.stats);
      setRecentUsers(res.recentUsers || []);
      setRecentProjects(res.recentProjects || []);

      // Format chart metrics
      const signups = res.monthlySignups?.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        count: item.count
      })) || [];
      setSignupData(signups);

      const revenues = res.monthlyRevenue?.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        amount: item.revenue
      })) || [];
      setRevenueData(revenues);

    } catch (error) {
      console.error(error);
      toast.error('Failed to load administration analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading) {
    return <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Admin Operations Console 🛡️</h1>
        <p className="page-subtitle">Platform-wide statistics, moderation audits, and financial summaries.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-4" style={{ gap: 20, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Users size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div className="stat-label">Total Users Verified</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <FolderKanban size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="stat-value">{stats?.totalProjects || 0}</div>
          <div className="stat-label">Total Posted Gigs</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <DollarSign size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{formatCurrency(stats?.platformRevenue || 0)}</div>
          <div className="stat-label">Platform Gross Revenue (10%)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <ShieldAlert size={24} style={{ color: 'var(--color-error)' }} />
          </div>
          <div className="stat-value">{stats?.activeProjects || 0}</div>
          <div className="stat-label">Contracts In-Progress</div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-2" style={{ gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-md font-bold" style={{ marginBottom: 20 }}>Monthly User Signups</h3>
          <div style={{ height: 260, width: '100%' }}>
            {signupData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No signups recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-md font-bold" style={{ marginBottom: 20 }}>Gross Platform Fee Revenue</h3>
          <div style={{ height: 260, width: '100%' }}>
            {revenueData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No platform fee transaction payments processed.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  <Area type="monotone" dataKey="amount" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Lists row */}
      <div className="grid grid-2" style={{ gap: 24 }}>
        {/* Recent users */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-md font-bold" style={{ marginBottom: 16 }}>New Users Registrations</h3>
          <div className="flex flex-col gap-4">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <span className={`badge ${u.role === 'client' ? 'badge-primary' : 'badge-info'}`} style={{ textTransform: 'capitalize' }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent projects */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-md font-bold" style={{ marginBottom: 16 }}>New Project Postings</h3>
          <div className="flex flex-col gap-4">
            {recentProjects.map((p) => (
              <div key={p._id} className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }} className="truncate">{p.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Posted on {formatDate(p.createdAt)}</div>
                </div>
                <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                  {p.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
