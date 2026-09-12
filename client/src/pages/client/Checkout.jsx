import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { paymentService } from '../../services/chatService';
import { reviewService } from '../../services/userService';
import { ShieldCheck, ArrowLeft, Star, CreditCard, Lock, Award, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [communication, setCommunication] = useState(5);
  const [quality, setQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [expertise, setExpertise] = useState(5);

  // Card form states (mock/stripe elements)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await projectService.getById(projectId);
      if (!res.project || res.project.status !== 'in-progress') {
        toast.error('Project is not in-progress or active.');
        navigate('/client/projects');
        return;
      }
      setProject(res.project);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project details');
      navigate('/client/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handlePayAndComplete = async (e) => {
    e.preventDefault();
    if (!project) return;
    if (!cardName || !cardNumber || !cardExpiry || !cardCVC) {
      toast.error('Please enter complete credit card billing details');
      return;
    }
    if (!comment) {
      toast.error('Please add a brief review comment for your contractor');
      return;
    }

    setSubmitting(true);
    const amount = project.budget.min || 0; // standard project contract amount

    try {
      // 1. Create Payment Intent
      const intentRes = await paymentService.createIntent({
        projectId: project._id,
        amount,
        freelancerId: project.assignedFreelancer._id,
      });

      const { clientSecret, paymentId } = intentRes;

      // 2. Confirm Payment (Simulated check)
      await paymentService.confirmMock(paymentId);

      // 3. Submit Review
      await reviewService.create({
        projectId: project._id,
        revieweeId: project.assignedFreelancer._id,
        rating,
        comment,
        communication,
        quality,
        timeliness,
        expertise,
        reviewType: 'client-to-freelancer',
      });

      toast.success('Escrow Payment Released & Project Completed Successfully! 🎉');
      navigate('/client/projects');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Payment execution failed. Please verify Stripe configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="spinner spinner-lg spinner-dark" style={{ margin: '80px auto' }} />;
  }

  if (!project) return null;

  const contractAmount = project.budget.min;
  const platformFee = contractAmount * 0.1;
  const totalAmount = contractAmount + platformFee;

  const renderStars = (val, setVal) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={18}
            onClick={() => setVal && setVal(s)}
            style={{
              cursor: setVal ? 'pointer' : 'default',
              fill: s <= val ? 'var(--color-warning)' : 'none',
              stroke: s <= val ? 'var(--color-warning)' : 'var(--text-muted)',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/client/projects" className="btn btn-ghost btn-sm" style={{ gap: 4, padding: 0 }}>
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>

      <div className="grid-layout-sidebar-right-380">
        {/* Left Column - Payment & Review Form */}
        <form onSubmit={handlePayAndComplete}>
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ marginBottom: 20 }}>
              <CreditCard size={20} className="text-primary" /> 1. Escrow Funding & Invoice
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-3" style={{ gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Expiration Date</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVC</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="xxx"
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback & Review card */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ marginBottom: 20 }}>
              <Award size={20} className="text-primary" /> 2. Review Freelancer
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-layout-2-col" style={{ gap: 16 }}>
                <div className="flex justify-between items-center" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Overall Quality</span>
                  {renderStars(quality, setQuality)}
                </div>
                <div className="flex justify-between items-center" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Communication</span>
                  {renderStars(communication, setCommunication)}
                </div>
                <div className="flex justify-between items-center" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Timeliness</span>
                  {renderStars(timeliness, setTimeliness)}
                </div>
                <div className="flex justify-between items-center" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Expertise</span>
                  {renderStars(expertise, setExpertise)}
                </div>
              </div>

              <div className="flex justify-between items-center" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Overall Rating</span>
                {renderStars(rating, setRating)}
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment <span>*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your collaboration, achievements, and feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg btn-full"
            style={{ gap: 8 }}
          >
            <ShieldCheck size={20} />
            {submitting ? 'Processing Payment...' : `Authorize Escrow Release & Pay ${formatCurrency(totalAmount)}`}
          </button>
        </form>

        {/* Right Column - Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Escrow Invoice</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Project Gigs:</span>
                <span style={{ fontWeight: 600 }} className="truncate">{project.title}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Contractor:</span>
                <span style={{ fontWeight: 600 }}>{project.assignedFreelancer?.name}</span>
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />

              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Milestone Budget:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(contractAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Platform Fee (10%):</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />

              <div className="flex justify-between" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                <span>Total Due:</span>
                <span style={{ color: 'var(--color-success)' }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="card flex items-start gap-3" style={{ padding: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <Lock size={18} className="text-success" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>Secure Processing</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Escrow funds are protected. Releasing funds automatically completes contract milestones.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
