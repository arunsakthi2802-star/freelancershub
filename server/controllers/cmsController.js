const asyncHandler = require('express-async-handler');
const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

// Helper mappers
const mapWebsiteSettings = (s) => {
  if (!s) return null;
  return { ...s, _id: s.id, updatedAt: s.updated_at };
};

const mapHomepageContent = (c) => {
  if (!c) return null;
  return { ...c, _id: c.id, updatedAt: c.updated_at };
};

const mapPage = (p) => {
  if (!p) return null;
  return { ...p, _id: p.id, createdAt: p.created_at };
};

const mapMedia = (m) => {
  if (!m) return null;
  return { ...m, _id: m.id, createdAt: m.created_at };
};

const mapBlog = (b) => {
  if (!b) return null;
  return {
    ...b,
    _id: b.id,
    publishDate: b.publish_date,
    createdAt: b.created_at,
    author: b.author ? {
      _id: b.author.id,
      id: b.author.id,
      name: b.author.full_name,
      avatar: b.author.profile_image
    } : b.author_id
  };
};

const mapSEOSettings = (s) => {
  if (!s) return null;
  return {
    ...s,
    _id: s.id,
    metaTitle: s.meta_title,
    metaDescription: s.meta_description,
    metaKeywords: s.meta_keywords,
    ogTitle: s.og_title,
    ogDescription: s.og_description,
    ogImage: s.og_image,
    twitterCard: s.twitter_card,
    updatedAt: s.updated_at
  };
};

const mapThemeSettings = (s) => {
  if (!s) return null;
  return {
    ...s,
    _id: s.id,
    primaryColor: s.primary_color,
    secondaryColor: s.secondary_color,
    darkBg: s.dark_bg,
    lightBg: s.light_bg,
    updatedAt: s.updated_at
  };
};

// ==========================================
// WEBSITE SETTINGS
// ==========================================
exports.getWebsiteSettings = asyncHandler(async (req, res) => {
  let { data: settings } = await db
    .from('website_settings')
    .select('*')
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await db
      .from('website_settings')
      .insert([{}])
      .select()
      .single();
    settings = newSettings;
  }
  successResponse(res, { settings: mapWebsiteSettings(settings) });
});

exports.updateWebsiteSettings = asyncHandler(async (req, res) => {
  let { data: settings } = await db
    .from('website_settings')
    .select('id')
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await db
      .from('website_settings')
      .insert([{}])
      .select()
      .single();
    settings = newSettings;
  }

  // Map request body to db format
  const updates = {
    name: req.body.name,
    logo: req.body.logo,
    favicon: req.body.favicon,
    contact_email: req.body.contact_email || req.body.contactEmail,
    contact_phone: req.body.contact_phone || req.body.contactPhone,
    social_links: req.body.social_links || req.body.socialLinks || {},
    updated_at: new Date().toISOString()
  };

  const { data: updatedSettings } = await db
    .from('website_settings')
    .update(updates)
    .eq('id', settings.id)
    .select()
    .single();

  successResponse(res, { settings: mapWebsiteSettings(updatedSettings) }, 'Website settings updated successfully');
});

// ==========================================
// HOMEPAGE CONTENT
// ==========================================
exports.getHomepageContent = asyncHandler(async (req, res) => {
  let { data: content } = await db
    .from('homepage_content')
    .select('*')
    .maybeSingle();

  if (!content) {
    const { data: newContent } = await db
      .from('homepage_content')
      .insert([{}])
      .select()
      .single();
    content = newContent;
  }
  successResponse(res, { content: mapHomepageContent(content) });
});

exports.updateHomepageContent = asyncHandler(async (req, res) => {
  let { data: content } = await db
    .from('homepage_content')
    .select('id')
    .maybeSingle();

  if (!content) {
    const { data: newContent } = await db
      .from('homepage_content')
      .insert([{}])
      .select()
      .single();
    content = newContent;
  }

  const updates = {
    hero: req.body.hero || {},
    how_it_works: req.body.how_it_works || req.body.howItWorks || [],
    features: req.body.features || [],
    updated_at: new Date().toISOString()
  };

  const { data: updatedContent } = await db
    .from('homepage_content')
    .update(updates)
    .eq('id', content.id)
    .select()
    .single();

  successResponse(res, { content: mapHomepageContent(updatedContent) }, 'Homepage content updated successfully');
});

