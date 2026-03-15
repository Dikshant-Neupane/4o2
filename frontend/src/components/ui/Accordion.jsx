import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const Accordion = ({ children, className = '' }) => {
  return <div className={`w-full divide-y divide-gray-200 border-b border-gray-200 ${className}`}>{children}</div>;
};

export const AccordionItem = ({ value, title, children, activeValue, onToggle }) => {
  const isOpen = activeValue === value;

  return (
    <div className="border-b border-gray-200 last:border-0 hover:bg-gray-50/50 transition-colors">
      <button
        onClick={() => onToggle(isOpen ? null : value)}
        className="flex w-full items-center justify-between py-5 text-left font-medium text-gray-900 transition-all hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 pt-0 px-1 text-gray-600 text-sm leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
