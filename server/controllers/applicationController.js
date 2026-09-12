const asyncHandler = require('express-async-handler');
const { db, mapUser } = require('../config/db');
const { mapProject } = require('./projectController');
const { sendApplicationNotification, sendApplicationStatusEmail } = require('../services/emailService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

// Map database application fields back to original Mongoose camelCase format
const mapApplication = (app) => {
  if (!app) return null;
  return {
    ...app,
    _id: app.id,
    coverLetter: app.proposal,
    createdAt: app.created_at,
    updatedAt: app.updated_at,
    bidAmount: app.bid_amount ? parseFloat(app.bid_amount) : 0,
    deliveryTime: app.delivery_time,
    project: app.project ? mapProject(app.project) : app.project_id,
    freelancer: app.freelancer ? {
      _id: app.freelancer.id,
      id: app.freelancer.id,
      name: app.freelancer.full_name,
      avatar: app.freelancer.profile_image,
      title: app.freelancer.title,
      skills: app.freelancer.skills,
      rating: {
        average: app.freelancer.rating_average ? parseFloat(app.freelancer.rating_average) : 0,
        count: app.freelancer.rating_count || 0
      },
      hourlyRate: app.freelancer.hourly_rate ? parseFloat(app.freelancer.hourly_rate) : 0,
      completedProjects: app.freelancer.completed_projects || 0
    } : app.freelancer_id
  };
};

// @desc    Apply to a project
// @route   POST /api/applications
// @access  Private (freelancer)
const applyToProject = asyncHandler(async (req, res) => {
  const { projectId, coverLetter, bidAmount, deliveryTime, milestones } = req.body;

  // Fetch project details and client email
  const { data: project, error: projErr } = await db
    .from('projects')
    .select(`
      *,
      client:users!projects_client_id_fkey(id, email, full_name)
    `)
    .eq('id', projectId)
    .single();

  if (projErr || !project || project.status !== 'open') {
    res.status(404);
    throw new Error('Project not found or no longer accepting applications');
  }

  // Check existing application
  const { data: existing } = await db
    .from('applications')
    .select('id')
    .eq('project_id', projectId)
    .eq('freelancer_id', req.user.id)
    .maybeSingle();

  if (existing) {
    res.status(400);
    throw new Error('You have already applied to this project');
  }

  // Insert application
  const { data: newApp, error: appErr } = await db
    .from('applications')
    .insert([{
      project_id: projectId,
      freelancer_id: req.user.id,
      proposal: coverLetter,
      bid_amount: parseFloat(bidAmount),
      delivery_time: parseInt(deliveryTime),
      status: 'pending'
    }])
    .select()
    .single();

  if (appErr || !newApp) {
    res.status(500);
    throw new Error(appErr?.message || 'Failed to submit proposal');
  }

  // Increment application count
  await db
    .from('projects')
    .update({ total_applications: (project.total_applications || 0) + 1 })
    .eq('id', projectId);

  // Fetch freelancer details
  const { data: freelancer } = await db
    .from('users')
    .select('id, full_name, profile_image')
    .eq('id', req.user.id)
    .single();

  // Create notification for client
  const { data: newNotif, error: notifErr } = await db
    .from('notifications')
    .insert([{
      user_id: project.client_id,
      title: 'New Proposal Received',
      message: `${freelancer.full_name} submitted a proposal for "${project.title}"`,
      link: `/client/applications`,
      is_read: false
    }])
    .select()
    .single();

  // Emit socket notification
  const io = req.app.get('io');
  if (io && newNotif) {
    // Replicate Mongoose notification schema fields for Socket.io
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
    io.emit(`notification:${project.client_id}`, socketNotif);
  }

  // Send email notification
  try {
    const clientUser = {
      name: project.client.full_name,
      email: project.client.email
    };
    const freelancerUser = {
      name: freelancer.full_name
    };
    await sendApplicationNotification(clientUser, freelancerUser, project);
  } catch (e) {
    console.error('Application notification email failed:', e.message);
  }

  // Populate app response
  const { data: populatedApp } = await db
    .from('applications')
    .select(`
      *,
      project:projects(id, title, budget, deadline, category),
      freelancer:users!applications_freelancer_id_fkey(id, full_name, profile_image, title, rating_average, rating_count, skills)
    `)
    .eq('id', newApp.id)
    .single();

  successResponse(res, { application: mapApplication(populatedApp) }, 'Application submitted successfully', 201);
});

// @desc    Get applications for a project (client view)
// @route   GET /api/applications/project/:projectId
// @access  Private (client)
const getProjectApplications = asyncHandler(async (req, res) => {
  const { data: project } = await db
    .from('projects')
    .select('client_id')
    .eq('id', req.params.projectId)
    .single();

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.client_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const { data: applications, error } = await db
    .from('applications')
    .select(`
      *,
      freelancer:users!applications_freelancer_id_fkey(id, full_name, profile_image, title, skills, rating_average, rating_count, hourly_rate, completed_projects)
    `)
    .eq('project_id', req.params.projectId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedApps = (applications || []).map(app => mapApplication(app));
  successResponse(res, { applications: mappedApps, total: mappedApps.length });
});

// @desc    Get freelancer's own applications
// @route   GET /api/applications/my-applications
// @access  Private (freelancer)
const getMyApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  let queryBuilder = db
    .from('applications')
    .select(`
      *,
      project:projects(
        id, title, category, budget, deadline, status, client_id,
        client:users!projects_client_id_fkey(id, full_name, profile_image, company_name)
      )
    `, { count: 'exact' })
    .eq('freelancer_id', req.user.id);

  if (status) queryBuilder = queryBuilder.eq('status', status);

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: applications, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedApps = (applications || []).map(app => mapApplication(app));
  paginatedResponse(res, mappedApps, total || 0, page, limit);
});