// ==========================================
// CUSTOM PAGES
// ==========================================
exports.getPages = asyncHandler(async (req, res) => {
  const { data: pages } = await db
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false });

  const mappedPages = (pages || []).map(p => mapPage(p));
  successResponse(res, { pages: mappedPages });
});

exports.getPageBySlug = asyncHandler(async (req, res) => {
  const { data: page } = await db
    .from('pages')
    .select('*')
    .eq('slug', req.params.slug)
    .maybeSingle();

  if (!page) {
    return errorResponse(res, 'Page not found', 404);
  }
  successResponse(res, { page: mapPage(page) });
});

exports.createPage = asyncHandler(async (req, res) => {
  const { title, content, status, seo } = req.body;

  const { data: page, error } = await db
    .from('pages')
    .insert([{
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      content,
      status,
      seo: seo || {},
      author_id: req.user.id
    }])
    .select()
    .single();

  if (error || !page) {
    return errorResponse(res, error?.message || 'Failed to create page', 500);
  }

  successResponse(res, { page: mapPage(page) }, 'Custom page created successfully', 201);
});

exports.updatePage = asyncHandler(async (req, res) => {
  const { title, content, status, seo } = req.body;

  const updates = {};
  if (title !== undefined) {
    updates.title = title;
    updates.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  if (content !== undefined) updates.content = content;
  if (status !== undefined) updates.status = status;
  if (seo !== undefined) updates.seo = seo;

  const { data: page, error } = await db
    .from('pages')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !page) {
    return errorResponse(res, 'Page not found', 404);
  }
  successResponse(res, { page: mapPage(page) }, 'Custom page updated successfully');
});

exports.deletePage = asyncHandler(async (req, res) => {
  const { data: page, error } = await db
    .from('pages')
    .delete()
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !page) {
    return errorResponse(res, 'Page not found', 404);
  }
  successResponse(res, {}, 'Page deleted successfully');
});

// ==========================================
// MEDIA MANAGER
// ==========================================
exports.getMedia = asyncHandler(async (req, res) => {
  const { folder } = req.query;
  
  let queryBuilder = db
    .from('media')
    .select('*');

  if (folder) {
    queryBuilder = queryBuilder.eq('folder', folder);
  }

  queryBuilder = queryBuilder.order('created_at', { ascending: false });

  const { data: media } = await queryBuilder;
  const mappedMedia = (media || []).map(m => mapMedia(m));

  successResponse(res, { media: mappedMedia });
});

exports.uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }
  const { folder = 'uploads' } = req.body;
  const mediaUrl = `/uploads/attachments/${req.file.filename}`;

  const { data: media, error } = await db
    .from('media')
    .insert([{
      filename: req.file.originalname,
      url: mediaUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
      folder
    }])
    .select()
    .single();

  if (error || !media) {
    return errorResponse(res, 'Failed to upload media', 500);
  }

  successResponse(res, { media: mapMedia(media) }, 'Media file uploaded successfully', 201);
});

exports.deleteMedia = asyncHandler(async (req, res) => {
  const { data: media } = await db
    .from('media')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!media) {
    return errorResponse(res, 'Media not found', 404);
  }

  const filePath = path.join(__dirname, '..', media.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await db
    .from('media')
    .delete()
    .eq('id', req.params.id);

  successResponse(res, {}, 'Media file deleted successfully');
});

// ==========================================
// BLOGS & NEWS
// ==========================================
exports.getBlogs = asyncHandler(async (req, res) => {
  const { data: blogs } = await db
    .from('blogs')
    .select(`
      *,
      author:users!blogs_author_id_fkey(id, full_name, profile_image)
    `)
    .order('publish_date', { ascending: false });

  const mappedBlogs = (blogs || []).map(b => mapBlog(b));
  successResponse(res, { blogs: mappedBlogs });
});

exports.getBlogBySlug = asyncHandler(async (req, res) => {
  const { data: blog } = await db
    .from('blogs')
    .select(`
      *,
      author:users!blogs_author_id_fkey(id, full_name, profile_image)
    `)
    .eq('slug', req.params.slug)
    .maybeSingle();

  if (!blog) {
    return errorResponse(res, 'Blog post not found', 404);
  }
  successResponse(res, { blog: mapBlog(blog) });
});

