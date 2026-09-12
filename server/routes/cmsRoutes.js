const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { uploadAttachment } = require('../middleware/upload');

// Public settings fetches
router.get('/settings', cmsController.getWebsiteSettings);
router.get('/homepage', cmsController.getHomepageContent);
router.get('/pages/:slug', cmsController.getPageBySlug);
router.get('/blogs/:slug', cmsController.getBlogBySlug);
router.get('/seo', cmsController.getSEOSettings);
router.get('/theme', cmsController.getThemeSettings);
router.get('/blogs', cmsController.getBlogs);
router.get('/pages', cmsController.getPages);

// Admin-only operations
router.use(protect, authorize('admin'));

router.put('/settings', cmsController.updateWebsiteSettings);
router.put('/homepage', cmsController.updateHomepageContent);
router.put('/seo', cmsController.updateSEOSettings);
router.put('/theme', cmsController.updateThemeSettings);

// Pages CRUD
router.post('/pages', cmsController.createPage);
router.put('/pages/:id', cmsController.updatePage);
router.delete('/pages/:id', cmsController.deletePage);

// Media Manager
router.get('/media', cmsController.getMedia);
router.post('/media', uploadAttachment.single('file'), cmsController.uploadMedia);
router.delete('/media/:id', cmsController.deleteMedia);

// Blogs CRUD
router.post('/blogs', cmsController.createBlog);
router.put('/blogs/:id', cmsController.updateBlog);
router.delete('/blogs/:id', cmsController.deleteBlog);

module.exports = router;
