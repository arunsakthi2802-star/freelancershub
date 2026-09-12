const asyncHandler = require('express-async-handler');
const { db } = require('../config/db');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

// Helper to map DB review to camelCase format
const mapReview = (r) => {
  if (!r) return null;
  return {
    ...r,
    _id: r.id,
    reviewer: r.reviewer ? {
      _id: r.reviewer.id,
      id: r.reviewer.id,
      name: r.reviewer.full_name,
      avatar: r.reviewer.profile_image,
      title: r.reviewer.title
    } : r.reviewer_id,
    project: r.project ? {
      _id: r.project.id,
      id: r.project.id,
      title: r.project.title,
      category: r.project.category
    } : r.project_id
  };
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { projectId, revieweeId, rating, comment, communication, quality, timeliness, expertise, reviewType } = req.body;

  const { data: project } = await db
    .from('projects')
    .select('title, status')
    .eq('id', projectId)
    .single();

  if (!project || project.status !== 'completed') {
    res.status(400);
    throw new Error('Can only review completed projects');
  }

  const { data: existing } = await db
    .from('reviews')
    .select('id')
    .eq('project_id', projectId)
    .eq('reviewer_id', req.user.id)
    .maybeSingle();

  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this project');
  }

  const { data: review, error } = await db
    .from('reviews')
    .insert([{
      project_id: projectId,
      reviewer_id: req.user.id,
      reviewee_id: revieweeId,
      rating: parseFloat(rating),
      comment,
      communication: communication ? parseFloat(communication) : null,
      quality: quality ? parseFloat(quality) : null,
      timeliness: timeliness ? parseFloat(timeliness) : null,
      expertise: expertise ? parseFloat(expertise) : null,
      review_type: reviewType
    }])
    .select()
    .single();

  if (error || !review) {
    res.status(500);
    throw new Error('Failed to submit review');
  }

  // Update user's rating stats
  const { data: userReviews } = await db
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', revieweeId);

  const count = userReviews ? userReviews.length : 0;
  const average = count > 0 ? userReviews.reduce((sum, rev) => sum + parseFloat(rev.rating), 0) / count : 0;

  await db
    .from('users')
    .update({
      rating_average: average,
      rating_count: count
    })
    .eq('id', revieweeId);

  // Send notification to reviewee
  const { data: newNotif } = await db
    .from('notifications')
    .insert([{
      user_id: revieweeId,
      title: 'New Review Received ⭐',
      message: `You received a ${rating}-star review for "${project.title}"`,
      link: `/profile`,
      is_read: false
    }])
    .select()
    .single();

  const io = req.app.get('io');
  if (io && newNotif) {
    const socketNotif = {
      _id: newNotif.id,
      id: newNotif.id,
      recipient: newNotif.user_id,
      title: newNotif.title,
      message: newNotif.message,
      link: newNotif.link,
      isRead: newNotif.is_read,
      createdAt: newNotif.created_at
    };
    io.emit(`notification:${revieweeId}`, socketNotif);
  }

  // Populate review fields
  const { data: populatedReview } = await db
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(id, full_name, profile_image),
      project:projects(id, title)
    `)
    .eq('id', review.id)
    .single();

  successResponse(res, { review: mapReview(populatedReview) }, 'Review submitted successfully', 201);
});

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;

  const { count: total } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('reviewee_id', req.params.userId);

  const { data: reviews, error } = await db
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(id, full_name, profile_image, title),
      project:projects(id, title, category)
    `)
    .eq('reviewee_id', req.params.userId)
    .order('created_at', { ascending: false })
    .range(skip, end);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedReviews = (reviews || []).map(r => mapReview(r));
  paginatedResponse(res, mappedReviews, total || 0, page, limit);
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (reviewer only)
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, communication, quality, timeliness, expertise } = req.body;

  const { data: review } = await db
    .from('reviews')
    .select('*')
    .eq('id', req.params.id)
    .eq('reviewer_id', req.user.id)
    .single();

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const updates = {};
  if (rating !== undefined) updates.rating = parseFloat(rating);
  if (comment !== undefined) updates.comment = comment;
  if (communication !== undefined) updates.communication = parseFloat(communication);
  if (quality !== undefined) updates.quality = parseFloat(quality);
  if (timeliness !== undefined) updates.timeliness = parseFloat(timeliness);
  if (expertise !== undefined) updates.expertise = parseFloat(expertise);

  const { data: updatedReview, error } = await db
    .from('reviews')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error('Failed to update review');
  }

  // Recalculate reviewee average
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

  successResponse(res, { review: mapReview(updatedReview) }, 'Review updated');
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (reviewer or admin)
const deleteReview = asyncHandler(async (req, res) => {
  const { data: review } = await db
    .from('reviews')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const { error } = await db
    .from('reviews')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(500);
    throw new Error('Failed to delete review');
  }

  // Recalculate average
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

  successResponse(res, {}, 'Review deleted');
});

module.exports = { createReview, getUserReviews, updateReview, deleteReview };
