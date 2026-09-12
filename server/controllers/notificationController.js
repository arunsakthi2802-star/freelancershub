const asyncHandler = require('express-async-handler');
const { db } = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

// Helper to map DB notification to camelCase format
const mapNotification = (n) => {
  if (!n) return null;
  return {
    ...n,
    _id: n.id,
    recipient: n.user_id,
    isRead: n.is_read,
    createdAt: n.created_at
  };
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  let queryBuilder = db
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id);

  if (unreadOnly === 'true') {
    queryBuilder = queryBuilder.eq('is_read', false);
  }

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: notifications, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  // Count unread
  const { count: unreadCount } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  const mappedNotifs = (notifications || []).map(n => mapNotification(n));

  res.status(200).json({
    success: true,
    count: mappedNotifs.length,
    total: total || 0,
    page: parseInt(page),
    pages: Math.ceil((total || 0) / parseInt(limit)),
    unreadCount: unreadCount || 0,
    notifications: mappedNotifs,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { data: notification, error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error || !notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  successResponse(res, { notification: mapNotification(notification) }, 'Notification marked as read');
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const { error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  successResponse(res, {}, 'All notifications marked as read');
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const { error } = await db
    .from('notifications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) {
    res.status(500);
    throw new Error('Failed to delete notification');
  }

  successResponse(res, {}, 'Notification deleted');
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const { error } = await db
    .from('notifications')
    .delete()
    .eq('user_id', req.user.id);

  if (error) {
    res.status(500);
    throw new Error('Failed to delete notifications');
  }

  successResponse(res, {}, 'All notifications deleted');
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications };
