import { createContext, useContext, useState, useEffect } from 'react';
import { cmsService } from '../services/cmsService';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('fh_theme') || 'dark');
  const [themeConfig, setThemeConfig] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fh_theme', theme);
  }, [theme]);

  // Fetch remote theme configurations from CMS
  useEffect(() => {
    cmsService.getTheme()
      .then(res => {
        if (res.settings) {
          setThemeConfig(res.settings);
          if (res.settings.primaryColor) document.documentElement.style.setProperty('--color-primary', res.settings.primaryColor);
          if (res.settings.secondaryColor) document.documentElement.style.setProperty('--color-secondary', res.settings.secondaryColor);
          if (res.settings.accentColor) document.documentElement.style.setProperty('--color-accent', res.settings.accentColor);
          if (res.settings.fontFamily) document.documentElement.style.setProperty('--font-sans', `"${res.settings.fontFamily}", sans-serif`);
        }
      })
      .catch(err => console.error('Failed to load dynamic theme settings', err));
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
