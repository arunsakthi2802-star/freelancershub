import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cmsService } from '../../services/cmsService';

export default function SEOUpdater() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only apply global SEO defaults on the root or standard pages if not explicitly overridden by the page itself
    if (pathname !== '/' && !pathname.startsWith('/p/')) return;

    cmsService.getSEO()
      .then(res => {
        const seo = res.settings;
        if (seo) {
          if (seo.metaTitle) document.title = seo.metaTitle;
          if (seo.metaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.name = 'description';
              document.head.appendChild(metaDesc);
            }
            metaDesc.content = seo.metaDescription;
          }
          if (seo.keywords) {
            let metaKey = document.querySelector('meta[name="keywords"]');
            if (!metaKey) {
              metaKey = document.createElement('meta');
              metaKey.name = 'keywords';
              document.head.appendChild(metaKey);
            }
            metaKey.content = seo.keywords;
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}
