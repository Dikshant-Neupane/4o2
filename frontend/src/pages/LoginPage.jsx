import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../pictures/logofolder/logo.png";

import useAuthStore from '../store/authStore';
import {
  buttonSpring, shineClasses, useReducedMotionSafe, duration, easing, spring
} from '../lib/motion';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register, isLoading, error, clearError } = useAuthStore();
  const prefersReduced = useReducedMotionSafe();

  const [activeTab, setActiveTab] = useState('login');

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [shakeError, setShakeError] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
    setConfirmError('');
  }, [activeTab, clearError]);

  // Trigger shake when error appears
  useEffect(() => {
    if (error) {
      setShakeError(true);
      const t = setTimeout(() => setShakeError(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('[AUTH] Login attempt:', loginPhone);
    const result = await login(loginPhone, loginPassword);
    if (result.success) { console.log('[AUTH] ✅ Login success'); toast.success('Welcome back!'); navigate(from, { replace: true }); }
    else { console.error('[AUTH] ❌ Login failed:', result.error); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setConfirmError('');
    if (regPassword !== regConfirm) { setConfirmError('Passwords do not match'); return; }

    console.log('[AUTH] Register:', regName);
    const result = await register({ name: regName, phone: regPhone, password: regPassword });
    if (result.success) { console.log('[AUTH] ✅ Register success'); toast.success('Account created!'); navigate('/', { replace: true }); }
    else { console.error('[AUTH] ❌ Register failed:', result.error); }
  };

  const inputFocusClasses = 'focus:ring-2 focus:ring-[#1B4FD8]/15 focus:border-[#1B4FD8] transition-all';

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ...spring.default }}
      >

            <img
              src={logo}
              alt="Jana Sunuwaai"
              style={{
                height: "180px",
                width: "auto",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
                paddingBottom: "30px"
              }}
            />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-200 relative">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${
                activeTab === 'login' ? 'text-[#1B4FD8]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${
                activeTab === 'register' ? 'text-[#1B4FD8]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
            {/* Animated underline */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-[#1B4FD8]"
              animate={{
                left: activeTab === 'login' ? '0%' : '50%',
                width: '50%',
              }}
              transition={{ duration: duration.normal, ease: easing.smooth }}
            />
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">

              {/* ═══ LOGIN TAB ═══ */}
              {activeTab === 'login' && (
                <motion.form
                  key="login"
                  onSubmit={handleLogin}
                  className="space-y-5"
                  initial={prefersReduced ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: duration.fast }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="+977 98XXXXXXXX" required
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-sm ${inputFocusClasses}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <input
                        type="password" value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" required
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-sm ${inputFocusClasses}`}
                      />
                    <div className="text-right mt-1.5">
                      <button type="button" className="text-xs font-semibold text-[#1B4FD8] hover:text-blue-800">
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      className="text-sm text-[#DC2626]"
                      animate={shakeError && !prefersReduced ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit" disabled={isLoading}
                    className={`w-full py-3.5 bg-[#1B4FD8] text-white font-bold rounded-xl hover:bg-blue-800 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2 shadow-sm ${shineClasses}`}
                    variants={buttonSpring} initial="rest" whileHover="hover" whileTap="tap"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Logging in...</> : 'Login to My Account'}
                  </motion.button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span></div>
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button type="button" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" whileTap={{ scale: 0.97 }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google
                    </motion.button>
                    <motion.button type="button" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" whileTap={{ scale: 0.97 }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                      Apple
                    </motion.button>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    New to Jana Sunuwaai?{' '}
                    <button type="button" onClick={() => setActiveTab('register')} className="font-semibold text-[#1B4FD8] hover:text-blue-800">
                      Create an account
                    </button>
                  </p>
                </motion.form>
              )}

              {/* ═══ REGISTER TAB ═══ */}
              {activeTab === 'register' && (
                <motion.form
                  key="register"
                  onSubmit={handleRegister}
                  className="space-y-5"
                  initial={prefersReduced ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: duration.fast }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ram Maharjan" required className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-sm ${inputFocusClasses}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+977 98XXXXXXXX" required className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-sm ${inputFocusClasses}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <input type="password" value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)} placeholder="Create a password" required
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-sm ${inputFocusClasses}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <input type="password" value={regConfirm}
                      onChange={(e) => {
                        setRegConfirm(e.target.value);
                        if (e.target.value && e.target.value !== regPassword) setConfirmError('Passwords do not match');
                        else setConfirmError('');
                      }}
                      placeholder="Confirm your password" required
                      className={`w-full px-4 py-3 border rounded-xl text-sm ${inputFocusClasses} ${confirmError ? 'border-[#DC2626]' : 'border-gray-300'}`}
                    />
                    {confirmError && <p className="text-xs text-[#DC2626] mt-1.5">{confirmError}</p>}
                  </div>

                  {error && (
                    <motion.p className="text-sm text-[#DC2626]"
                      animate={shakeError && !prefersReduced ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button type="submit" disabled={isLoading || !!confirmError}
                    className={`w-full py-3.5 bg-[#1B4FD8] text-white font-bold rounded-xl hover:bg-blue-800 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2 shadow-sm ${shineClasses}`}
                    variants={buttonSpring} initial="rest" whileHover="hover" whileTap="tap"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : 'Create Account'}
                  </motion.button>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setActiveTab('login')} className="font-semibold text-[#1B4FD8] hover:text-blue-800">
                      Login
                    </button>
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default LoginPage;
