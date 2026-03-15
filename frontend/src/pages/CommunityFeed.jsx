import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { List, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Footer from '../components/layout/Footer';
import FeedFilters from '../components/feed/FeedFilters';
import FeedList from '../components/feed/FeedList';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useGPS from '../hooks/useGPS';
import { reports as reportsApi } from '../services/api';
import { mockReports } from '../mocks/mockReports';
import {
  pageVariants, fadeUp, slideFromLeft,
  useReducedMotionSafe, viewportOnce, duration, easing
} from '../lib/motion';

const FeedMap = lazy(() => import('../components/feed/FeedMap'));

const ITEMS_PER_PAGE = 6;

const defaultFilters = {
  category: '', severity: '', statuses: [], distance: 5000, sortBy: 'newest',
};

const CommunityFeed = () => {
  const { coords } = useGPS();
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState(defaultFilters);
  const [allReports, setAllReports] = useState([]);
  const [displayedReports, setDisplayedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const prefersReduced = useReducedMotionSafe();

  const userCoords = coords || { lat: 27.7172, lng: 85.3240 };

  useEffect(() => {
    console.log('[FEED] Mounted');
    console.log('[FEED] Location:', userCoords);
    fetchReports(filters);
  }, []);

  const fetchReports = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    const params = {
      lat: userCoords.lat, lng: userCoords.lng,
      category: currentFilters.category || undefined,
      severity: currentFilters.severity || undefined,
      distance: currentFilters.distance || undefined,
      sortBy: currentFilters.sortBy || 'newest',
    };
    console.log('[FEED] Fetching:', params);

    try {
      const res = await reportsApi.getNearby(params);
      if (res.data && res.data.length > 0) applyLocalFilters(res.data, currentFilters);
      else applyLocalFilters(mockReports, currentFilters);
    } catch (err) {
      applyLocalFilters(mockReports, currentFilters);
    }
  }, [userCoords]);

  const applyLocalFilters = (data, currentFilters) => {
    let filtered = [...data];
    if (currentFilters.category) filtered = filtered.filter(r => r.category === currentFilters.category);
    if (currentFilters.severity) filtered = filtered.filter(r => (r.ai_severity || '').toLowerCase() === currentFilters.severity.toLowerCase());
    if (currentFilters.statuses && currentFilters.statuses.length > 0) filtered = filtered.filter(r => currentFilters.statuses.includes(r.status));
    if (currentFilters.sortBy === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (currentFilters.sortBy === 'priority') filtered.sort((a, b) => (b.ai_priority_score || 0) - (a.ai_priority_score || 0));
    else if (currentFilters.sortBy === 'most_upvoted') filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

    setAllReports(filtered);
    const pages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setTotalPages(pages);
    setPage(1);
    paginateReports(filtered, 1);
    setLoading(false);
    console.log('[FEED] Loaded:', filtered.length);
  };

  const paginateReports = (data, currentPage) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    setDisplayedReports(data.slice(start, start + ITEMS_PER_PAGE));
  };

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const handleFilterApply = (appliedFilters) => {
    console.log('[FEED] Filter applied:', appliedFilters);
    setPage(1);
    fetchReports(appliedFilters);
  };

  const handleFilterClear = () => { setFilters(defaultFilters); setPage(1); fetchReports(defaultFilters); };

  const handlePageChange = (newPage) => {
    console.log('[FEED] Page:', newPage);
    setPage(newPage);
    paginateReports(allReports, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (newView) => {
    console.log('[FEED] View:', newView);
    setView(newView);
  };

  return (
    <div className="flex flex-col bg-gray-50 h-full">

      <motion.main
        className="flex-grow"
        variants={pageVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* TOP BAR */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
            variants={fadeUp}
          >
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Community Feed</h1>
              <p className="mt-1 text-gray-500">
                {allReports.length} report{allReports.length !== 1 ? 's' : ''} found near you
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <motion.button
                onClick={() => handleViewChange('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-[#1B4FD8] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <List className="w-4 h-4" /> List
              </motion.button>
              <motion.button
                onClick={() => handleViewChange('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'map' ? 'bg-[#1B4FD8] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <MapIcon className="w-4 h-4" /> Map
              </motion.button>
            </div>
          </motion.div>

          {/* Mobile/Tablet Filter Chips */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
            {['All', 'road_damage', 'electrical', 'water_sanitation', 'waste_management', 'public_space'].map(cat => {
              const labels = {
                '': 'All', 'road_damage': 'Potholes', 'electrical': 'Street Lights',
                'water_sanitation': 'Water', 'waste_management': 'Waste', 'public_space': 'Public Spaces'
              };
              const isActive = (filters.category || '') === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleFilterChange({ ...filters, category: cat })}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#1B4FD8] text-white border border-[#1B4FD8]'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-[#1B4FD8] hover:text-[#1B4FD8]'
                  }`}
                >
                  {labels[cat] || cat}
                </button>
              );
            })}
          </div>

          {/* LAYOUT: Sidebar + Content */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar (Desktop Only) */}
            <motion.aside
              className="hidden lg:block w-[260px] flex-shrink-0"
              variants={slideFromLeft}
            >
              <FeedFilters
                filters={filters}
                onChange={handleFilterChange}
                onApply={handleFilterApply}
                onClear={handleFilterClear}
              />
            </motion.aside>

            {/* Main Content */}
            <div className="flex-grow min-w-0">
              <AnimatePresence mode="wait">
                {view === 'list' ? (
                  <motion.div
                    key="list-view"
                    initial={prefersReduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.fast }}
                  >
                    <FeedList
                      reports={displayedReports}
                      loading={loading}
                      error={error}
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="map-view"
                    initial={prefersReduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.fast }}
                  >
                    <Suspense fallback={<LoadingSpinner size="lg" />}>
                      <FeedMap
                        reports={allReports}
                        center={[userCoords.lat, userCoords.lng]}
                      />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default CommunityFeed;
