import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, Mail, Lock, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';


import useAuthStore from '../store/authStore';
import {
  useReducedMotionSafe, spring
} from '../lib/motion';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isHydrated, login, register, isLoading, error, clearError } = useAuthStore();
  const prefersReduced = useReducedMotionSafe();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isHydrated, navigate, from]);

  // Clear errors when switching modes
  useEffect(() => {
    setLocalError('');
    clearError();
  }, [isRegisterMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (isRegisterMode && !name.trim()) {
      setLocalError('Please enter your name.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    let result;
    if (isRegisterMode) {
      result = await register(name, email, password);
    } else {
      result = await login(email, password);
    }

    if (result.success) {
      toast.success(isRegisterMode ? `Welcome, ${result.user.name}!` : `Welcome back, ${result.user.name}!`);
    } else {
      setLocalError(result.error);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#16A34A] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-[#1B4FD8] rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ...spring.default }}
      >
        <div className="text-center mb-8">
          <img
            src="/pictures/logofolder/logo.png"
            alt="Jana Sunuwaai"
            className="h-24 mx-auto mb-6 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CivicEye</h1>
          <p className="text-gray-500 text-sm">Empowering citizens through transparency.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1B4FD8]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {isRegisterMode ? 'Create Account' : 'Sign In'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isRegisterMode
                    ? 'Join the community and start reporting issues.'
                    : 'Sign in with your email and password.'}
                </p>
              </div>
            </div>

            {/* Toggle Login/Register */}
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isRegisterMode
                    ? 'bg-white text-[#1B4FD8] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isRegisterMode
                    ? 'bg-white text-[#1B4FD8] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (Register only) */}
              <AnimatePresence>
                {isRegisterMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1B4FD8]/20 focus:border-[#1B4FD8] outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1B4FD8]/20 focus:border-[#1B4FD8] outline-none transition-all"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1B4FD8]/20 focus:border-[#1B4FD8] outline-none transition-all"
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-xl text-center"
                  >
                    <p className="text-xs text-red-600 font-medium">
                      {typeof displayError === 'string'
                        ? displayError
                        : displayError?.message || displayError?.msg || JSON.stringify(displayError)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1B4FD8] text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRegisterMode ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {isRegisterMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isRegisterMode ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8 px-6">
          By signing in, you agree to our Terms of Service and Privacy Policy. CivicEye is a community platform.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
