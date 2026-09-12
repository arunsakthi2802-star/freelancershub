import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/chatService';
import { DollarSign, Download, ArrowDownLeft, FileCheck, Landmark } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Earnings() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getHistory();
      // Filter payments where this user is the payee (recipient)
      const payeePayments = res.data?.filter((p) => p.payee._id === user._id) || [];
      setPayments(payeePayments);
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

  // Compute stats
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalEarned = completedPayments.reduce((acc, curr) => acc + curr.netAmount, 0);
  const pendingFunds = payments.filter((p) => p.status === 'pending').reduce((acc, curr) => acc + curr.netAmount, 0);
  const totalFeesPaid = completedPayments.reduce((acc, curr) => acc + curr.platformFee, 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Earnings & Finances</h1>
        <p className="page-subtitle">View and download your billing statements and payment logs.</p>
      </div>

      {/* Summary statistics row */}
      <div className="grid grid-3" style={{ gap: 20, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Landmark size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{formatCurrency(totalEarned)}</div>
          <div className="stat-label">Net Income Earned</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <ArrowDownLeft size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-value">{formatCurrency(pendingFunds)}</div>
          <div className="stat-label">Pending Clearance</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <FileCheck size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{formatCurrency(totalFeesPaid)}</div>
          <div className="stat-label">Platform Fees Paid (10%)</div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="card" style={{ padding: 24 }}>
        <h3 className="text-lg font-bold" style={{ marginBottom: 20 }}>Billing Statement Records</h3>

        {loading ? (
          <div className="spinner spinner-dark" />
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No invoice payments recorded yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Total Charged</th>
                  <th>Net Paid</th>
                  <th>Status</th>
                  <th>Processed Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="font-semibold">{p.invoiceNumber}</td>
                    <td>{p.payer.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>${p.amount}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>${p.netAmount}</td>
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
