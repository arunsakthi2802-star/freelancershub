const asyncHandler = require('express-async-handler');
const { db, mapUser } = require('../config/db');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get dashboard analytics
// @route   GET /api/admin/stats
// @access  Private (admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    rUsers, rFreelancers, rClients,
    rProjects, rActiveProjects, rCompletedProjects,
    rPayments, rRevenue,
    rRecentUsers, rRecentProjects,
  ] = await Promise.all([
    db.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('users').select('id', { count: 'exact', head: true }).eq('role', 'freelancer').eq('is_active', true),
    db.from('users').select('id', { count: 'exact', head: true }).eq('role', 'client').eq('is_active', true),
    db.from('projects').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'in-progress').eq('is_active', true),
    db.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'completed').eq('is_active', true),
    db.from('payments').select('id', { count: 'exact', head: true }).eq('payment_status', 'completed'),
    db.from('payments').select('fee').eq('payment_status', 'completed'),
    db.from('users').select('id, full_name, email, role, profile_image, created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
    db.from('projects').select('id, title, created_at, client:users!projects_client_id_fkey(id, full_name, profile_image)').eq('is_active', true).order('created_at', { ascending: false }).limit(5)
  ]);

  const platformRevenue = (rRevenue.data || []).reduce((sum, p) => sum + parseFloat(p.fee || 0), 0);

  // Monthly signups (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: signupsData } = await db
    .from('users')
    .select('created_at')
    .gte('created_at', sixMonthsAgo.toISOString());

  const { data: revenueData } = await db
    .from('payments')
    .select('fee, created_at')
    .eq('payment_status', 'completed')
    .gte('created_at', sixMonthsAgo.toISOString());

  // Group signups in JS
  const signupGroups = {};
  (signupsData || []).forEach((u) => {
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!signupGroups[key]) {
      signupGroups[key] = { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, count: 0 };
    }
    signupGroups[key].count += 1;
  });
  const monthlySignups = Object.values(signupGroups).sort((a, b) => {
    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
    return a._id.month - b._id.month;
  });

  // Group revenue in JS
  const revenueGroups = {};
  (revenueData || []).forEach((p) => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!revenueGroups[key]) {
      revenueGroups[key] = { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, revenue: 0 };
    }
    revenueGroups[key].revenue += parseFloat(p.fee || 0);
  });
  const monthlyRevenue = Object.values(revenueGroups).sort((a, b) => {
    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
    return a._id.month - b._id.month;
  });

  const recentUsersMapped = (rRecentUsers.data || []).map(u => ({
    _id: u.id,
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    avatar: u.profile_image,
    createdAt: u.created_at
  }));

  const recentProjectsMapped = (rRecentProjects.data || []).map(p => ({
    _id: p.id,
    id: p.id,
    title: p.title,
    createdAt: p.created_at,
    client: p.client ? {
      _id: p.client.id,
      id: p.client.id,
      name: p.client.full_name,
      avatar: p.client.profile_image
    } : null
  }));

  successResponse(res, {
    stats: {
      totalUsers: rUsers.count || 0,
      totalFreelancers: rFreelancers.count || 0,
      totalClients: rClients.count || 0,
      totalProjects: rProjects.count || 0,
      activeProjects: rActiveProjects.count || 0,
      completedProjects: rCompletedProjects.count || 0,
      totalPayments: rPayments.count || 0,
      platformRevenue,
    },
    recentUsers: recentUsersMapped,
    recentProjects: recentProjectsMapped,
    monthlySignups,
    monthlyRevenue,
  }, 'Admin stats retrieved');
});

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isBanned } = req.query;

  let queryBuilder = db
    .from('users')
    .select('*', { count: 'exact' });

  if (role) queryBuilder = queryBuilder.eq('role', role);
  if (isBanned !== undefined) queryBuilder = queryBuilder.eq('is_banned', isBanned === 'true');
  if (search) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: users, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedUsers = (users || []).map(u => mapUser(u));
  paginatedResponse(res, mappedUsers, total || 0, page, limit);
});

// @desc    Ban / Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (admin)
const toggleBanUser = asyncHandler(async (req, res) => {
  const { data: user } = await db
    .from('users')
    .select('role, is_banned')
    .eq('id', req.params.id)
    .single();

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot ban an admin account');
  }

  const newBanStatus = !user.is_banned;

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ is_banned: newBanStatus })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error('Failed to update ban status');
  }

  successResponse(res, { isBanned: updatedUser.is_banned }, `User ${updatedUser.is_banned ? 'banned' : 'unbanned'} successfully`);
});

