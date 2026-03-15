import React from 'react';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase();

  let styles = 'bg-gray-100 text-gray-800 border focus:border-gray-200';
  
  switch(normalizedStatus) {
    case 'ACTIVE':
      styles = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case 'VERIFIED':
      styles = 'bg-indigo-100 text-indigo-800 border-indigo-200';
      break;
    case 'NEEDS_REVIEW':
      styles = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      break;
    case 'PENDING_AI':
      styles = 'bg-purple-100 text-purple-800 border-purple-200';
      break;
    case 'REJECTED':
      styles = 'bg-red-100 text-red-800 border-red-200';
      break;
    case 'RESOLVED':
      styles = 'bg-green-100 text-green-800 border-green-200';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
      {status?.replace(/_/g, ' ') || 'UNKNOWN'}
    </span>
  );
};

export default StatusBadge;