// @desc    Update application status (accept/reject)
// @route   PUT /api/applications/:id
// @access  Private (client)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Status must be accepted or rejected');
  }

  const { data: application, error } = await db
    .from('applications')
    .select(`
      *,
      freelancer:users!applications_freelancer_id_fkey(id, full_name, email),
      project:projects(id, title, client_id, total_applications)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (application.project.client_id !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Update application status
  const updates = { status };
  if (rejectionReason) updates.rejection_reason = rejectionReason;

  const { data: updatedApp } = await db
    .from('applications')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  // If accepted, update project status and assign freelancer
  if (status === 'accepted') {
    await db
      .from('projects')
      .update({
        status: 'in-progress',
        assigned_freelancer_id: application.freelancer_id
      })
      .eq('id', application.project_id);

    // Reject all other pending applications for this project
    await db
      .from('applications')
      .update({ status: 'rejected' })
      .eq('project_id', application.project_id)
      .neq('id', application.id)
      .eq('status', 'pending');

    // Increment freelancer active projects
    const { data: freelancerUser } = await db
      .from('users')
      .select('active_projects')
      .eq('id', application.freelancer_id)
      .single();

    await db
      .from('users')
      .update({ active_projects: (freelancerUser?.active_projects || 0) + 1 })
      .eq('id', application.freelancer_id);
  }

  // Create notification for freelancer
  const { data: newNotif } = await db
    .from('notifications')
    .insert([{
      user_id: application.freelancer_id,
      title: `Proposal ${status === 'accepted' ? 'Accepted! 🎉' : 'Not Selected'}`,
      message: `Your proposal for "${application.project.title}" was ${status}`,
      link: `/freelancer/applications`,
      is_read: false
    }])
    .select()
    .single();

  // Emit socket notification
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
    io.emit(`notification:${application.freelancer_id}`, socketNotif);
  }

  // Send status email
  try {
    const freelancerUser = {
      name: application.freelancer.full_name,
      email: application.freelancer.email
    };
    await sendApplicationStatusEmail(freelancerUser, application.project, status);
  } catch (e) {
    console.error('Status email failed:', e.message);
  }

  successResponse(res, { application: mapApplication(updatedApp) }, `Application ${status} successfully`);
});

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (freelancer)
const withdrawApplication = asyncHandler(async (req, res) => {
  const { data: application } = await db
    .from('applications')
    .select('id, status, project_id')
    .eq('id', req.params.id)
    .eq('freelancer_id', req.user.id)
    .single();

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (application.status !== 'pending') {
    res.status(400);
    throw new Error('Can only withdraw pending applications');
  }

  const { data: updatedApp } = await db
    .from('applications')
    .update({ status: 'withdrawn' })
    .eq('id', req.params.id)
    .select()
    .single();

  // Decrement project total applications count
  const { data: project } = await db
    .from('projects')
    .select('total_applications')
    .eq('id', application.project_id)
    .single();

  await db
    .from('projects')
    .update({ total_applications: Math.max(0, (project?.total_applications || 0) - 1) })
    .eq('id', application.project_id);

  successResponse(res, { application: mapApplication(updatedApp) }, 'Application withdrawn');
});

module.exports = {
  applyToProject, getProjectApplications, getMyApplications,
  updateApplicationStatus, withdrawApplication,
  mapApplication
};