// @desc    Verify user email (admin)
// @route   PUT /api/admin/users/:id/verify
// @access  Private (admin)
const verifyUserEmail = asyncHandler(async (req, res) => {
  const { data: user, error } = await db
    .from('users')
    .update({ is_email_verified: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !user) {
    res.status(404);
    throw new Error('User not found');
  }

  successResponse(res, { user: mapUser(user) }, 'User email verified by admin');
});

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const { data: user } = await db
    .from('users')
    .select('role')
    .eq('id', req.params.id)
    .single();

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete an admin account');
  }

  await db
    .from('users')
    .update({ is_active: false, is_banned: true })
    .eq('id', req.params.id);

  successResponse(res, {}, 'User deleted successfully');
});

// @desc    Get all projects (admin)
// @route   GET /api/admin/projects
// @access  Private (admin)
const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;

  let queryBuilder = db
    .from('projects')
    .select(`
      *,
      client:users!projects_client_id_fkey(id, full_name, email, profile_image),
      assignedFreelancer:users!projects_assigned_freelancer_id_fkey(id, full_name, email, profile_image)
    `, { count: 'exact' });

  if (status) queryBuilder = queryBuilder.eq('status', status);
  if (search) {
    queryBuilder = queryBuilder.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: projects, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedProjects = (projects || []).map((p) => ({
    ...p,
    _id: p.id,
    skills: p.required_skills,
    createdAt: p.created_at,
    client: p.client ? {
      _id: p.client.id,
      id: p.client.id,
      name: p.client.full_name,
      email: p.client.email,
      avatar: p.client.profile_image
    } : null,
    assignedFreelancer: p.assignedFreelancer ? {
      _id: p.assignedFreelancer.id,
      id: p.assignedFreelancer.id,
      name: p.assignedFreelancer.full_name,
      email: p.assignedFreelancer.email,
      avatar: p.assignedFreelancer.profile_image
    } : null
  }));

  paginatedResponse(res, mappedProjects, total || 0, page, limit);
});

// @desc    Feature / Unfeature project (admin)
// @route   PUT /api/admin/projects/:id/feature
// @access  Private (admin)
const toggleFeaturedProject = asyncHandler(async (req, res) => {
  const { data: project } = await db
    .from('projects')
    .select('is_featured')
    .eq('id', req.params.id)
    .single();

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const newFeatured = !project.is_featured;

  const { data: updatedProject, error } = await db
    .from('projects')
    .update({ is_featured: newFeatured })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error('Failed to toggle featured status');
  }

  successResponse(res, { isFeatured: updatedProject.is_featured }, `Project ${updatedProject.is_featured ? 'featured' : 'unfeatured'}`);
});

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Private (admin)
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;

  const { count: total } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true });

  const { data: reviews, error } = await db
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(id, full_name, profile_image),
      reviewee:users!reviews_reviewee_id_fkey(id, full_name, profile_image),
      project:projects(id, title)
    `)
    .order('created_at', { ascending: false })
    .range(skip, end);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedReviews = (reviews || []).map((r) => ({
    ...r,
    _id: r.id,
    createdAt: r.created_at,
    rating: parseFloat(r.rating),
    reviewer: r.reviewer ? {
      _id: r.reviewer.id,
      id: r.reviewer.id,
      name: r.reviewer.full_name,
      avatar: r.reviewer.profile_image
    } : null,
    reviewee: r.reviewee ? {
      _id: r.reviewee.id,
      id: r.reviewee.id,
      name: r.reviewee.full_name,
      avatar: r.reviewee.profile_image
    } : null,
    project: r.project ? {
      _id: r.project.id,
      id: r.project.id,
      title: r.project.title
    } : null
  }));

  paginatedResponse(res, mappedReviews, total || 0, page, limit);
});

// @desc    Delete review (admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (admin)
const deleteReview = asyncHandler(async (req, res) => {
  const { data: review } = await db
    .from('reviews')
    .select('reviewee_id')
    .eq('id', req.params.id)
    .single();

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const { error } = await db
    .from('reviews')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(500);
    throw new Error('Failed to delete review');
  }

  // Recalculate average for reviewee
  const { data: userReviews } = await db
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', review.reviewee_id);

  const count = userReviews ? userReviews.length : 0;
  const average = count > 0 ? userReviews.reduce((sum, rev) => sum + parseFloat(rev.rating), 0) / count : 0;

  await db
    .from('users')
    .update({
      rating_average: average,
      rating_count: count
    })
    .eq('id', review.reviewee_id);

  successResponse(res, {}, 'Review deleted by admin');
});

module.exports = {
  getDashboardStats, getAllUsers, toggleBanUser, verifyUserEmail, deleteUser,
  getAllProjects, toggleFeaturedProject, getAllReviews, deleteReview,
};
