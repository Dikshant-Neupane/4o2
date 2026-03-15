import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import ReportCard from '../ui/ReportCard';
import { staggerContainer, useReducedMotionSafe } from '../../lib/motion';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="h-48 skeleton-shimmer" />
    <div className="p-5 space-y-3">
      <div className="h-5 skeleton-shimmer rounded w-3/4" />
      <div className="h-4 skeleton-shimmer rounded w-1/2" />
      <div className="h-3 skeleton-shimmer rounded w-1/3" />
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <div className="h-4 skeleton-shimmer rounded w-16" />
        <div className="h-4 skeleton-shimmer rounded w-20" />
      </div>
    </div>
  </div>
);

const FeedList = ({ reports, loading, error, page, totalPages, onPageChange }) => {
  const prefersReduced = useReducedMotionSafe();

  if (loading) {
    console.log('[LIST] Rendering: loading skeletons');
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No reports found near you</h3>
        <p className="text-sm text-gray-500">Try adjusting your filters or increasing the distance.</p>
      </div>
    );
  }

  console.log('[LIST] Rendering:', reports.length);

  const handlePageChange = (newPage) => {
    console.log('[LIST] Page changed:', newPage);
    onPageChange(newPage);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={staggerContainer}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        {reports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {pageNumbers.map(num => (
            <motion.button
              key={num}
              onClick={() => handlePageChange(num)}
              className={`w-10 h-10 text-sm font-bold rounded-lg transition-colors ${
                num === page
                  ? 'bg-[#1B4FD8] text-white shadow-sm'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {num}
            </motion.button>
          ))}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedList;
