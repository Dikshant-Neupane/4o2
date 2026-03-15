import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import * as LucideIcons from 'lucide-react';

import useReportStore from '../../store/reportStore';
import { mockCategories } from '../../mocks/mockCategories';

// Fix Leaflet's default icon path issues (CDN to avoid Rollup resolve issues)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const StepReview = ({ onBack }) => {
  const navigate = useNavigate();
  const { category, location, image, description, clearReport } = useReportStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find category details
  const categoryData = mockCategories.find(c => c.id === category) || {
    label: 'Unknown',
    icon: 'HelpCircle',
  };
  const IconComponent = LucideIcons[categoryData.icon] || LucideIcons.HelpCircle;
  const department = (category || 'Unknown').replace('_', ' ');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    console.log('[STEP5] Submitting...');

    // Log what we're sending
    console.log('[STEP5] FormData:', {
      category_id: category,
      latitude: location?.lat,
      longitude: location?.lng,
      description: description || '',
      image: image?.name || 'no image',
    });

    try {
      // Use the store's submitReport which builds correct FormData
      // and handles the real API call with AI inference
      const { submitReport } = useReportStore.getState();
      const result = await submitReport({
        image,
        latitude: location?.lat,
        longitude: location?.lng,
        category_id: category,
        category,
        description: description || '',
        location,
      });

      if (result.success) {
        const returnedId = result.report?.id || 'mock-id-new';
        console.log('[STEP5] ✅ Success:', returnedId);
        clearReport();
        navigate(`/success/${returnedId}`);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
       console.error('[STEP5] ❌ Error:', error);
       setErrorMsg(error.response?.data?.detail || error.message || 'Failed to submit report. Please try again.');
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Report</h2>
        <p className="mt-2 text-gray-500">Check the details below before submitting.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Category Info */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
           <div className="p-3 bg-blue-100 rounded-full text-[#1B4FD8]">
             <IconComponent className="w-6 h-6" />
           </div>
           <div>
             <h3 className="font-bold text-gray-900 leading-tight">{categoryData.label}</h3>
             <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{department}</p>
           </div>
        </div>

        {/* Location & Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
           <div className="h-48 relative">
              {location ? (
                 <MapContainer 
                    center={[location.lat, location.lng]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    dragging={false}
                    touchZoom={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[location.lat, location.lng]} />
                  </MapContainer>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                   Location missing
                </div>
              )}
           </div>
           
           <div className="h-48 relative bg-black flex items-center justify-center">
             {image ? (
               <img 
                 src={URL.createObjectURL(image)} 
                 alt="Report" 
                 className="max-w-full max-h-full object-contain"
               />
             ) : (
               <div className="text-gray-400 flex flex-col items-center">
                 <LucideIcons.Image className="w-8 h-8 mb-2" />
                 <span>No photo</span>
               </div>
             )}
           </div>
        </div>

        {/* Description */}
        <div className="p-5 border-t border-gray-200">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
          <p className="text-gray-800 text-sm whitespace-pre-wrap">
            {description || <span className="text-gray-400 italic">No description provided.</span>}
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex sm:flex-row gap-3 justify-between sm:static sm:border-0 sm:p-0 sm:pt-6 sm:mt-8 z-50">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-10 py-3 bg-[#1B4FD8] text-white font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:bg-blue-400 transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
               <LucideIcons.Loader2 className="w-5 h-5 animate-spin mr-2" />
               Submitting...
            </>
          ) : (
            'Submit Report'
          )}
        </button>
      </div>
    </div>
  );
};

export default StepReview;
