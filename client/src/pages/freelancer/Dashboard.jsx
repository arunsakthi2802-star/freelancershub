import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService, applicationService } from '../../services/projectService';
import { paymentService } from '../../services/chatService';
import { DollarSign, Briefcase, Award, Star, Clock, ChevronRight, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const appsRes = await applicationService.getMyApplications({ limit: 5 });
      setApps(appsRes.data || []);

      // Fetch open projects matching user skills
      const skillString = user?.skills?.join(',');
      const projRes = await projectService.getAll({ limit: 3, skills: skillString || undefined });
      setProjects(projRes.data || []);

      // Fetch payment history
      const payRes = await paymentService.getHistory({ limit: 10 });
      setPayments(payRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Format payments for earnings chart
  const chartData = payments
    .filter(p => p.status === 'completed' && p.payee._id === user._id)
    .slice(0, 7)
    .reverse()
    .map(p => ({
      name: new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: p.netAmount,
    }));

  if (loading) {
    return <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
        <p className="page-subtitle">Here's a quick overview of your profile and earnings stats.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-4" style={{ gap: 20, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <DollarSign size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{formatCurrency(user?.totalEarnings || 0)}</div>
          <div className="stat-label">Total Earnings</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Briefcase size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{user?.completedProjects || 0}</div>
          <div className="stat-label">Completed Projects</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <FileText size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="stat-value">{user?.activeProjects || 0}</div>
          <div className="stat-label">Active Gigs</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Star size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-value">{user?.rating?.average?.toFixed(1) || '5.0'}</div>
          <div className="stat-label">Rating ({user?.rating?.count || 0} reviews)</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid-layout-sidebar-right-360" style={{ gap: 24, marginBottom: 32, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-lg font-bold" style={{ marginBottom: 20 }}>Earnings Trend</h3>
          <div style={{ height: 280, width: '100%' }}>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Complete a project payment to populate chart analytics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick links & tips */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Recommended Jobs</h3>
          <div className="flex flex-col gap-4">
            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Update your profile skills to view curated matches.</p>
            ) : (
              projects.map((p) => (
                <Link key={p._id} to={`/projects/${p._id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }} className="truncate">{p.title}</div>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>${p.budget.min}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{p.category}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Applications list */}
      <div className="card" style={{ padding: 24 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <h3 className="text-lg font-bold">Recent Proposal Bids</h3>
          <Link to="/freelancer/applications" className="flex items-center gap-1 text-sm text-primary" style={{ fontWeight: 600 }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {apps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>You have not submitted any proposals yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Budget Bid</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <Link to={`/projects/${app.project._id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.project.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>${app.bidAmount}</td>
                    <td>{app.deliveryTime} Days</td>
                    <td>
                      <span className={`badge ${app.status === 'accepted' ? 'badge-success' : app.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="text-xs">{formatRelativeTime(app.createdAt)}</td>
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
