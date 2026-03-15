import React from 'react';
import { motion } from 'framer-motion';
import { cardVariants, shakeAnimation, useReducedMotionSafe } from '../../lib/motion';

const CategoryCard = ({ id, label, icon: Icon, department, status, onSelect, onComingSoon }) => {
  const isActive = status === 'ACTIVE';
  const prefersReduced = useReducedMotionSafe();

  const handleClick = () => {
    if (isActive && onSelect) {
      onSelect(id);
    } else if (!isActive && onComingSoon) {
      onComingSoon(id);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      onClick={handleClick}
      whileHover={
        isActive && !prefersReduced
          ? { scale: 1.03, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: { type: 'spring', stiffness: 400, damping: 17 } }
          : undefined
      }
      whileTap={isActive && !prefersReduced ? { scale: 0.97 } : undefined}
      className={`relative p-6 rounded-xl border transition-colors duration-200 flex flex-col items-center text-center
        ${isActive 
          ? 'bg-[#EFF6FF] border-[#BFDBFE] cursor-pointer' 
          : 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed'
        }`}
    >
      <div className={`p-4 rounded-full mb-4 ${isActive ? 'bg-blue-100 text-[#1B4FD8]' : 'bg-gray-200 text-gray-500'}`}>
        {Icon ? <Icon className="w-8 h-8" /> : null}
      </div>
      
      <h3 className="font-bold text-gray-900 mb-2">{label}</h3>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">{department}</p>
      
      {isActive ? (
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200">
          ACTIVE
        </span>
      ) : (
        <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full">
          COMING SOON
        </span>
      )}
    </motion.div>
  );
};

export default CategoryCard;
