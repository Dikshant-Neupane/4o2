import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const TubelightNavbar = ({ items, isMobile }) => {
  const [activeTab, setActiveTab] = useState(items[0].name);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Auto-detect active tab based on React Router location
    const currentPath = location.pathname;
    const activeItem = items.find(item => {
      if (item.url === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(item.url);
    });
    
    if (activeItem) {
      setActiveTab(activeItem.name);
    }
  }, [location, items]);

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-1 py-1 transition-all duration-300 ${
        scrolled ? 'bg-white/95 shadow-md' : 'bg-white/80 shadow-sm'
      } backdrop-blur-md border border-[#E5E7EB]`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.name;

        return (
          <Link
            key={item.name}
            to={item.url}
            onClick={() => setActiveTab(item.name)}
            className={`relative cursor-pointer transition-colors flex items-center justify-center rounded-full ${
              isActive
                ? 'bg-[#EFF6FF] text-[#1B4FD8] font-semibold'
                : 'text-[#6B7280] hover:text-[#1B4FD8]'
            } ${isMobile ? 'p-3' : 'px-5 py-2'}`}
            title={isMobile ? item.name : undefined}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Icon className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
              {!isMobile && <span>{item.name}</span>}
            </span>

            {isActive && (
              <motion.div
                layoutId="lamp"
                className="absolute inset-x-0 -top-1 flex flex-col items-center justify-center z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="absolute top-0 w-8 h-1 bg-[#1B4FD8] rounded-t-full" />
                <div className="absolute top-1 w-12 h-6 bg-[#1B4FD8]/20 rounded-full blur-md" />
                <div className="absolute top-1 w-8 h-6 bg-[#1B4FD8]/20 rounded-full blur-md" />
                <div className="absolute top-2 w-4 h-4 bg-[#1B4FD8]/20 rounded-full blur-sm" />
              </motion.div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default TubelightNavbar;
