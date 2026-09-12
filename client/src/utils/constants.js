export const CATEGORIES = [
  { name: 'Web Development', icon: '💻', color: '#6366f1' },
  { name: 'Mobile Development', icon: '📱', color: '#8b5cf6' },
  { name: 'UI/UX Design', icon: '🎨', color: '#06b6d4' },
  { name: 'Graphic Design', icon: '✏️', color: '#f59e0b' },
  { name: 'Content Writing', icon: '📝', color: '#10b981' },
  { name: 'Digital Marketing', icon: '📈', color: '#ef4444' },
  { name: 'Data Science', icon: '📊', color: '#3b82f6' },
  { name: 'Video Editing', icon: '🎬', color: '#ec4899' },
  { name: 'Translation', icon: '🌍', color: '#84cc16' },
  { name: 'SEO', icon: '🔍', color: '#f97316' },
  { name: 'Social Media', icon: '📲', color: '#a855f7' },
  { name: 'Accounting', icon: '💰', color: '#14b8a6' },
];

export const POPULAR_SKILLS = [
  'React.js', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Figma',
  'WordPress', 'Shopify', 'Flutter', 'React Native', 'Next.js',
  'Vue.js', 'Angular', 'Machine Learning', 'Data Analysis', 'SEO',
  'Content Writing', 'Copywriting', 'Logo Design', 'Video Editing', 'Photoshop',
];

export const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

export const PROJECT_DURATIONS = [
  { value: 'less-than-1-week', label: 'Less than 1 week' },
  { value: '1-2-weeks', label: '1–2 Weeks' },
  { value: '1-month', label: '1 Month' },
  { value: '2-3-months', label: '2–3 Months' },
  { value: 'more-than-3-months', label: 'More than 3 months' },
];

export const PROJECT_STATUSES = {
  open: { label: 'Open', class: 'badge-success' },
  'in-progress': { label: 'In Progress', class: 'badge-info' },
  completed: { label: 'Completed', class: 'badge-primary' },
  cancelled: { label: 'Cancelled', class: 'badge-error' },
  'on-hold': { label: 'On Hold', class: 'badge-warning' },
};

export const APPLICATION_STATUSES = {
  pending: { label: 'Pending', class: 'badge-warning' },
  accepted: { label: 'Accepted', class: 'badge-success' },
  rejected: { label: 'Rejected', class: 'badge-error' },
  withdrawn: { label: 'Withdrawn', class: 'badge-gray' },
  completed: { label: 'Completed', class: 'badge-primary' },
};

export const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time (40 hrs/week)' },
  { value: 'part-time', label: 'Part-time (20 hrs/week)' },
  { value: 'contract', label: 'Contract' },
  { value: 'not-available', label: 'Not Available' },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Product Manager at TechCorp',
    avatar: '',
    text: 'FreelanceHub helped me find an incredible React developer within 24 hours. The quality of talent here is unmatched!',
    rating: 5,
    type: 'client',
  },
  {
    id: 2,
    name: 'Marcus Chen',
    role: 'Freelance Full-Stack Developer',
    avatar: '',
    text: 'I\'ve tripled my income since joining FreelanceHub. The platform makes finding quality clients so effortless.',
    rating: 5,
    type: 'freelancer',
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'Founder at StartupHub',
    avatar: '',
    text: 'The secure payment system and verified profiles give us complete confidence in every hire. Absolutely love it!',
    rating: 5,
    type: 'client',
  },
  {
    id: 4,
    name: 'Alex Rivera',
    role: 'Freelance UI/UX Designer',
    avatar: '',
    text: 'FreelanceHub has an amazing community of clients. I\'ve built long-term partnerships with 5 clients this year alone.',
    rating: 5,
    type: 'freelancer',
  },
  {
    id: 5,
    name: 'Jennifer Wu',
    role: 'CTO at InnovateTech',
    avatar: '',
    text: 'The real-time chat and project tracking features make collaboration seamless. Best freelance platform I\'ve tried.',
    rating: 5,
    type: 'client',
  },
  {
    id: 6,
    name: 'David Kim',
    role: 'Freelance Data Scientist',
    avatar: '',
    text: 'Professional platform, timely payments, and excellent support. FreelanceHub is the gold standard for freelancers.',
    rating: 5,
    type: 'freelancer',
  },
];

export const FAQS = [
  {
    q: 'How do I get started on FreelanceHub?',
    a: 'Simply sign up for free as a Freelancer or Client, complete your profile, and start browsing projects or posting your needs. The process takes less than 5 minutes.',
  },
  {
    q: 'How does the payment protection work?',
    a: 'Clients fund a milestone before work begins. Funds are held securely in escrow until you approve the deliverables. We use Stripe for secure, encrypted payments.',
  },
  {
    q: 'What fees does FreelanceHub charge?',
    a: 'FreelanceHub charges a 10% service fee on completed projects. Freelancers receive 90% of the agreed amount. There are no hidden fees.',
  },
  {
    q: 'Can I work with clients outside my country?',
    a: 'Absolutely! FreelanceHub is a global platform supporting clients and freelancers in 150+ countries with multi-currency support.',
  },
  {
    q: 'How do I verify my account?',
    a: 'After registration, check your email for a verification link. You can also upload identity documents for a verified badge, which increases your credibility.',
  },
  {
    q: 'What happens if there\'s a dispute?',
    a: 'Our dedicated dispute resolution team reviews all complaints and mediate fairly. We have a 98% resolution rate within 72 hours.',
  },
];

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
