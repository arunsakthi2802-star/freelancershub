import { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import {
  Globe, FileText, Image, Palette, Settings, Eye, Play, Plus, Trash2, Edit2,
  Lock, Save, RefreshCw, Layers, PhoneCall, Info, LayoutDashboard, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../../utils/helpers';

export default function WebsiteEditor() {
  const [activeTab, setActiveTab] = useState('homepage');
  const [saving, setSaving] = useState(false);

  // States
  const [homepage, setHomepage] = useState(null);
  const [website, setWebsite] = useState(null);
  const [pagesList, setPagesList] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [blogsList, setBlogsList] = useState([]);
  const [seo, setSeo] = useState(null);
  const [themeSettings, setThemeSettings] = useState(null);

  // New item modal/form states
  const [newPage, setNewPage] = useState({ title: '', content: '', status: 'draft', seo: { metaTitle: '', metaDescription: '', keywords: '' } });
  const [editingPageId, setEditingPageId] = useState(null);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', category: 'General', tags: '', status: 'draft', seo: { metaTitle: '', metaDescription: '', keywords: '' } });
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  const loadData = async () => {
    try {
      const [homeRes, webRes, pagesRes, mediaRes, blogsRes, seoRes, themeRes] = await Promise.all([
        cmsService.getHomepage(),
        cmsService.getSettings(),
        cmsService.getPages(),
        cmsService.getMedia(),
        cmsService.getBlogs(),
        cmsService.getSEO(),
        cmsService.getTheme()
      ]);

      setHomepage(homeRes.content);
      setWebsite(webRes.settings);
      setPagesList(pagesRes.pages || []);
      setMediaList(mediaRes.media || []);
      setBlogsList(blogsRes.blogs || []);
      setSeo(seoRes.settings);
      setThemeSettings(themeRes.settings);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load website editor content');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateHomepage = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cmsService.updateHomepage(homepage);
      toast.success('Homepage content saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update homepage');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWebsite = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cmsService.updateSettings(website);
      toast.success('Website general settings updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSEO = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cmsService.updateSEO(seo);
      toast.success('SEO & Search configurations saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update SEO');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTheme = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cmsService.updateTheme(themeSettings);
      toast.success('Theme colors and stylesheet preferences updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  // Custom Pages CRUD
  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      if (editingPageId) {
        await cmsService.updatePage(editingPageId, newPage);
        toast.success('Page updated');
      } else {
        await cmsService.createPage(newPage);
        toast.success('Custom page created successfully');
      }
      setNewPage({ title: '', content: '', status: 'draft', seo: { metaTitle: '', metaDescription: '', keywords: '' } });
      setEditingPageId(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('Delete this page permanently?')) return;
    try {
      await cmsService.deletePage(id);
      toast.success('Page deleted');
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Blogs CRUD
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    const blogData = {
      ...newBlog,
      tags: typeof newBlog.tags === 'string' ? newBlog.tags.split(',').map(t => t.trim()) : newBlog.tags
    };
    try {
      if (editingBlogId) {
        await cmsService.updateBlog(editingBlogId, blogData);
        toast.success('Blog post updated');
      } else {
        await cmsService.createBlog(blogData);
        toast.success('Blog post published');
      }
      setNewBlog({ title: '', content: '', category: 'General', tags: '', status: 'draft', seo: { metaTitle: '', metaDescription: '', keywords: '' } });
      setEditingBlogId(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await cmsService.deleteBlog(id);
      toast.success('Blog post deleted');
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Media Manager
  const handleUploadMedia = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('folder', 'gallery');

    try {
      await cmsService.uploadMedia(formData);
      toast.success('Media file uploaded');
      setUploadFile(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!window.confirm('Delete media file?')) return;
    try {
      await cmsService.deleteMedia(id);
      toast.success('Media deleted');
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }} className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="page-title">Website CMS Editor</h1>
          <p className="page-subtitle">Update colors, homepage text sections, navigation configurations, and media catalog.</p>
        </div>
      </div>

      {/* Editor Tabs */}
      <div className="tabs" style={{ marginBottom: 24, overflowX: 'auto', display: 'flex' }}>
        {[
          { id: 'homepage', icon: Globe, label: 'Homepage' },
          { id: 'customization', icon: Palette, label: 'Customization' },
          { id: 'pages', icon: FileText, label: 'Pages' },
          { id: 'blogs', icon: Layers, label: 'Blogs' },
          { id: 'media', icon: Image, label: 'Media Manager' },
          { id: 'seo', icon: Share2, label: 'SEO' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* HOMEPAGE EDITOR */}
      {/* ========================================== */}
      {activeTab === 'homepage' && homepage && (
        <form onSubmit={handleUpdateHomepage} className="card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 className="text-lg font-bold">Homepage Section Layout Settings</h3>

          <div className="grid grid-2" style={{ gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Hero Title</label>
              <input
                type="text"
                className="form-input"
                value={homepage.hero.title}
                onChange={e => setHomepage({ ...homepage, hero: { ...homepage.hero, title: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Subtitle</label>
              <input
                type="text"
                className="form-input"
                value={homepage.hero.subtitle}
                onChange={e => setHomepage({ ...homepage, hero: { ...homepage.hero, subtitle: e.target.value } })}
              />
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Primary Action Button Text</label>
              <input
                type="text"
                className="form-input"
                value={homepage.hero.buttonText}
                onChange={e => setHomepage({ ...homepage, hero: { ...homepage.hero, buttonText: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Secondary Action Button Text</label>
              <input
                type="text"
                className="form-input"
                value={homepage.hero.secondaryButtonText}
                onChange={e => setHomepage({ ...homepage, hero: { ...homepage.hero, secondaryButtonText: e.target.value } })}
              />
            </div>
          </div>

          <h4 style={{ fontWeight: 600, marginTop: 12 }}>Section Visibility Toggles</h4>
          <div className="grid grid-4" style={{ gap: 16 }}>
            {Object.keys(homepage.sectionsVisibility || {}).map(section => (
              <div key={section} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={section}
                  checked={homepage.sectionsVisibility[section]}
                  onChange={e => {
                    const newVis = { ...homepage.sectionsVisibility, [section]: e.target.checked };
                    setHomepage({ ...homepage, sectionsVisibility: newVis });
                  }}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor={section} style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{section}</label>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary btn-sm align-self-start" style={{ gap: 6 }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Homepage Content'}
          </button>
        </form>
      )}

      {/* ========================================== */}
      {/* PALETTE / THEME / LOGO CUSTOMIZATION */}
      {/* ========================================== */}
      {activeTab === 'customization' && themeSettings && website && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleUpdateTheme} className="card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 className="text-lg font-bold">Theme Style customization</h3>
            <div className="grid grid-3" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Primary Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ padding: 0, width: 44, height: 44 }}
                    value={themeSettings.primaryColor}
                    onChange={e => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={themeSettings.primaryColor}
                    onChange={e => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Secondary Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ padding: 0, width: 44, height: 44 }}
                    value={themeSettings.secondaryColor}
                    onChange={e => setThemeSettings({ ...themeSettings, secondaryColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={themeSettings.secondaryColor}
                    onChange={e => setThemeSettings({ ...themeSettings, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Theme Accent</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ padding: 0, width: 44, height: 44 }}
                    value={themeSettings.accentColor}
                    onChange={e => setThemeSettings({ ...themeSettings, accentColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={themeSettings.accentColor}
                    onChange={e => setThemeSettings({ ...themeSettings, accentColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Typography Font</label>
              <select
                className="form-select"
                value={themeSettings.fontFamily}
                onChange={e => setThemeSettings({ ...themeSettings, fontFamily: e.target.value })}
              >
                <option value="Inter">Inter (Sans Serif)</option>
                <option value="Poppins">Poppins (Display Sans)</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary btn-sm align-self-start" style={{ gap: 6 }}>
              <Save size={14} /> Update Theme Preferences
            </button>
          </form>

          {/* Website logo / name settings */}
          <form onSubmit={handleUpdateWebsite} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 className="text-lg font-bold">Logo & Site Branding</h3>
            <div className="grid grid-2" style={{ gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Site Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={website.name}
                  onChange={e => setWebsite({ ...website, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Logo Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={website.logo}
                  onChange={e => setWebsite({ ...website, logo: e.target.value })}
                  placeholder="/uploads/attachments/logo.png"
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm align-self-start">
              Save site configurations
            </button>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* PAGES LIST & BUILDER */}
      {/* ========================================== */}
      {activeTab === 'pages' && (
        <div className="grid-layout-sidebar-right-340" style={{ gap: 24 }}>
          {/* Custom pages lists */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Dynamic Pages</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Page Title</th>
                    <th>Url Slug</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagesList.map(page => (
                    <tr key={page._id}>
                      <td className="font-semibold">{page.title}</td>
                      <td>/{page.slug}</td>
                      <td>
                        <span className={`badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setNewPage({
                                title: page.title,
                                content: page.content,
                                status: page.status,
                                seo: page.seo || { metaTitle: '', metaDescription: '', keywords: '' }
                              });
                              setEditingPageId(page._id);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6 }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeletePage(page._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6, color: 'var(--color-error)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSavePage} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="text-lg font-bold">{editingPageId ? 'Edit Page' : 'Create Custom Page'}</h3>
            <div className="form-group">
              <label className="form-label">Page Title</label>
              <input
                type="text"
                className="form-input"
                value={newPage.title}
                onChange={e => setNewPage({ ...newPage, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Page Content HTML/Markdown</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 200 }}
                value={newPage.content}
                onChange={e => setNewPage({ ...newPage, content: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={newPage.status}
                onChange={e => setNewPage({ ...newPage, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm btn-full">
                {editingPageId ? 'Save Edits' : 'Publish Page'}
              </button>
              {editingPageId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPageId(null);
                    setNewPage({ title: '', content: '', status: 'draft', seo: { metaTitle: '', metaDescription: '', keywords: '' } });
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* BLOGS & NEWS */}
      {/* ========================================== */}
      {activeTab === 'blogs' && (
        <div className="grid-layout-sidebar-right-340" style={{ gap: 24 }}>
          {/* Blogs list */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 16 }}>Articles Directory</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogsList.map(blog => (
                    <tr key={blog._id}>
                      <td className="font-semibold truncate" style={{ maxWidth: 160 }}>{blog.title}</td>
                      <td>{blog.category}</td>
                      <td>
                        <span className={`badge ${blog.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setNewBlog({
                                title: blog.title,
                                content: blog.content,
                                category: blog.category,
                                tags: blog.tags?.join(', ') || '',
                                status: blog.status,
                                seo: blog.seo || { metaTitle: '', metaDescription: '', keywords: '' }
                              });
                              setEditingBlogId(blog._id);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6 }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6, color: 'var(--color-error)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveBlog} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="text-lg font-bold">{editingBlogId ? 'Edit Article' : 'Publish Blog Post'}</h3>
            <div className="form-group">
              <label className="form-label">Article Title</label>
              <input
                type="text"
                className="form-input"
                value={newBlog.title}
                onChange={e => setNewBlog({ ...newBlog, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={newBlog.category}
                onChange={e => setNewBlog({ ...newBlog, category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="tech, guide, career"
                value={newBlog.tags}
                onChange={e => setNewBlog({ ...newBlog, tags: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content Body</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 200 }}
                value={newBlog.content}
                onChange={e => setNewBlog({ ...newBlog, content: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={newBlog.status}
                onChange={e => setNewBlog({ ...newBlog, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm btn-full">
                {editingBlogId ? 'Save Edits' : 'Publish Article'}
              </button>
              {editingBlogId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBlogId(null);
                    setNewBlog({ title: '', content: '', category: 'General', tags: '', status: 'draft', seo: { metaTitle: '', metaDescription: '', keywords: '' } });
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* MEDIA MANAGER */}
      {/* ========================================== */}
      {activeTab === 'media' && (
        <div className="flex flex-col gap-6">
          {/* Upload Tool */}
          <form onSubmit={handleUploadMedia} className="card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Choose file to upload</label>
              <input
                type="file"
                className="form-input"
                onChange={e => setUploadFile(e.target.files[0])}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 24 }}>
              Upload to Server
            </button>
          </form>

          {/* Grid list */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: 20 }}>Media Library catalog</h3>
            <div className="grid grid-4" style={{ gap: 20 }}>
              {mediaList.map(media => (
                <div key={media._id} className="card-glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
                  {media.mimetype?.startsWith('image') ? (
                    <img src={getAvatarUrl(media.url)} alt={media.filename} style={{ height: 140, width: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', fontSize: '2rem' }}>
                      📄
                    </div>
                  )}
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }} className="truncate" title={media.filename}>{media.filename}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }} className="truncate">{media.url}</div>
                    <button
                      onClick={() => handleDeleteMedia(media._id)}
                      className="btn btn-icon btn-ghost"
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: '50%', padding: 4 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SEO CONFIG */}
      {/* ========================================== */}
      {activeTab === 'seo' && seo && (
        <form onSubmit={handleUpdateSEO} className="card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 className="text-lg font-bold">Search Engine Index Optimization (SEO)</h3>
          <div className="form-group">
            <label className="form-label">Global Meta Title</label>
            <input
              type="text"
              className="form-input"
              value={seo.metaTitle}
              onChange={e => setSeo({ ...seo, metaTitle: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Global Meta Description</label>
            <textarea
              className="form-textarea"
              value={seo.metaDescription}
              onChange={e => setSeo({ ...seo, metaDescription: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Global Focus Keywords</label>
            <input
              type="text"
              className="form-input"
              value={seo.keywords}
              onChange={e => setSeo({ ...seo, keywords: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Robots.txt Specifications</label>
            <textarea
              className="form-textarea"
              style={{ fontFamily: 'var(--font-mono)', minHeight: 140 }}
              value={seo.robotsText}
              onChange={e => setSeo({ ...seo, robotsText: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary btn-sm align-self-start" style={{ gap: 6 }}>
            <Save size={14} /> Save Index Settings
          </button>
        </form>
      )}

      {/* ========================================== */}
      {/* GENERAL SETTINGS */}
      {/* ========================================== */}
      {activeTab === 'settings' && website && (
        <div className="flex flex-col gap-6">
          {/* Contact settings */}
          <form onSubmit={handleUpdateWebsite} className="card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 className="text-lg font-bold">Contact Information Settings</h3>
            <div className="grid grid-3" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Company Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={website.contactInfo?.email || ''}
                  onChange={e => setWebsite({ ...website, contactInfo: { ...website.contactInfo, email: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Corporate Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={website.contactInfo?.phone || ''}
                  onChange={e => setWebsite({ ...website, contactInfo: { ...website.contactInfo, phone: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Corporate Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={website.contactInfo?.address || ''}
                  onChange={e => setWebsite({ ...website, contactInfo: { ...website.contactInfo, address: e.target.value } })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2" style={{ padding: '8px 0' }}>
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={website.maintenanceMode}
                onChange={e => setWebsite({ ...website, maintenanceMode: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="maintenanceMode" style={{ fontWeight: 600 }}>Enable Maintenance Mode</label>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary btn-sm align-self-start">
              Save Contact Specifications
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
