import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FileText, ThumbsUp, Award, Settings, Bell, LogOut, ChevronDown,
  SlidersHorizontal, Flag, ShieldCheck, MessageSquare, Target,
  Flame, Users, Star, Zap
} from 'lucide-react';

import Footer from '../components/layout/Footer';
import ReportListItem from '../components/profile/ReportListItem';
import AchievementBadge from '../components/profile/AchievementBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { mockReports } from '../mocks/mockReports';
import { mockUser } from '../mocks/mockUser';
import {
  pageVariants, fadeUp, staggerContainer, cardVariants, scaleBounce,
  useCountUp, useReducedMotionSafe, viewportOnce, duration, easing, spring
} from '../lib/motion';

const ITEMS_PER_PAGE = 4;

const achievementsList = [
  { name: 'First Report', description: 'Submit your very first civic issue report', icon: Flag, bgColor: '#DBEAFE', iconColor: '#1D4ED8', borderColor: '#BFDBFE', earned: true },
  { name: 'Verified Reporter', description: 'Have 3 reports verified by the community', icon: ShieldCheck, bgColor: '#DCFCE7', iconColor: '#15803D', borderColor: '#86EFAC', earned: true },
  { name: 'Community Voice', description: 'Receive 50 total upvotes on your reports', icon: MessageSquare, bgColor: '#EDE9FE', iconColor: '#7C3AED', borderColor: '#DDD6FE', earned: true },
  { name: 'Pothole Hunter', description: 'Report 10 potholes in the Kathmandu Valley', icon: Target, bgColor: '#FFEDD5', iconColor: '#C2410C', borderColor: '#FED7AA', earned: true },
  { name: 'Local Hero', description: 'Have 5 reports resolved by authorities', icon: Star, bgColor: '#FEF9C3', iconColor: '#B45309', borderColor: '#FDE68A', earned: true },
  { name: 'Cluster Finder', description: 'Identify a cluster of 3+ nearby issues', icon: Users, bgColor: '#F3F4F6', iconColor: '#9CA3AF', borderColor: '#E5E7EB', earned: false },
  { name: '100 Votes', description: 'Cast 100 votes on community reports', icon: Flame, bgColor: '#F3F4F6', iconColor: '#9CA3AF', borderColor: '#E5E7EB', earned: false },
  { name: 'Super Citizen', description: 'Complete all achievements and become a Super Citizen', icon: Zap, bgColor: '#F3F4F6', iconColor: '#9CA3AF', borderColor: '#E5E7EB', earned: false },
];

