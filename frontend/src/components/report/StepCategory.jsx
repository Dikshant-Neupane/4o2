import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import useReportStore from '../../store/reportStore';
import CategoryCard from '../ui/CategoryCard';
import { mockCategories } from '../../mocks/mockCategories';

const StepCategory = ({ onNext }) => {
  const location = useLocation();
  const { setCategory, category: selectedCategoryId } = useReportStore();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Formatting categories
    const formattedCategories = mockCategories.map((cat, index) => ({
      ...cat,
      status: index < 3 ? 'ACTIVE' : 'COMING_SOON',
      IconComponent: LucideIcons[cat.icon] || LucideIcons.HelpCircle
    }));
    setCategories(formattedCategories);

    // Pre-select if from router state
    if (location.state?.category_id) {
      handleSelect(location.state.category_id);
      // Clean up state so we don't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSelect = (id) => {
    console.log('[STEP1] Category selected:', id);
    setCategory(id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">What type of issue are you reporting?</h2>
        <p className="mt-2 text-gray-500">Select the category that best matches your problem.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className={`rounded-xl transition-all ${
              selectedCategoryId === cat.id ? 'ring-2 ring-[#1B4FD8] scale-[1.02]' : ''
            }`}
          >
            <CategoryCard
              id={cat.id}
              label={cat.label}
              icon={cat.IconComponent}
              department={cat.id.replace('_', ' ')}
              status={cat.status}
              onSelect={handleSelect}
            />
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-3 sm:static sm:border-0 sm:p-0 sm:pt-6 sm:mt-8 z-50">
        <button
          onClick={onNext}
          disabled={!selectedCategoryId}
          className="px-8 py-3 bg-[#1B4FD8] text-white font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default StepCategory;
