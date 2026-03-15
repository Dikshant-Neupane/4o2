import React, { useState } from 'react';
import useReportStore from '../../store/reportStore';

const StepDescription = ({ onNext, onBack }) => {
  const { description, setDescription } = useReportStore();
  const [localDesc, setLocalDesc] = useState(description || '');
  const [length, setLength] = useState(localDesc.length);
  const maxLength = 300;

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxLength) {
      setLocalDesc(val);
      setLength(val.length);
      setDescription(val);
      console.log('[STEP4] Desc length:', val.length);
    }
  };

  const remaining = maxLength - length;
  const isNearLimit = remaining < 20;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add a Description (Optional)</h2>
        <p className="mt-2 text-gray-500">Any extra details that might help authorities understand the issue better.</p>
      </div>

      <div className="relative">
        <textarea
          value={localDesc}
          onChange={handleChange}
          placeholder="e.g. This pothole has been here for 2 weeks and is causing major traffic delays during rush hour."
          rows={6}
          className="w-full rounded-xl border-gray-300 border shadow-sm focus:border-[#1B4FD8] focus:ring-[#1B4FD8] sm:text-sm p-4 text-gray-900 resize-none transition-shadow"
        />
        <div 
          className={`absolute bottom-4 right-4 text-xs font-semibold ${
            isNearLimit ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {length} / {maxLength}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between gap-3 sm:static sm:border-0 sm:p-0 sm:pt-6 sm:mt-8 z-50">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-[#1B4FD8] text-white font-bold rounded-lg shadow-sm hover:bg-blue-800 transition-colors"
        >
          Review & Submit
        </button>
      </div>
    </div>
  );
};

export default StepDescription;