// ─── Stat with Count-Up ───
const ProfileStat = ({ target, label, delay = 0 }) => {
  const [ref, value] = useCountUp(target);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <p className="text-lg font-bold text-[#1B4FD8]">{value}</p>
      <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider">{label}</p>
    </motion.div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const prefersReduced = useReducedMotionSafe();

  const [activeNav, setActiveNav] = useState('reports');
  const [activeTab, setActiveTab] = useState('all');
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');

  const currentUser = user || mockUser;
  const earnedCount = achievementsList.filter(a => a.earned).length;
  const totalCount = achievementsList.length;
  const progressPercent = ((earnedCount / totalCount) * 100).toFixed(1);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    console.log('[PROFILE] Mounted');
    console.log('[PROFILE] User:', currentUser.id);
    fetchUserReports();
  }, [isAuthenticated]);

  const fetchUserReports = () => {
    setLoading(true);
    setTimeout(() => {
      setUserReports(mockReports);
      setLoading(false);
      console.log('[PROFILE] Reports:', mockReports.length);
    }, 500);
  };

  const handleLogout = () => {
    console.log('[PROFILE] Logout clicked');
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  const handleTabChange = (tab) => {
    console.log('[PROFILE] Tab:', tab);
    setActiveTab(tab);
    setPage(1);
  };

  const filteredReports = userReports.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return r.status === 'submitted' || r.status === 'under-review' || r.status === 'in-progress';
    if (activeTab === 'verified') return r.verified || r.status === 'verified';
    if (activeTab === 'resolved') return r.status === 'resolved';
    return true;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'most_upvoted') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / ITEMS_PER_PAGE));
  const paginatedReports = sortedReports.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const tabCounts = {
    all: userReports.length,
    active: userReports.filter(r => r.status === 'submitted' || r.status === 'under-review' || r.status === 'in-progress').length,
    verified: userReports.filter(r => r.verified || r.status === 'verified').length,
    resolved: userReports.filter(r => r.status === 'resolved').length,
  };

  const totalVotes = userReports.reduce((sum, r) => sum + (r.upvotes || 0), 0);

  const navItems = [
    { id: 'reports', label: 'My Reports', icon: FileText, badge: userReports.length, badgeColor: 'bg-blue-100 text-[#1B4FD8]' },
    { id: 'votes', label: 'My Votes', icon: ThumbsUp, badge: totalVotes, badgeColor: 'bg-gray-100 text-gray-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount || 0, badgeColor: unreadCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null, badgeColor: '' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      <motion.main
        className="flex-grow py-8 sm:py-12"
        variants={pageVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ═══ LEFT SIDEBAR ═══ */}
            <motion.aside
              className="w-full lg:w-[280px] flex-shrink-0 space-y-6"
              initial={prefersReduced ? false : { x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: duration.normal, ease: easing.entrance }}
            >

              {/* Profile Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-4">
                {currentUser.avatar_url ? (
                  <motion.img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="mx-auto w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    variants={scaleBounce}
                    initial={prefersReduced ? false : 'hidden'}
                    animate="visible"
                  />
                ) : (
                  <motion.div
                    className="mx-auto w-20 h-20 rounded-full bg-[#1B4FD8] flex items-center justify-center text-white text-2xl font-extrabold uppercase"
                    variants={scaleBounce}
                    initial={prefersReduced ? false : 'hidden'}
                    animate="visible"
                  >
                    {currentUser.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </motion.div>
                )}
                <div>
                  <h2 className="font-bold text-lg text-gray-900">{currentUser.name}</h2>
                  <p className="text-sm text-gray-500">{currentUser.email || currentUser.phone || ''}</p>
                  <p className="text-xs text-gray-400 mt-1">Member since {new Date(currentUser.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <ProfileStat target={userReports.length} label="Reports" delay={0} />
                  <ProfileStat target={totalVotes} label="Votes" delay={0.2} />
                  <ProfileStat target={earnedCount} label="Badges" delay={0.4} />
                </div>

                <motion.button
                  className="w-full py-2.5 border-2 border-[#1B4FD8] text-[#1B4FD8] font-bold text-sm rounded-lg hover:bg-blue-50 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Edit Profile
                </motion.button>
              </div>

              {/* Nav Menu */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveNav(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#EFF6FF] text-[#1B4FD8] border-l-[3px] border-[#1B4FD8]'
                          : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </span>
                      {item.badge !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-colors border-l-[3px] border-transparent border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.aside>

            {/* ═══ RIGHT CONTENT ═══ */}
            <motion.div className="flex-grow min-w-0 space-y-8" variants={fadeUp}>

              {/* Tab Row */}
              <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto relative">
                {['all', 'active', 'verified', 'resolved'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                      activeTab === tab ? 'text-[#1B4FD8]' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabCounts[tab]})
                  </button>
                ))}
                {/* Active underline */}
                <motion.div
                  className="absolute bottom-0 h-0.5 bg-[#1B4FD8]"
                  animate={{
                    left: `${['all', 'active', 'verified', 'resolved'].indexOf(activeTab) * 25}%`,
                    width: '25%',
                  }}
                  transition={{ duration: duration.fast, ease: easing.smooth }}
                />
              </div>

              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">My Reports</h2>
                  <p className="text-sm text-gray-500">Showing {filteredReports.length} reports</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-[#1B4FD8] focus:border-[#1B4FD8]"
                  >
                    <option value="newest">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_upvoted">Most Votes</option>
                  </select>
                  <button className="p-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Report List */}
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
                      <div className="w-20 h-20 rounded-lg skeleton-shimmer flex-shrink-0" />
                      <div className="flex-grow space-y-2">
                        <div className="h-4 skeleton-shimmer rounded w-3/4" />
                        <div className="h-3 skeleton-shimmer rounded w-1/2" />
                        <div className="h-3 skeleton-shimmer rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedReports.length > 0 ? (
                <motion.div
                  className="space-y-4"
                  variants={staggerContainer}
                  initial={prefersReduced ? false : 'hidden'}
                  animate="visible"
                >
                  {paginatedReports.map(report => (
                    <motion.div key={report.id} variants={cardVariants}>
                      <ReportListItem report={report} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="text-center py-16"
                  initial={prefersReduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 text-lg">No reports yet.</h3>
                  <p className="text-sm text-gray-500 mt-1">Report your first issue!</p>
                </motion.div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <motion.button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 text-sm font-bold rounded-lg ${page === i + 1 ? 'bg-[#1B4FD8] text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`} whileTap={{ scale: 0.95 }}>{i + 1}</motion.button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                </div>
              )}

              {/* ═══ ACHIEVEMENTS SECTION ═══ */}
              <motion.div
                className="pt-8 border-t border-gray-200 space-y-6"
                variants={fadeUp}
                initial={prefersReduced ? false : 'hidden'}
                whileInView="visible"
                viewport={viewportOnce}
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Achievements</h2>
                  <p className="text-sm text-gray-500 mt-1">Earned through community participation</p>
                </div>

                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  variants={staggerContainer}
                  initial={prefersReduced ? false : 'hidden'}
                  whileInView="visible"
                  viewport={viewportOnce}
                >
                  {achievementsList.map((badge, i) => (
                    <motion.div
                      key={i}
                      variants={cardVariants}
                      whileHover={badge.earned && !prefersReduced ? { scale: 1.03, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } : (
                        !badge.earned && !prefersReduced ? { opacity: [0.6, 0.8, 0.6] } : {}
                      )}
                      transition={badge.earned ? spring.bounce : { duration: 1.5, repeat: Infinity }}
                    >
                      <AchievementBadge {...badge} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Progress Bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1B4FD8]">{earnedCount} of {totalCount} achievements unlocked</span>
                    <span className="text-sm text-gray-500">{progressPercent}% Complete</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-1.5">
                    <motion.div
                      className="bg-[#1B4FD8] h-1.5 rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: `${progressPercent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                  <p className="text-[13px] text-gray-500">Keep reporting to unlock more!</p>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
