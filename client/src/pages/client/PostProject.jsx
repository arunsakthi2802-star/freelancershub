import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { CATEGORIES, EXPERIENCE_LEVELS, PROJECT_DURATIONS } from '../../utils/constants';
import { FileText, DollarSign, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostProject() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [skills, setSkills] = useState('');
  const [budgetType, setBudgetType] = useState('fixed');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('1-2-weeks');
  const [experience, setExperience] = useState('intermediate');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category || !skills || !minBudget || !deadline) {
      toast.error('Please fill in all required project specifications');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const budgetData = {
        type: budgetType,
        min: parseFloat(minBudget),
        max: maxBudget ? parseFloat(maxBudget) : undefined,
      };

      await projectService.create({
        title,
        description,
        category,
        skills: skillsArray,
        budget: JSON.stringify(budgetData),
        deadline,
        duration,
        experience,
      });

      toast.success('Project posted successfully!');
      navigate('/client/projects');
    } catch (err) {
      toast.error(err.message || 'Failed to post project listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Post a New Project</h1>
        <p className="page-subtitle">Publish a job listing to receive proposals from professional freelancers.</p>
      </div>

      <form onSubmit={handleSubmit} className="card animate-fade-in" style={{ padding: 32, maxWidth: 800 }}>
        {/* Basic specifications */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Project Title <span>*</span></label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Build a Responsive React Web App"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Category <span>*</span></label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select Category</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Required Skills (comma separated) <span>*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. React, CSS, Node.js"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Budget */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 20, background: 'var(--bg-secondary)' }}>
          <h3 className="text-md font-bold" style={{ marginBottom: 16 }}>Pricing & Budget</h3>
          <div className="grid grid-3" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Budget Type</label>
              <select className="form-select" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Billing</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Budget ($) <span>*</span></label>
              <input
                type="number"
                className="form-input"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Budget ($)</label>
              <input
                type="number"
                className="form-input"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Timelines and experience */}
        <div className="grid grid-3" style={{ gap: 16, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Required Experience</label>
            <select className="form-select" value={experience} onChange={(e) => setExperience(e.target.value)}>
              {EXPERIENCE_LEVELS.map((el) => (
                <option key={el.value} value={el.value}>{el.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Duration</label>
            <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
              {PROJECT_DURATIONS.map((pd) => (
                <option key={pd.value} value={pd.value}>{pd.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Application Deadline <span>*</span></label>
            <input
              type="date"
              className="form-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Detailed Project Specifications <span>*</span></label>
          <textarea
            className="form-textarea"
            placeholder="Write a clear list of deliverables, project details, and technical standards expected..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ gap: 8 }}>
          <Plus size={18} /> {loading ? 'Posting...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
