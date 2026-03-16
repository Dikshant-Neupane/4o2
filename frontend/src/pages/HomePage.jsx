import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

import Footer from '../components/layout/Footer';
import CategoryCard from '../components/ui/CategoryCard';
import ReportCard from '../components/ui/ReportCard';
import { reports, departments } from '../services/api';

import { mockCategories } from '../mocks/mockCategories';
import { mockReports } from '../mocks/mockReports';
import {
  pageVariants, staggerContainer, fadeUp, buttonSpring,
  letterVariants, cardVariants, shineClasses,
  useCountUp, useReducedMotionSafe, viewportOnce, duration, easing
} from '../lib/motion';

// ─── Kinetic Text Component ───
const KineticText = ({ text, className, delay = 0 }) => {
  const prefersReduced = useReducedMotionSafe();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={letterVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: delay + i * 0.04 }}
          className="inline-block"
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// ─── Stat Card Component with Count-Up ───
const StatCard = ({ target, label, color }) => {
  const [ref, value] = useCountUp(target);
  return (
    <div ref={ref}>
      <div className={`text-3xl font-extrabold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [stats] = useState({ total: 1240, resolved: 856, active: 384 });
  const prefersReduced = useReducedMotionSafe();

  useEffect(() => {
    console.log('[HOME] Page mounted');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('[HOME] Fetching categories...');
      let fetchedCategories = mockCategories;
      try {
        const res = await departments.getAll();
        if (res.data && res.data.length > 0) fetchedCategories = res.data;
      } catch (e) { /* Use mock */ }
      
      const formattedCategories = fetchedCategories.map((cat, index) => ({
        ...cat,
        id: String(cat.id),
        category_id: String(cat.category_id || cat.id),
        status: index < 3 ? 'ACTIVE' : 'COMING_SOON',
        IconComponent: LucideIcons[cat.icon] || LucideIcons.HelpCircle
      }));
      setCategories(formattedCategories);
      console.log('[HOME] Categories:', formattedCategories.length);

      console.log('[HOME] Fetching feed preview...');
      let fetchedReports = mockReports.slice(0, 3);
      try {
        const res = await reports.getNearby({ lat: 27.7172, lng: 85.3240, limit: 3 });
        if (res.data && res.data.length > 0) fetchedReports = res.data.slice(0, 3);
      } catch (e) { /* Use mock */ }
      setRecentReports(fetchedReports);
      console.log('[HOME] Feed loaded:', fetchedReports.length);
    } catch (error) {
      console.error('[HOME] Error fetching data:', error);
    }
  };

  const handleCategorySelect = (categoryId) => {
    navigate('/report', { state: { category_id: categoryId } });
  };

  const handleComingSoon = () => {
    toast('Coming soon!', { icon: '🚧' });
  };

  const handleCTAClick = (buttonName) => {
    console.log('[HOME] CTA clicked:', buttonName);
    if (buttonName === 'report') navigate('/report');
    else navigate('/feed');
  };

  return (
    <>
      <motion.main
        className="flex-grow"
        variants={pageVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        {/* ═══ HERO SECTION ═══ */}
        <section className="bg-[#F8F9FC]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
              <motion.div className="lg:col-span-6 space-y-8" variants={fadeUp}>
                <div>
                  <motion.span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#1B4FD8] uppercase tracking-wider mb-6"
                    initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: duration.normal }}
                  >
                    Kathmandu Valley
                  </motion.span>
                  <h1
                    style={{
                      fontSize: "clamp(32px, 4vw, 56px)",
                      fontWeight: 800,
                      lineHeight: 1.15,
                      whiteSpace: "normal",
                      wordBreak: "keep-all",
                      maxWidth: "600px",
                      color: "#111827",
                      marginBottom: "16px",
                      letterSpacing: "-0.025em"
                    }}
                  >
                    <KineticText text="Report civic issues." />
                    <br />
                    <KineticText text="Make your city" delay={0.8} />
                    <br />
                    <KineticText text="better." delay={1.4} />
                  </h1>
                  <motion.p
                    className="text-sm md:text-base text-[#6B7280] max-w-lg leading-relaxed"
                    initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: duration.slow, ease: easing.entrance }}
                  >
                    Join thousands of citizens improving our community. Snap a photo, share the location, and our AI will route it to the right department instantly.
                  </motion.p>
                </div>
                
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: duration.slow, ease: easing.entrance }}
                >
                  <motion.button
                    onClick={() => handleCTAClick('report')}
                    className={`inline-flex justify-center items-center px-8 py-4 border border-transparent text-base font-bold rounded-lg shadow-sm text-white bg-[#F97316] hover:bg-orange-600 transition-colors ${shineClasses}`}
                    variants={buttonSpring}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Report a Pothole
                  </motion.button>
                  <motion.button
                    onClick={() => handleCTAClick('feed')}
                    className={`inline-flex justify-center items-center px-8 py-4 border-2 border-[#1B4FD8] text-base font-bold rounded-lg text-[#1B4FD8] bg-white hover:bg-blue-50 transition-colors ${shineClasses}`}
                    variants={buttonSpring}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    View Community Feed
                  </motion.button>
                </motion.div>
                
                {/* Stats Row with Glass + Count-Up */}
                <motion.div
                  className="pt-8 border-t border-gray-100 flex items-center justify-between max-w-md"
                  initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: duration.slow }}
                >
                  <StatCard target={stats.total} label="Total Reports" color="text-gray-900" />
                  <StatCard target={stats.resolved} label="Resolved" color="text-[#1B4FD8]" />
                  <StatCard target={stats.active} label="Active" color="text-[#F97316]" />
                </motion.div>
              </motion.div>
              
              <motion.div
                className="lg:col-span-6 mt-12 lg:mt-0 relative"
                initial={prefersReduced ? false : { opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: easing.entrance }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-w-4 aspect-h-3 lg:aspect-auto lg:h-[600px]">
                  <img
                    src="/pictures/hompagepic/Nyatapola-temple.jpg.webp"
                    alt="Kathmandu Temple Hero"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 border-4 border-white/20 rounded-2xl pointer-events-none"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ CATEGORY SECTION ═══ */}
        <motion.section
          className="py-12 sm:py-16 lg:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={fadeUp}
          initial={prefersReduced ? false : 'hidden'}
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">What would you like to report?</h2>
            <p className="mt-4 text-sm md:text-base text-gray-500 max-w-2xl mx-auto">Select a category below to start your report. Our AI will automatically categorize the sub-issue based on your photo.</p>
          </div>
          
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
            variants={staggerContainer}
            initial={prefersReduced ? false : 'hidden'}
            whileInView="visible"
            viewport={viewportOnce}
          >
            {categories.slice(0, 5).map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                label={category.label}
                icon={category.IconComponent}
                department={String(category.category_id || category.id).replace('_', ' ')}
                status={category.status}
                onSelect={handleCategorySelect}
                onComingSoon={handleComingSoon}
              />
            ))}
          </motion.div>
        </motion.section>

        {/* ═══ HOW IT WORKS SECTION ═══ */}
        <motion.section
          className="bg-[#F8F9FC] py-12 sm:py-16 lg:py-20 border-y border-gray-200"
          variants={fadeUp}
          initial={prefersReduced ? false : 'hidden'}
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">How it works</h2>
              <p className="mt-4 text-sm md:text-base text-gray-500 max-w-2xl mx-auto">Four simple steps to make your community better. It takes less than 60 seconds.</p>
            </div>
            
            <div className="relative">
              {/* Desktop connecting line */}
              <motion.div
                className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-200 border-t-2 border-dashed border-gray-200 -z-0"
                initial={prefersReduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 0.8, ease: easing.smooth }}
                style={{ transformOrigin: 'left' }}
              />
              
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10"
                variants={staggerContainer}
                initial={prefersReduced ? false : 'hidden'}
                whileInView="visible"
                viewport={viewportOnce}
              >
                {[
                  { step: '1', title: 'Choose Category', desc: 'Select what type of issue you are reporting.', icon: LucideIcons.List },
                  { step: '2', title: 'Take a Photo', desc: 'Snap a clear picture of the problem.', icon: LucideIcons.Camera },
                  { step: '3', title: 'Share GPS Location', desc: 'Pinpoint exactly where it is on the map.', icon: LucideIcons.MapPin },
                  { step: '4', title: 'Submit & Relax', desc: 'Our AI analyzes and routes it instantly.', icon: LucideIcons.Send }
                ].map((item, i) => (
                  <motion.div key={i} className="flex flex-col items-center text-center" variants={fadeUp}>
                    <motion.div
                      className="w-24 h-24 rounded-full bg-white border-4 border-[#1B4FD8] flex items-center justify-center mb-6 shadow-sm relative"
                      whileHover={prefersReduced ? {} : { scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-sm border-2 border-white">
                        {item.step}
                      </span>
                      <item.icon className="w-10 h-10 text-[#1B4FD8]" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ═══ FEED PREVIEW SECTION ═══ */}
        <motion.section
          className="py-12 sm:py-16 lg:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={fadeUp}
          initial={prefersReduced ? false : 'hidden'}
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="flex justify-between items-end mb-10 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Recent reports near you</h2>
              <p className="mt-2 text-sm md:text-base text-gray-500">See what others are reporting in your area.</p>
            </div>
            <button 
              onClick={() => handleCTAClick('feed')}
              className="hidden sm:inline-flex items-center text-[#1B4FD8] font-semibold hover:text-blue-800 transition-colors group"
            >
              See all reports 
              <LucideIcons.ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial={prefersReduced ? false : 'hidden'}
            whileInView="visible"
            viewport={viewportOnce}
          >
            {recentReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </motion.div>
          
          <div className="mt-10 sm:hidden flex justify-center">
            <button 
              onClick={() => handleCTAClick('feed')}
              className="inline-flex items-center text-[#1B4FD8] font-semibold hover:text-blue-800 transition-colors"
            >
              See all reports <LucideIcons.ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </motion.section>
      </motion.main>

      <Footer />
    </>
  );
};

export default HomePage;
