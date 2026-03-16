import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, MessageCircle, Calendar } from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';
import StatusBadge from '../ui/StatusBadge';

const ReportListItem = ({ report }) => {
  if (!report) return null;

  const imageUrl = report.images?.[0] || report.image || '/Waterleak.png';
  const severity = (report.ai_severity || 'medium').toUpperCase();
  const status = (report.status || 'submitted').toUpperCase().replace('-', '_');
  const address = report.location?.address || 'Kathmandu';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        <img src={imageUrl} alt={report.title} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Middle Content */}
      <div className="flex-grow min-w-0 space-y-1.5">
        <h4 className="font-bold text-[#111827] text-sm truncate">{report.title}</h4>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{address}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={severity} />
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{report.upvotes || report.likes || 0}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{report.comment_count || report.comments || 0}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex-shrink-0 flex items-center">
        <Link
          to={`/report/${report.id}`}
          className="text-xs font-semibold text-[#1B4FD8] hover:text-blue-800 whitespace-nowrap transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default ReportListItem;
