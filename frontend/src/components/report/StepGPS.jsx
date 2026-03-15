import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertCircle } from 'lucide-react';
import useGPS from '../../hooks/useGPS';
import useReportStore from '../../store/reportStore';
import LoadingSpinner from '../ui/LoadingSpinner';

// Fix Leaflet's default icon path issues (CDN to avoid Rollup resolve issues)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const StepGPS = ({ onNext, onBack }) => {
  const { loading, coords, error, accuracy } = useGPS();
  const { location, setLocation } = useReportStore();
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Default Kathmandu
  const markerRef = useRef(null);

  useEffect(() => {
    if (coords) {
      console.log('[STEP2] GPS ready:', coords);
      if (!location) {
        setMapCenter([coords.lat, coords.lng]);
        setLocation({ lat: coords.lat, lng: coords.lng, accuracy });
      } else {
        setMapCenter([location.lat, location.lng]);
      }
    }
  }, [coords, location, accuracy, setLocation]);

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const position = marker.getLatLng();
      const newCoords = { lat: position.lat, lng: position.lng, accuracy: null };
      console.log('[STEP2] Pin moved:', newCoords);
      setLocation(newCoords);
    }
  };

  return (
    <div className="space-y-6">
       <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Where is the issue located?</h2>
        <p className="mt-2 text-gray-500">Drag the pin to point exactly where the problem is.</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-gray-200">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[#1B4FD8] font-medium">Detecting your location...</p>
        </div>
      )}

      {error && !loading && (
         <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Location Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">Please enable GPS in your browser settings and refresh, or drag the pin manually.</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="relative h-[240px] md:h-[400px] rounded-xl overflow-hidden border border-gray-300 shadow-sm z-10">
           <MapContainer 
             center={mapCenter} 
             zoom={16} 
             style={{ height: '100%', width: '100%' }}
           >
             <TileLayer
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />
             <ChangeView center={mapCenter} zoom={16} />
             {location && (
               <Marker
                  position={[location.lat, location.lng]}
                  draggable={true}
                  eventHandlers={{
                    dragend: handleDragEnd,
                  }}
                  ref={markerRef}
               >
                 <Popup>
                   Issue Location
                 </Popup>
               </Marker>
             )}
           </MapContainer>
        </div>
      )}

      {!loading && accuracy && (
         <p className="text-sm text-green-600 font-medium text-center flex justify-center items-center gap-1">
           <MapPin className="w-4 h-4" />
           Location accurate to ~{Math.round(accuracy)}m
         </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between gap-3 sm:static sm:border-0 sm:p-0 sm:pt-6 sm:mt-8 z-50">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!location}
          className="px-8 py-3 bg-[#1B4FD8] text-white font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default StepGPS;
