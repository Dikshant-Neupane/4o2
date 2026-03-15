import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import useReportStore from '../../store/reportStore';
import { validateImage, compressImage } from '../../utils/imageUtils';

const StepImage = ({ onNext, onBack }) => {
  const { image, setImage } = useReportStore();
  const [errorDetails, setErrorDetails] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(image ? URL.createObjectURL(image) : null);
  const [compressionStats, setCompressionStats] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = async (event) => {
    setErrorDetails('');
    const file = event.target.files[0];
    
    if (!file) return;

    console.log('[STEP3] File selected:', file.name);

    const { valid, error } = validateImage(file);
    if (!valid) {
      setErrorDetails(error);
      return;
    }

    setIsCompressing(true);
    try {
      const beforeKb = (file.size / 1024).toFixed(2);
      const compressedFile = await compressImage(file);
      const afterKb = (compressedFile.size / 1024).toFixed(2);
      
      console.log(`[STEP3] Compressed: ${beforeKb}KB → ${afterKb}KB`);
      setCompressionStats(`${beforeKb}KB → ${afterKb}KB`);
      
      setImage(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error('[STEP3] Invalid:', err.message);
      setErrorDetails('Failed to compress image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreviewUrl(null);
    setCompressionStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add a Photo</h2>
        <p className="mt-2 text-gray-500">Provide visual proof of the issue to help authorities assess it quickly.</p>
      </div>

      {errorDetails && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {errorDetails}
        </div>
      )}

      {!previewUrl ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Take Photo */}
          <div 
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#1B4FD8] hover:bg-blue-50 cursor-pointer transition-colors group"
          >
            <Camera className="w-12 h-12 text-gray-400 group-hover:text-[#1B4FD8] mb-4" />
            <span className="font-semibold text-gray-700 group-hover:text-[#1B4FD8]">Take Photo</span>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* Upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#1B4FD8] hover:bg-blue-50 cursor-pointer transition-colors group"
          >
            <Upload className="w-12 h-12 text-gray-400 group-hover:text-[#1B4FD8] mb-4" />
            <span className="font-semibold text-gray-700 group-hover:text-[#1B4FD8]">Upload Photo</span>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex flex-col items-center p-4">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-80 w-auto rounded-lg object-contain mb-4"
          />
          {compressionStats && (
            <div className="text-xs text-gray-500 mb-4 bg-white px-3 py-1 rounded-full border border-gray-200">
              Compressed: {compressionStats}
            </div>
          )}
          <button 
            onClick={removeImage}
            className="absolute top-2 right-2 p-2 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-md border border-gray-200 transition-colors"
            title="Remove Photo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {isCompressing && (
         <div className="text-center text-sm text-[#1B4FD8] animate-pulse font-medium">
           Compressing image...
         </div>
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
          disabled={!previewUrl || isCompressing}
          className="px-8 py-3 bg-[#1B4FD8] text-white font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default StepImage;
