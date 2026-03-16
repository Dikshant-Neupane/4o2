import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Compass, X, MapPin as MapPinIcon, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockReports } from '../mocks/mockReports';
import SeverityBadge from '../components/ui/SeverityBadge';
import { useResponsive } from '../hooks/useResponsive';
import 'leaflet/dist/leaflet.css';

const severityColorMap = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
};

const MapPage = () => {
  const [filter, setFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const { isMobile } = useResponsive();

  // Reset selected report on filter change
  useEffect(() => {
    setSelectedReport(null);
  }, [filter]);

  const filteredReports = mockReports.filter(report => {
    if (filter === 'All') return true;
    return (report.ai_severity || report.severity || 'medium').toLowerCase() === filter.toLowerCase();
  });

  const handleMarkerClick = (report) => {
    setSelectedReport(report);
  };

  const closePanel = () => {
    setSelectedReport(null);
  };

  // Center of Kathmandu
  const mapCenter = [27.7172, 85.3240];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] bg-[#F8F9FC] overflow-hidden">
      
      {/* ═════ Top Filter Bar ═════ */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-gray-900 text-lg">Reports near you</h1>
          <span className="bg-blue-100 text-[#1B4FD8] text-xs font-bold px-2 py-0.5 rounded-full">
            {filteredReports.length}
          </span>
        </div>
        
        <div className="flex overflow-x-auto gap-2 pb-1 sm:pb-0 scrollbar-hide w-full sm:w-auto">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((level) => {
            const isActive = filter === level;
            return (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#1B4FD8] text-white border border-[#1B4FD8]'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-[#1B4FD8] hover:text-[#1B4FD8]'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════ Map Area ═════ */}
      <div className="flex-1 relative flex z-0 h-full w-full">
        
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // Disable default zoom to not overlap panels
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredReports.map(report => {
            const lat = report.location?.lat;
            const lng = report.location?.lng;
            if (!lat || !lng) return null;

            const severity = (report.ai_severity || report.severity || 'medium').toLowerCase();
            const color = severityColorMap[severity] || '#D97706';
            const isSelected = selectedReport?.id === report.id;

            return (
              <CircleMarker
                key={report.id}
                center={[lat, lng]}
                radius={isSelected ? 12 : 10}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSelected ? 1 : 0.7,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(report),
                }}
              />
            );
          })}
        </MapContainer>

        {/* ═════ Empty State Overlay ═════ */}
        {filteredReports.length === 0 && (
          <div className="absolute inset-0 z-[400] bg-white/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center max-w-sm">
              <div className="w-16 h-16 bg-blue-50 text-[#1B4FD8] rounded-full flex items-center justify-center mb-4">
                 <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-6">There are no reports matching this severity level in this area.</p>
              <button 
                onClick={() => setFilter('All')}
                className="w-full bg-[#1B4FD8] text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
              >
                View all reports
              </button>
            </div>
          </div>
        )}

        {/* ═════ Desktop Right Sidebar & Mobile Bottom Sheet ═════ */}
        <AnimatePresence>
          {selectedReport && (
            <>
              {/* Mobile overlay */}
              {isMobile && (
                <motion.div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[450]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closePanel}
                />
              )}

              <motion.div
                className={`
                  z-[500] bg-white shadow-2xl flex flex-col overflow-hidden
                  ${isMobile 
                    ? 'fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh]' 
                    : 'absolute top-4 right-4 bottom-4 w-96 rounded-2xl border border-gray-200'}
                `}
                initial={isMobile ? { y: '100%' } : { x: '100%', opacity: 0 }}
                animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
                exit={isMobile ? { y: '100%' } : { x: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                {/* Header/Image Area */}
                <div className="relative h-48 shrink-0 bg-gray-200">
                  <img
                    src={selectedReport.images?.[0] || '/Waterleak.png'}
                    alt="Report thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={closePanel}
                    className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <SeverityBadge severity={selectedReport.ai_severity || 'medium'} />
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                      {selectedReport.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <MapPinIcon className="w-4 h-4 text-[#F97316]" />
                      <span>{selectedReport.location?.address}</span>
                      <span className="mx-1">•</span>
                      <span>1.2km away</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700 capitalize">
                      Category: {selectedReport.category?.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 text-[#1B4FD8] font-bold">
                      <ThumbsUp className="w-4 h-4" />
                      {selectedReport.upvotes}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-3">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Footer / CTA */}
                <div className="p-4 border-t border-gray-100 mt-auto bg-white">
                  <Link
                    to={`/report/${selectedReport.id}`}
                    className="flex justify-center items-center w-full py-3.5 bg-[#1B4FD8] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
                  >
                    View full report
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MapPage;