exports.createBlog = asyncHandler(async (req, res) => {
  const { title, content, image, category, tags, status, publishDate, seo } = req.body;

  const { data: blog, error } = await db
    .from('blogs')
    .insert([{
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      content,
      image,
      category,
      tags: tags || [],
      status,
      publish_date: publishDate || new Date().toISOString(),
      seo: seo || {},
      author_id: req.user.id
    }])
    .select()
    .single();

  if (error || !blog) {
    return errorResponse(res, error?.message || 'Failed to create blog post', 500);
  }

  successResponse(res, { blog: mapBlog(blog) }, 'Blog post created successfully', 201);
});

exports.updateBlog = asyncHandler(async (req, res) => {
  const { title, content, image, category, tags, status, publishDate, seo } = req.body;

  const updates = {};
  if (title !== undefined) {
    updates.title = title;
    updates.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  if (content !== undefined) updates.content = content;
  if (image !== undefined) updates.image = image;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  if (status !== undefined) updates.status = status;
  if (publishDate !== undefined) updates.publish_date = publishDate;
  if (seo !== undefined) updates.seo = seo;

  const { data: blog, error } = await db
    .from('blogs')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !blog) {
    return errorResponse(res, 'Blog post not found', 404);
  }
  successResponse(res, { blog: mapBlog(blog) }, 'Blog post updated successfully');
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const { data: blog, error } = await db
    .from('blogs')
    .delete()
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !blog) {
    return errorResponse(res, 'Blog post not found', 404);
  }
  successResponse(res, {}, 'Blog post deleted successfully');
});

// ==========================================
// SEO SETTINGS
// ==========================================
exports.getSEOSettings = asyncHandler(async (req, res) => {
  let { data: settings } = await db
    .from('seo_settings')
    .select('*')
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await db
      .from('seo_settings')
      .insert([{}])
      .select()
      .single();
    settings = newSettings;
  }
  successResponse(res, { settings: mapSEOSettings(settings) });
});

exports.updateSEOSettings = asyncHandler(async (req, res) => {
  let { data: settings } = await db
    .from('seo_settings')
    .select('id')
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await db
      .from('seo_settings')
      .insert([{}])
      .select()
      .single();
    settings = newSettings;
  }

  const updates = {
    meta_title: req.body.metaTitle,
    meta_description: req.body.metaDescription,
    meta_keywords: req.body.metaKeywords,
    og_title: req.body.ogTitle,
    og_description: req.body.ogDescription,
    og_image: req.body.ogImage,
    twitter_card: req.body.twitterCard,
    updated_at: new Date().toISOString()
  };

  const { data: updatedSettings } = await db
    .from('seo_settings')
    .update(updates)
    .eq('id', settings.id)
    .select()
    .single();

  successResponse(res, { settings: mapSEOSettings(updatedSettings) }, 'SEO settings updated successfully');
});

// ==========================================
// THEME SETTINGS
// ==========================================
exports.getThemeSettings = asyncHandler(async (req, res) => {
  let { data: settings } = await db
    .from('theme_settings')
    .select('*')
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await db
      .from('theme_settings')
      .insert([{}])
      .select()
      .single();
    settings = newSettings;
  }
  successResponse(res, { settings: mapThemeSettings(settings) });
});

exports.updateThemeSettings = asyncHandler(async (req, res) => {
  let { data: settings } = await db
    .from('theme_settings')
    .select('id')
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await db
      .from('theme_settings')
      .insert([{}])
      .select()
      .single();
    settings = newSettings;
  }

  const updates = {
    primary_color: req.body.primaryColor,
    secondary_color: req.body.secondaryColor,
    dark_bg: req.body.darkBg,
    light_bg: req.body.lightBg,
    radius: req.body.radius,
    updated_at: new Date().toISOString()
  };

  const { data: updatedSettings } = await db
    .from('theme_settings')
    .update(updates)
    .eq('id', settings.id)
    .select()
    .single();

  successResponse(res, { settings: mapThemeSettings(updatedSettings) }, 'Theme settings updated successfully');
});
