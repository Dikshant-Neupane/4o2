import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const useAuth = () => {
  const { user, isLoggedIn, login: storeLogin, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AUTH] Hook initialized');
  }, []);

  const login = async (credentials) => {
    console.log('[AUTH] Login called');
    try {
      // Since backend is NOT RUNNING, using mock token
      const token = 'mock_jwt_token_12345';
      localStorage.setItem('token', token);
      
      const mockUser = {
        id: '1',
        name: 'Demo Person',
        email: 'demo@janasunuwaai.local'
      };
      
      storeLogin(mockUser);
      return true;
    } catch (error) {
      console.error('Login error', error);
      return false;
    }
  };

  const logout = () => {
    console.log('[AUTH] Logout called');
    localStorage.removeItem('token');
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
    logout,
    requireAuth,
  };
};

export default useAuth;
