import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cmsService } from '../services/cmsService';
import DOMPurify from 'dompurify';

export default function CustomPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cmsService.getPageBySlug(slug)
      .then(res => {
        setPage(res.page);
        if (res.page.seo?.metaTitle) document.title = res.page.seo.metaTitle;
      })
      .catch(() => {
        // Redirect to 404 if not found
        navigate('/404', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner-lg spinner-primary" />
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: 900 }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 40, lineHeight: 1.1 }}>
        {page.title}
      </h1>
      
      {/* 
        We use DOMPurify to safely inject raw HTML/markdown fetched from the CMS editor.
        In a real app with markdown, you'd parse markdown to HTML first.
      */}
      <div 
        className="prose"
        style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }} 
      />
    </div>
  );
}
