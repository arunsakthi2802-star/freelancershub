const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { db, mapUser, mapUserToDb } = require('../config/db');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get all users (with filters)
// @route   GET /api/users
// @access  Public
const getUsers = asyncHandler(async (req, res) => {
  const {
    role, skills, minRate, maxRate, availability,
    search, sort = '-createdAt', page = 1, limit = 12,
  } = req.query;

  let queryBuilder = db
    .from('users')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('is_banned', false);

  if (role) queryBuilder = queryBuilder.eq('role', role);
  if (availability) queryBuilder = queryBuilder.eq('availability', availability);
  if (skills) {
    const skillsArray = skills.split(',');
    queryBuilder = queryBuilder.overlaps('skills', skillsArray);
  }
  if (minRate) queryBuilder = queryBuilder.gte('hourly_rate', parseFloat(minRate));
  if (maxRate) queryBuilder = queryBuilder.lte('hourly_rate', parseFloat(maxRate));
  
  if (search) {
    // Search in full_name, title, or skills array containing the keyword
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,title.ilike.%${search}%,skills.cs.{"${search}"}`);
  }

  // Sort translation
  const isDesc = sort.startsWith('-');
  const sortCol = isDesc ? sort.slice(1) : sort;
  let dbSortCol = 'created_at';
  if (sortCol === 'createdAt') dbSortCol = 'created_at';
  else if (sortCol === 'hourlyRate') dbSortCol = 'hourly_rate';
  else if (sortCol === 'rating.average') dbSortCol = 'rating_average';

  queryBuilder = queryBuilder.order(dbSortCol, { ascending: !isDesc });

  // Pagination bounds
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error || !user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get reviews
  const { data: reviews } = await db
    .from('reviews')
    .select(`
      id, rating, comment, created_at,
      reviewer:users!reviews_reviewer_id_fkey(id, full_name, profile_image),
      project:projects(id, title)
    `)
    .eq('reviewee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const mappedReviews = (reviews || []).map((r) => ({
    _id: r.id,
    id: r.id,
    rating: parseFloat(r.rating),
    comment: r.comment,
    createdAt: r.created_at,
    reviewer: r.reviewer ? {
      _id: r.reviewer.id,
      id: r.reviewer.id,
      name: r.reviewer.full_name,
      avatar: r.reviewer.profile_image
    } : null,
    project: r.project ? {
      _id: r.project.id,
      id: r.project.id,
      title: r.project.title
    } : null
  }));

  successResponse(res, { user: mapUser(user), reviews: mappedReviews });
});

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    res.status(404);
    throw new Error('User not found');
  }

  successResponse(res, { user: mapUser(user) });
});

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'bio', 'title', 'location', 'phone', 'website', 'linkedIn', 'github',
    'skills', 'hourlyRate', 'availability', 'companyName', 'companySize',
    'industry', 'companyWebsite', 'companyDescription', 'notificationSettings',
    'experience', 'education',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const dbUpdates = mapUserToDb(updates);

  const { data: updatedUser, error } = await db
    .from('users')
    .update(dbUpdates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error || !updatedUser) {
    res.status(500);
    throw new Error(error?.message || 'Error updating profile');
  }

  successResponse(res, { user: mapUser(updatedUser) }, 'Profile updated successfully');
});

// @desc    Upload avatar
// @route   PUT /api/users/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ profile_image: avatarUrl })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error || !updatedUser) {
    res.status(500);
    throw new Error('Avatar update failed');
  }

  successResponse(res, { avatar: updatedUser.profile_image }, 'Avatar updated successfully');
});

// @desc    Upload resume
// @route   PUT /api/users/resume
// @access  Private (freelancer only)
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a resume file');
  }
  const resumeData = {
    url: `/uploads/resumes/${req.file.filename}`,
    filename: req.file.originalname,
    uploadedAt: new Date().toISOString(),
  };

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ resume: resumeData })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error || !updatedUser) {
    res.status(500);
    throw new Error('Resume upload failed');
  }

  successResponse(res, { resume: updatedUser.resume }, 'Resume uploaded successfully');
});

// @desc    Add portfolio item
// @route   POST /api/users/portfolio
// @access  Private (freelancer only)
const addPortfolioItem = asyncHandler(async (req, res) => {
  const { title, description, url, technologies } = req.body;
  const imageUrl = req.file ? `/uploads/portfolio/${req.file.filename}` : '';

  const newItemId = crypto.randomUUID();
  const portfolioItem = {
    _id: newItemId,
    id: newItemId,
    title,
    description,
    url,
    image: imageUrl,
    technologies: technologies ? JSON.parse(technologies) : []
  };

  const { data: user } = await db
    .from('users')
    .select('portfolio')
    .eq('id', req.user.id)
    .single();

  const currentPortfolio = Array.isArray(user?.portfolio) ? user.portfolio : [];
  const updatedPortfolio = [...currentPortfolio, portfolioItem];

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ portfolio: updatedPortfolio })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error || !updatedUser) {
    res.status(500);
    throw new Error('Failed to add portfolio item');
  }

  successResponse(res, { portfolio: updatedUser.portfolio }, 'Portfolio item added');
});

// @desc    Delete portfolio item
// @route   DELETE /api/users/portfolio/:itemId
// @access  Private
const deletePortfolioItem = asyncHandler(async (req, res) => {
  const { data: user } = await db
    .from('users')
    .select('portfolio')
    .eq('id', req.user.id)
    .single();

  const currentPortfolio = Array.isArray(user?.portfolio) ? user.portfolio : [];
  const updatedPortfolio = currentPortfolio.filter(item => item._id !== req.params.itemId && item.id !== req.params.itemId);

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ portfolio: updatedPortfolio })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error || !updatedUser) {
    res.status(500);
    throw new Error('Failed to delete portfolio item');
  }

  successResponse(res, { portfolio: updatedUser.portfolio }, 'Portfolio item deleted');
});

// @desc    Get top freelancers
// @route   GET /api/users/top-freelancers
// @access  Public
const getTopFreelancers = asyncHandler(async (req, res) => {
  const { data: freelancers, error } = await db
    .from('users')
    .select('*')
    .eq('role', 'freelancer')
    .eq('is_active', true)
    .eq('is_banned', false)
    .order('rating_average', { ascending: false })
    .order('completed_projects', { ascending: false })
    .limit(8);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedFreelancers = (freelancers || []).map(f => mapUser(f));
  successResponse(res, { freelancers: mappedFreelancers });
});

// @desc    Delete account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  await db
    .from('users')
    .update({ is_active: false })
    .eq('id', req.user.id);

  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  successResponse(res, {}, 'Account deactivated successfully');
});

module.exports = {
  getUsers, getUserById, getProfile, updateProfile,
  uploadAvatar, uploadResume, addPortfolioItem, deletePortfolioItem,
  getTopFreelancers, deleteAccount,
};
