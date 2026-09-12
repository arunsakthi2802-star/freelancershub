import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('fh_token');
      if (token) {
        try {
          const { user } = await authService.getMe();
          dispatch({ type: 'SET_USER', payload: { user, token } });
        } catch {
          localStorage.removeItem('fh_token');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    const { isAdmin, ...creds } = credentials;
    let response;
    if (isAdmin) {
      response = await authService.adminLogin(creds);
    } else {
      response = await authService.login(creds);
    }
    const { user, token } = response;
    localStorage.setItem('fh_token', token);
    dispatch({ type: 'SET_USER', payload: { user, token } });
    return { user, token };
  }, []);

  const register = useCallback(async (data) => {
    const { user, token } = await authService.register(data);
    localStorage.setItem('fh_token', token);
    dispatch({ type: 'SET_USER', payload: { user, token } });
    return { user, token };
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('fh_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
