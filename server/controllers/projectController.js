const asyncHandler = require('express-async-handler');
const { db, mapUser } = require('../config/db');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

// Map database project fields back to original Mongoose camelCase format
const mapProject = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    skills: p.required_skills,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    client: p.client ? {
      _id: p.client.id,
      id: p.client.id,
      name: p.client.full_name,
      avatar: p.client.profile_image,
      companyName: p.client.company_name,
      rating: {
        average: p.client.rating_average ? parseFloat(p.client.rating_average) : 0,
        count: p.client.rating_count || 0
      },
      location: p.client.location,
      completedProjects: p.client.completed_projects || 0
    } : p.client_id,
    assignedFreelancer: p.assignedFreelancer ? {
      _id: p.assignedFreelancer.id,
      id: p.assignedFreelancer.id,
      name: p.assignedFreelancer.full_name,
      avatar: p.assignedFreelancer.profile_image,
      rating: {
        average: p.assignedFreelancer.rating_average ? parseFloat(p.assignedFreelancer.rating_average) : 0,
        count: p.assignedFreelancer.rating_count || 0
      },
      title: p.assignedFreelancer.title
    } : p.assigned_freelancer_id
  };
};

// @desc    Get all projects with search & filter
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res) => {
  const {
    search, category, skills, minBudget, maxBudget,
    budgetType, experience, duration, sort = '-createdAt',
    page = 1, limit = 12, status = 'open',
  } = req.query;

  let queryBuilder = db
    .from('projects')
    .select(`
      *,
      client:users!projects_client_id_fkey(id, full_name, profile_image, company_name, rating_average, rating_count, location)
    `, { count: 'exact' })
    .eq('is_active', true);

  if (status) queryBuilder = queryBuilder.eq('status', status);
  if (category) queryBuilder = queryBuilder.eq('category', category);
  
  if (budgetType) {
    queryBuilder = queryBuilder.eq('budget->>type', budgetType);
  }
  
  if (minBudget) {
    queryBuilder = queryBuilder.gte('budget->>min', parseFloat(minBudget));
  }
  
  if (maxBudget) {
    queryBuilder = queryBuilder.lte('budget->>min', parseFloat(maxBudget));
  }

  if (experience) {
    queryBuilder = queryBuilder.eq('experience', experience);
  }
  if (duration) {
    queryBuilder = queryBuilder.eq('duration', duration);
  }
  if (skills) {
    const skillsArray = skills.split(',');
    queryBuilder = queryBuilder.overlaps('required_skills', skillsArray);
  }

  if (search) {
    queryBuilder = queryBuilder.or(`title.ilike.%${search}%,description.ilike.%${search}%,required_skills.cs.{"${search}"}`);
  }

  // Sort
  const isDesc = sort.startsWith('-');
  const sortCol = isDesc ? sort.slice(1) : sort;
  let dbSortCol = 'created_at';
  if (sortCol === 'createdAt') dbSortCol = 'created_at';

  queryBuilder = queryBuilder.order(dbSortCol, { ascending: !isDesc });

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: projects, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedProjects = (projects || []).map(p => mapProject(p));
  paginatedResponse(res, mappedProjects, total || 0, page, limit);
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = asyncHandler(async (req, res) => {
  const { data: project, error } = await db
    .from('projects')
    .select(`
      *,
      client:users!projects_client_id_fkey(id, full_name, profile_image, company_name, rating_average, rating_count, location, completed_projects),
      assignedFreelancer:users!projects_assigned_freelancer_id_fkey(id, full_name, profile_image, rating_average, rating_count, title)
    `)
    .eq('id', req.params.id)
    .maybeSingle();

  if (error || !project || !project.is_active) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Increment views
  await db
    .from('projects')
    .update({ views: (project.views || 0) + 1 })
    .eq('id', project.id);

  successResponse(res, { project: mapProject({ ...project, views: (project.views || 0) + 1 }) });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private (client only)
const createProject = asyncHandler(async (req, res) => {
  const { title, description, category, skills, budget, deadline, duration, experience, tags } = req.body;

  const parsedBudget = typeof budget === 'string' ? JSON.parse(budget) : budget;

  const { data: newProj, error } = await db
    .from('projects')
    .insert([{
      title,
      description,
      category,
      required_skills: skills || [],
      budget: parsedBudget,
      deadline: deadline || null,
      duration: duration || '',
      experience: experience || '',
      tags: tags || [],
      client_id: req.user.id,
      status: 'open',
      is_active: true
    }])
    .select(`
      *,
      client:users!projects_client_id_fkey(id, full_name, profile_image, company_name, rating_average, rating_count, location)
    `)
    .single();

  if (error || !newProj) {
    res.status(500);
    throw new Error(error?.message || 'Failed to create project listing');
  }

  const populatedProject = mapProject(newProj);

  const io = req.app.get('io');
  if (io) {
    io.emit('project:new', populatedProject);
  }

  successResponse(res, { project: populatedProject }, 'Project created successfully', 201);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (client - owner only)
const updateProject = asyncHandler(async (req, res) => {
  const { title, description, category, skills, budget, deadline, duration, experience, tags, status } = req.body;

  const { data: existingProject } = await db
    .from('projects')
    .select('client_id, status')
    .eq('id', req.params.id)
    .single();

  if (!existingProject) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (existingProject.client_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  if (existingProject.status === 'completed' || existingProject.status === 'cancelled') {
    res.status(400);
    throw new Error('Cannot update a completed or cancelled project');
  }

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (skills !== undefined) updates.required_skills = skills;
  if (budget !== undefined) updates.budget = typeof budget === 'string' ? JSON.parse(budget) : budget;
  if (deadline !== undefined) updates.deadline = deadline;
  if (duration !== undefined) updates.duration = duration;
  if (experience !== undefined) updates.experience = experience;
  if (tags !== undefined) updates.tags = tags;
  if (status !== undefined) updates.status = status;

  const { data: updatedProj, error } = await db
    .from('projects')
    .update(updates)
    .eq('id', req.params.id)
    .select(`
      *,
      client:users!projects_client_id_fkey(id, full_name, profile_image, company_name, rating_average, rating_count, location)
    `)
    .single();

  if (error || !updatedProj) {
    res.status(500);
    throw new Error(error?.message || 'Project update failed');
  }

  successResponse(res, { project: mapProject(updatedProj) }, 'Project updated successfully');
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (client - owner or admin)
const deleteProject = asyncHandler(async (req, res) => {
  const { data: project } = await db
    .from('projects')
    .select('client_id')
    .eq('id', req.params.id)
    .single();

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.client_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this project');
  }

  await db
    .from('projects')
    .update({ is_active: false, status: 'cancelled' })
    .eq('id', req.params.id);

  successResponse(res, {}, 'Project deleted successfully');
});

// @desc    Get client's projects
// @route   GET /api/projects/client/my-projects
// @access  Private (client)
const getClientProjects = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  let queryBuilder = db
    .from('projects')
    .select(`
      *,
      assignedFreelancer:users!projects_assigned_freelancer_id_fkey(id, full_name, profile_image, rating_average, rating_count)
    `, { count: 'exact' })
    .eq('client_id', req.user.id)
    .eq('is_active', true);

  if (status) queryBuilder = queryBuilder.eq('status', status);

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;
  queryBuilder = queryBuilder.range(skip, end);

  const { data: projects, count: total, error } = await queryBuilder;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedProjects = (projects || []).map(p => mapProject(p));
  paginatedResponse(res, mappedProjects, total || 0, page, limit);
});

// @desc    Get featured projects
// @route   GET /api/projects/featured
// @access  Public
const getFeaturedProjects = asyncHandler(async (req, res) => {
  const { data: projects, error } = await db
    .from('projects')
    .select(`
      *,
      client:users!projects_client_id_fkey(id, full_name, profile_image, company_name)
    `)
    .eq('is_active', true)
    .eq('status', 'open')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const mappedProjects = (projects || []).map(p => mapProject(p));
  successResponse(res, { projects: mappedProjects });
});

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Public
const getProjectStats = asyncHandler(async (req, res) => {
  const { data, error } = await db
    .rpc('get_project_stats_by_category'); // Custom RPC or perform simple fetch and group in JS

  if (error) {
    // If rpc does not exist, fall back to simple javascript grouping
    const { data: allProjects } = await db
      .from('projects')
      .select('category')
      .eq('is_active', true);

    const counts = {};
    (allProjects || []).forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    const stats = Object.keys(counts).map(cat => ({
      _id: cat,
      count: counts[cat]
    })).sort((a, b) => b.count - a.count);

    return successResponse(res, { stats });
  }

  successResponse(res, { stats: data });
});

module.exports = {
  getProjects, getProjectById, createProject, updateProject,
  deleteProject, getClientProjects, getFeaturedProjects, getProjectStats,
  mapProject // export mapping helper for other controllers
};
