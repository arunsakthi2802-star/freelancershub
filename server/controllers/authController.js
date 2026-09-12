const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db, mapUser, mapUserToDb } = require('../config/db');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Helper to compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, companyName, skills } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  if (!['freelancer', 'client', 'agency'].includes(role)) {
    res.status(400);
    throw new Error('Role must be freelancer, client, or agency');
  }

  // Check if email already registered
  const { data: existingUser } = await db
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existingUser) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  
  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  const emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Insert to database
  const { data: newUser, error } = await db
    .from('users')
    .insert([{
      full_name: name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role,
      phone: phone || '',
      company_name: companyName || '',
      skills: skills || [],
      email_verification_token: emailVerificationToken,
      email_verification_expire: emailVerificationExpire,
      is_email_verified: false
    }])
    .select()
    .single();

  if (error || !newUser) {
    res.status(500);
    throw new Error(error?.message || 'Error creating user account');
  }

  const mappedUser = mapUser(newUser);

  // Send verification email
  try {
    await sendVerificationEmail(mappedUser, token);
  } catch (err) {
    console.error('📧 Verification email failed to send:', err.message || err);
  }

  sendTokenResponse(mappedUser, 201, res, 'Registration successful! Please verify your email.');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!user || !(await comparePassword(password, user.password_hash))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.is_banned) {
    res.status(403);
    throw new Error('Your account has been suspended. Contact support.');
  }

  // Update last seen
  await db
    .from('users')
    .update({ last_seen: new Date().toISOString(), is_online: true })
    .eq('id', user.id);

  const mappedUser = mapUser({ ...user, is_online: true, last_seen: new Date() });
  sendTokenResponse(mappedUser, 200, res, 'Login successful');
});

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('role', 'admin')
    .maybeSingle();

  if (!user || !(await comparePassword(password, user.password_hash))) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  const mappedUser = mapUser(user);
  sendTokenResponse(mappedUser, 200, res, 'Admin login successful');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Update offline status
  if (req.user?.id) {
    await db
      .from('users')
      .update({ is_online: false })
      .eq('id', req.user.id);
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  successResponse(res, {}, 'Logged out successfully');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    res.status(404);
    throw new Error('User account not found');
  }

  successResponse(res, { user: mapUser(user) }, 'Profile retrieved');
});

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('email_verification_token', hashedToken)
    .gt('email_verification_expire', new Date().toISOString())
    .maybeSingle();

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  const { data: updatedUser, error } = await db
    .from('users')
    .update({
      is_email_verified: true,
      email_verification_token: null,
      email_verification_expire: null
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error('Email verification failed');
  }

  sendTokenResponse(mapUser(updatedUser), 200, res, 'Email verified successfully! Welcome to FreelanceHub!');
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res) => {
  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.is_email_verified) {
    res.status(400);
    throw new Error('Email is already verified');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  const emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db
    .from('users')
    .update({ email_verification_token: emailVerificationToken, email_verification_expire: emailVerificationExpire })
    .eq('id', user.id);

  const mappedUser = mapUser({
    ...user,
    emailVerificationToken,
    emailVerificationExpire
  });

  await sendVerificationEmail(mappedUser, token);
  successResponse(res, {}, 'Verification email sent');
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('email', req.body.email.toLowerCase())
    .maybeSingle();

  if (!user) {
    res.status(404);
    throw new Error('No account found with that email');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await db
    .from('users')
    .update({ reset_password_token: resetPasswordToken, reset_password_expire: resetPasswordExpire })
    .eq('id', user.id);

  const mappedUser = mapUser({ ...user, resetPasswordToken, resetPasswordExpire });

  try {
    await sendPasswordResetEmail(mappedUser, token);
    successResponse(res, {}, 'Password reset email sent');
  } catch (err) {
    await db
      .from('users')
      .update({ reset_password_token: null, reset_password_expire: null })
      .eq('id', user.id);

    res.status(500);
    throw new Error('Email could not be sent. Please try again.');
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('reset_password_token', hashedToken)
    .gt('reset_password_expire', new Date().toISOString())
    .maybeSingle();

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(req.body.password);

  const { data: updatedUser, error } = await db
    .from('users')
    .update({
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_expire: null
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error('Failed to update password');
  }

  sendTokenResponse(mapUser(updatedUser), 200, res, 'Password reset successful');
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (!user || !(await comparePassword(currentPassword, user.password_hash))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error('Failed to change password');
  }

  sendTokenResponse(mapUser(updatedUser), 200, res, 'Password changed successfully');
});

module.exports = {
  register, login, adminLogin, logout, getMe,
  verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword,
};
