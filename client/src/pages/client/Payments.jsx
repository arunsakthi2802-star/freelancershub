import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/chatService';
import { Landmark, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getHistory();
      // Filter payments where this user is the payer
      const payerPayments = res.data?.filter((p) => p.payer._id === user._id) || [];
      setPayments(payerPayments);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const totalSpent = payments.filter((p) => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Billing & Payments</h1>
        <p className="page-subtitle">View and audit transaction outflows, invoices, and payments history.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-2" style={{ gap: 20, marginBottom: 32, maxWidth: 640 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Landmark size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{formatCurrency(totalSpent)}</div>
          <div className="stat-label">Total Outflows Paid</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <ShieldCheck size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">100% Secure</div>
          <div className="stat-label">Transactions Protected by Escrow</div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="card" style={{ padding: 24 }}>
        <h3 className="text-lg font-bold" style={{ marginBottom: 20 }}>Invoice & Outflow Logs</h3>

        {loading ? (
          <div className="spinner spinner-dark" />
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No invoice outflows recorded yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Project / Gig</th>
                  <th>Contractor</th>
                  <th>Amount Charged</th>
                  <th>Status</th>
                  <th>Processed Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="font-semibold">{p.invoiceNumber}</td>
                    <td>{p.project?.title}</td>
                    <td>{p.payee?.name}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>${p.amount}</td>
                    <td>
                      <span className={`badge ${p.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}</td>
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
