import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Trash2, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminService.getReviews({ page, limit: 10 });
      setReviews(res.data || []);
      setPages(res.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load review database logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete/moderate this review? This action is permanent.')) return;
    try {
      await adminService.deleteReview(id);
      toast.success('Review moderated and deleted successfully');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Moderation deletion failed');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Moderate Platform Feedback</h1>
        <p className="page-subtitle">Review contractor feedback logs and remove inappropriate reviews.</p>
      </div>

      {loading ? (
        <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />
      ) : reviews.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No reviews found</h3>
          <p style={{ color: 'var(--text-muted)' }}>No feedback reviews have been registered on the system database.</p>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Project Gig</th>
                <th>Author Reviewer</th>
                <th>Target Recipient</th>
                <th>Star Rating</th>
                <th>Written Comment</th>
                <th>Submitted Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td className="font-semibold">{r.project?.title}</td>
                  <td>{r.reviewer?.name}</td>
                  <td>{r.reviewee?.name}</td>
                  <td style={{ color: 'var(--color-warning)', fontWeight: 700 }}>★ {r.rating}</td>
                  <td>{r.comment}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td className="text-right">
                    <button onClick={() => handleDelete(r._id)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', padding: 6 }}>
                      <Trash2 size={14} /> Moderate
                    </button>
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
