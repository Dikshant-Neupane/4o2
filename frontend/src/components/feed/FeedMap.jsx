import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import SeverityBadge from '../ui/SeverityBadge';

const severityColorMap = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
};

const FeedMap = ({ reports, center }) => {

  useEffect(() => {
    console.log('[MAP] Mounted');
    console.log('[MAP] Markers:', reports?.length || 0);
  }, [reports]);

  const handleMarkerClick = (id) => {
    console.log('[MAP] Marker clicked:', id);
  };

  const mapCenter = center || [27.7172, 85.3240];

  return (
    <div className="h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports?.map(report => {
          const lat = report.location?.lat || report.lat;
          const lng = report.location?.lng || report.lng;
          if (!lat || !lng) return null;

          const severity = (report.ai_severity || report.severity || 'medium').toLowerCase();
          const color = severityColorMap[severity] || '#D97706';

          return (
            <CircleMarker
              key={report.id}
              center={[lat, lng]}
              radius={10}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => handleMarkerClick(report.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-2 p-1">
                  <SeverityBadge severity={severity} />
                  <h3 className="font-bold text-gray-900 text-sm mt-2 leading-tight">
                    {report.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {report.location?.address || 'Kathmandu'}
                  </p>
                  <Link
                    to={`/report/${report.id}`}
                    className="inline-block text-xs font-semibold text-[#1B4FD8] hover:text-blue-800 mt-1"
                  >
                    View Full Report →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FeedMap;
