const asyncHandler = require('express-async-handler');
const { db } = require('../config/db');
const { createPaymentIntent, constructWebhookEvent } = require('../services/stripeService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

// Helper to map DB payment to camelCase format
const mapPayment = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    project: p.project ? {
      _id: p.project.id,
      id: p.project.id,
      title: p.project.title,
      description: p.project.description
    } : p.project_id,
    payer: p.payer ? {
      _id: p.payer.id,
      id: p.payer.id,
      name: p.payer.full_name,
      email: p.payer.email,
      avatar: p.payer.profile_image
    } : p.client_id,
    payee: p.payee ? {
      _id: p.payee.id,
      id: p.payee.id,
      name: p.payee.full_name,
      email: p.payee.email,
      avatar: p.payee.profile_image
    } : p.freelancer_id,
    amount: p.amount ? parseFloat(p.amount) : 0,
    platformFee: p.fee ? parseFloat(p.fee) : 0,
    netAmount: p.net_amount ? parseFloat(p.net_amount) : 0,
    status: p.payment_status,
    stripePaymentIntentId: p.stripe_session_id,
    invoiceNumber: `INV-${p.id.slice(0, 8).toUpperCase()}`,
    createdAt: p.created_at
  };
};

// @desc    Create payment intent (Stripe)
// @route   POST /api/payments/create-intent
// @access  Private (client)
const createIntent = asyncHandler(async (req, res) => {
  const { projectId, amount, freelancerId } = req.body;

  const { data: project } = await db
    .from('projects')
    .select('id, title')
    .eq('id', projectId)
    .single();

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const platformFee = Math.round(amount * 0.1 * 100) / 100; // 10% platform fee
  const netAmount = amount - platformFee;

  const paymentIntent = await createPaymentIntent({
    amount,
    currency: 'usd',
    metadata: { projectId, clientId: req.user.id, freelancerId, platformFee: platformFee.toString() },
  });

  const { data: payment, error } = await db
    .from('payments')
    .insert([{
      project_id: projectId,
      client_id: req.user.id,
      freelancer_id: freelancerId,
      amount: parseFloat(amount),
      fee: platformFee,
      net_amount: netAmount,
      stripe_session_id: paymentIntent.id,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (error || !payment) {
    res.status(500);
    throw new Error(error?.message || 'Failed to create payment record');
  }

  const mappedPayment = mapPayment(payment);

  successResponse(res, {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment.id,
    invoiceNumber: mappedPayment.invoiceNumber,
  }, 'Payment intent created');
});

// @desc    Handle Stripe Webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    res.status(400);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    const { data: payment } = await db
      .from('payments')
      .select('*')
      .eq('stripe_session_id', paymentIntent.id)
      .maybeSingle();

    if (payment && payment.payment_status === 'pending') {
      await db
        .from('payments')
        .update({ payment_status: 'completed' })
        .eq('id', payment.id);

      await db
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', payment.project_id);

      // Increment Freelancer stats
      const { data: payee } = await db
        .from('users')
        .select('total_earnings, completed_projects')
        .eq('id', payment.freelancer_id)
        .single();

      await db
        .from('users')
        .update({
          total_earnings: (payee?.total_earnings || 0) + parseFloat(payment.net_amount),
          completed_projects: (payee?.completed_projects || 0) + 1
        })
        .eq('id', payment.freelancer_id);

      // Increment Client stats
      const { data: payer } = await db
        .from('users')
        .select('total_spent')
        .eq('id', payment.client_id)
        .single();

      await db
        .from('users')
        .update({ total_spent: (payer?.total_spent || 0) + parseFloat(payment.amount) })
        .eq('id', payment.client_id);

      // Send notification
      const { data: newNotif } = await db
        .from('notifications')
        .insert([{
          user_id: payment.freelancer_id,
          title: 'Payment Received 💰',
          message: `$${payment.net_amount} has been transferred to your account`,
          link: '/freelancer/earnings',
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
        io.emit(`notification:${payment.freelancer_id}`, socketNotif);
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    await db
      .from('payments')
      .update({ payment_status: 'failed' })
      .eq('stripe_session_id', paymentIntent.id);
  }

  res.json({ received: true });
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  let queryBuilder = db
    .from('payments')
    .select(`
      *,
      project:projects(id, title),
      payer:users!payments_client_id_fkey(id, full_name, profile_image),
      payee:users!payments_freelancer_id_fkey(id, full_name, profile_image)
    `, { count: 'exact' })
    .or(`client_id.eq.${req.user.id},freelancer_id.eq.${req.user.id}`);

  if (status) {
    queryBuilder = queryBuilder.eq('payment_status', status);
  }

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: payments, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedPayments = (payments || []).map(p => mapPayment(p));
  paginatedResponse(res, mappedPayments, total || 0, page, limit);
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const { data: payment, error } = await db
    .from('payments')
    .select(`
      *,
      project:projects(id, title, description),
      payer:users!payments_client_id_fkey(id, full_name, email, profile_image),
      payee:users!payments_freelancer_id_fkey(id, full_name, email, profile_image)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  if (payment.client_id !== req.user.id && payment.freelancer_id !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this payment');
  }

  successResponse(res, { payment: mapPayment(payment) });
});

// @desc    Confirm Mock Payment in local development
// @route   POST /api/payments/confirm-mock
// @access  Private (client)
const confirmMockPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.body;

  const { data: payment } = await db
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  if (payment.payment_status === 'pending') {
    await db
      .from('payments')
      .update({ payment_status: 'completed' })
      .eq('id', payment.id);

    await db
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', payment.project_id);

    // Update Freelancer stats
    const { data: payee } = await db
      .from('users')
      .select('total_earnings, completed_projects')
      .eq('id', payment.freelancer_id)
      .single();

    await db
      .from('users')
      .update({
        total_earnings: (payee?.total_earnings || 0) + parseFloat(payment.net_amount),
        completed_projects: (payee?.completed_projects || 0) + 1
      })
      .eq('id', payment.freelancer_id);

    // Update Client stats
    const { data: payer } = await db
      .from('users')
      .select('total_spent')
      .eq('id', payment.client_id)
      .single();

    await db
      .from('users')
      .update({ total_spent: (payer?.total_spent || 0) + parseFloat(payment.amount) })
      .eq('id', payment.client_id);

    // Send notification
    const { data: newNotif } = await db
      .from('notifications')
      .insert([{
        user_id: payment.freelancer_id,
        title: 'Payment Received 💰',
        message: `$${payment.net_amount} has been transferred to your account`,
        link: '/freelancer/earnings',
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
      io.emit(`notification:${payment.freelancer_id}`, socketNotif);
    }
  }

  // Refetch updated payment details
  const { data: updatedPayment } = await db
    .from('payments')
    .select(`
      *,
      project:projects(id, title),
      payer:users!payments_client_id_fkey(id, full_name, profile_image),
      payee:users!payments_freelancer_id_fkey(id, full_name, profile_image)
    `)
    .eq('id', paymentId)
    .single();

  successResponse(res, { payment: mapPayment(updatedPayment) }, 'Mock payment processed successfully');
});

module.exports = { createIntent, stripeWebhook, getPaymentHistory, getPaymentById, confirmMockPayment };
