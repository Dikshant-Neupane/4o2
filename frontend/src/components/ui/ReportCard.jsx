import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, MessageCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SeverityBadge from './SeverityBadge';
import { cardVariants, useReducedMotionSafe } from '../../lib/motion';

const ReportCard = ({ report }) => {
  const prefersReduced = useReducedMotionSafe();

  const handleClick = () => {
    console.log('[CARD] Clicked:', report?.id);
  };

  if (!report) return null;

  const imageUrl = report.images?.[0] || report.image || 'https://via.placeholder.com/400x300?text=No+Image';
  let locationText = 'Unknown location';
  if (report.location) {
    if (typeof report.location === 'string') {
      locationText = report.location;
    } else if (typeof report.location === 'object') {
      locationText = report.location.address || report.location.ward || 'Unknown location';
      if (typeof locationText !== 'string' && typeof locationText !== 'number') {
        locationText = String(locationText);
      }
    }
  }
  const severity = report.ai_severity || report.severity || 'medium';
  const department = report.ai_department || report.department || 'General';
  const likeCount = report.upvotes || report.likes || 0;
  const commentCount = report.comment_count || report.comments || 0;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={prefersReduced ? {} : { y: -4, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: { duration: 0.2 } }}
      whileTap={prefersReduced ? {} : { scale: 0.97 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        <motion.img
          src={imageUrl}
          alt={report.title}
          loading="lazy"
          className="w-full h-full object-cover"
          whileHover={prefersReduced ? {} : { scale: 1.02 }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <SeverityBadge severity={severity} />
          {report.verified && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm gap-1 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{report.title}</h3>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1 truncate">{locationText}</span>
          {report.distance && (
            <span className="ml-2 flex-shrink-0 text-gray-400 text-xs">
              • {report.distance}
            </span>
          )}
        </div>
        
        <div className="mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-md">
            {department}
          </span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center text-gray-500 text-sm hover:text-blue-600 transition-colors">
              <ThumbsUp className="w-4 h-4 mr-1.5" />
              <span className="font-medium">{likeCount}</span>
            </div>
            <div className="flex items-center text-gray-500 text-sm hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <span className="font-medium">{commentCount}</span>
            </div>
          </div>
          
          <Link
            to={`/report/${report.id}`}
            className="text-sm font-semibold text-[#1B4FD8] hover:text-blue-800 transition-colors inline-flex items-center gap-1 group"
            onClick={(e) => e.stopPropagation()}
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportCard;
