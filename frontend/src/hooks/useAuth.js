import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const useAuth = () => {
  const {
    user,
    isAuthenticated: isLoggedIn,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
  } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AUTH] Hook initialized');
  }, []);

  const login = async (credentials) => {
    console.log('[AUTH] Login called for:', credentials.email || credentials);
    try {
      const result = await storeLogin(
        credentials.email || credentials,
        credentials.password || ''
      );
      return result.success;
    } catch (error) {
      console.error('Login error', error);
      return false;
    }
  };

  const register = async (userData) => {
    console.log('[AUTH] Register called for:', userData.email);
    try {
      const result = await storeRegister(userData);
      return result.success;
    } catch (error) {
      console.error('Register error', error);
      return false;
    }
  };

  const logout = () => {
    console.log('[AUTH] Logout called');
    storeLogout();
    navigate('/');
  };

  const requireAuth = (callback) => {
    if (!isLoggedIn) {
      navigate('/login');
      return false;
    }
    if (callback) callback();
    return true;
  };

  return {
    user,
    isLoggedIn,
    login,
    register,
    logout,
    requireAuth,
  };
};

export default useAuth;
