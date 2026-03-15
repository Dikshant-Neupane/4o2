import React from 'react';

const SeverityBadge = ({ severity }) => {
  const normalized = severity?.toUpperCase();
  
  let bgClass = '';
  let textClass = '';
  let borderClass = '';

  switch (normalized) {
    case 'CRITICAL':
      // example distinct bold color
      bgClass = 'bg-red-100'; textClass = 'text-red-800'; borderClass = 'border-red-200';
      break;
    case 'HIGH':
      bgClass = 'bg-orange-100'; textClass = 'text-orange-800'; borderClass = 'border-orange-200';
      break;
    case 'MEDIUM':
      bgClass = 'bg-yellow-100'; textClass = 'text-yellow-800'; borderClass = 'border-yellow-200';
      break;
    case 'LOW':
      bgClass = 'bg-green-100'; textClass = 'text-green-800'; borderClass = 'border-green-200';
      break;
    default:
      bgClass = 'bg-gray-100'; textClass = 'text-gray-800'; borderClass = 'border-gray-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass} ${textClass} ${borderClass}`}>
      {normalized || 'UNKNOWN'}
    </span>
  );
};

export default SeverityBadge;
