import { API_BASE } from './constants';

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getAvatarUrl = (avatar, name = '?') => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = avatar.startsWith('/') ? avatar : `/${avatar}`;
  return `${base}${path}`;
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const truncate = (text, length = 120) => {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
};

export const getRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

export const renderStars = (rating, max = 5) => {
  return Array.from({ length: max }, (_, i) => (i < Math.round(rating) ? '★' : '☆'));
};

export const getBudgetLabel = (budget) => {
  if (!budget) return 'N/A';
  const type = budget.type === 'hourly' ? '/hr' : ' fixed';
  if (budget.max) return `$${budget.min.toLocaleString()} – $${budget.max.toLocaleString()}${type}`;
  return `$${budget.min.toLocaleString()}${type}`;
};

export const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const paginate = (items, page, limit) => {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePassword = (p) => p.length >= 6;
export const validateUrl = (url) => { try { new URL(url); return true; } catch { return false; } };
