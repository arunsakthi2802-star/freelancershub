import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import SEOUpdater from './components/common/SEOUpdater';

// Public Pages
import Landing from './pages/Landing';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Freelancers from './pages/Freelancers';
import FreelancerProfile from './pages/FreelancerProfile';
import CustomPage from './pages/CustomPage';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Freelancer Dashboard
import FreelancerDashboard from './pages/freelancer/Dashboard';
import FreelancerProfile_ from './pages/freelancer/Profile';
import FreelancerProjects from './pages/freelancer/BrowseProjects';
import FreelancerApplications from './pages/freelancer/Applications';
import FreelancerEarnings from './pages/freelancer/Earnings';
import FreelancerChat from './pages/freelancer/Chat';
import FreelancerSettings from './pages/freelancer/Settings';

// Client Dashboard
import ClientDashboard from './pages/client/Dashboard';
import ClientProfile from './pages/client/Profile';
import PostProject from './pages/client/PostProject';
import ClientProjects from './pages/client/Projects';
import ClientApplications from './pages/client/Applications';
import ClientChat from './pages/client/Chat';
import ClientPayments from './pages/client/Payments';
import Checkout from './pages/client/Checkout';
import ClientSettings from './pages/client/Settings';

// Admin Dashboard
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProjects from './pages/admin/Projects';
import AdminReviews from './pages/admin/Reviews';
import WebsiteEditor from './pages/admin/WebsiteEditor';

// Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}><div className="spinner spinner-lg spinner-dark" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const redirectMap = { freelancer: '/freelancer/dashboard', client: '/client/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={redirectMap[user?.role] || '/'} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}><div className="spinner spinner-lg spinner-dark" /></div>;
  if (isAuthenticated) {
    const redirectMap = { freelancer: '/freelancer/dashboard', client: '/client/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={redirectMap[user?.role] || '/'} replace />;
  }
  return children;
};

export default function App() {
  return (
    <>
      <SEOUpdater />
      <Routes>
        {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/freelancers" element={<Freelancers />} />
        <Route path="/freelancers/:id" element={<FreelancerProfile />} />
        <Route path="/p/:slug" element={<CustomPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
      </Route>

      {/* Freelancer Dashboard */}
      <Route path="/freelancer" element={<ProtectedRoute allowedRoles={['freelancer']}><DashboardLayout role="freelancer" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FreelancerDashboard />} />
        <Route path="profile" element={<FreelancerProfile_ />} />
        <Route path="browse" element={<FreelancerProjects />} />
        <Route path="applications" element={<FreelancerApplications />} />
        <Route path="earnings" element={<FreelancerEarnings />} />
        <Route path="chat" element={<FreelancerChat />} />
        <Route path="chat/:roomId" element={<FreelancerChat />} />
        <Route path="settings" element={<FreelancerSettings />} />
      </Route>

      {/* Client Dashboard */}
      <Route path="/client" element={<ProtectedRoute allowedRoles={['client', 'agency']}><DashboardLayout role="client" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="post-project" element={<PostProject />} />
        <Route path="projects" element={<ClientProjects />} />
        <Route path="applications" element={<ClientApplications />} />
        <Route path="chat" element={<ClientChat />} />
        <Route path="chat/:roomId" element={<ClientChat />} />
        <Route path="payments" element={<ClientPayments />} />
        <Route path="payments/checkout/:projectId" element={<Checkout />} />
        <Route path="settings" element={<ClientSettings />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="editor" element={<WebsiteEditor />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
          <h1 style={{ fontSize: '6rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Page not found</p>
          <a href="/" className="btn btn-primary">Go Home</a>
        </div>
      } />
      </Routes>
    </>
  );
}
