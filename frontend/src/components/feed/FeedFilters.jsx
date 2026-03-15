import React from 'react';
import { Construction, Zap, Droplets, Trash2, Trees, X } from 'lucide-react';

const categoryOptions = [
  { id: '', label: 'All Reports', icon: null },
  { id: 'road_damage', label: 'Potholes', icon: Construction },
  { id: 'electrical', label: 'Street Lights', icon: Zap },
  { id: 'water_sanitation', label: 'Water & Sanitation', icon: Droplets },
  { id: 'waste_management', label: 'Waste', icon: Trash2 },
  { id: 'public_space', label: 'Public Spaces', icon: Trees },
];

const severityOptions = ['All', 'Critical', 'High', 'Medium', 'Low'];

const statusOptions = [
  { id: 'verified', label: 'Verified' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

const sortOptions = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'priority', label: 'Highest Priority' },
  { value: 'most_upvoted', label: 'Most Votes' },
];

const FeedFilters = ({ filters, onChange, onApply, onClear }) => {

  const handleCategoryChange = (id) => {
    const updated = { ...filters, category: id };
    console.log('[FILTERS] Changed:', updated);
    onChange(updated);
  };

  const handleSeverityChange = (sev) => {
    const val = sev === 'All' ? '' : sev.toLowerCase();
    const updated = { ...filters, severity: val };
    console.log('[FILTERS] Changed:', updated);
    onChange(updated);
  };

  const handleStatusToggle = (statusId) => {
    const current = filters.statuses || [];
    const updated = current.includes(statusId)
      ? current.filter(s => s !== statusId)
      : [...current, statusId];
    const newFilters = { ...filters, statuses: updated };
    console.log('[FILTERS] Changed:', newFilters);
    onChange(newFilters);
  };

  const handleDistanceChange = (e) => {
    const updated = { ...filters, distance: Number(e.target.value) };
    console.log('[FILTERS] Changed:', updated);
    onChange(updated);
  };

  const handleSortChange = (e) => {
    const updated = { ...filters, sortBy: e.target.value };
    console.log('[FILTERS] Changed:', updated);
    onChange(updated);
  };

  const handleApply = () => {
    console.log('[FILTERS] Applied:', filters);
    onApply(filters);
  };

  const handleClear = () => {
    console.log('[FILTERS] Cleared');
    onClear();
  };

  const activeSeverity = filters.severity || '';

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-5 space-y-6 shadow-sm">

      {/* CATEGORIES */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Categories</h4>
        <div className="space-y-1">
          {categoryOptions.map(cat => {
            const isActive = filters.category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-[#1B4FD8]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                {!Icon && <span className="w-4 h-4" />}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* SEVERITY */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Severity</h4>
        <div className="flex flex-wrap gap-2">
          {severityOptions.map(sev => {
            const val = sev === 'All' ? '' : sev.toLowerCase();
            const isActive = activeSeverity === val;
            const colorMap = {
              '': 'bg-gray-100 text-gray-700',
              critical: 'bg-red-100 text-red-800',
              high: 'bg-orange-100 text-orange-800',
              medium: 'bg-yellow-100 text-yellow-800',
              low: 'bg-green-100 text-green-800',
            };
            return (
              <button
                key={sev}
                onClick={() => handleSeverityChange(sev)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? `${colorMap[val]} border-current ring-1 ring-current`
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* STATUS */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status</h4>
        <div className="space-y-2">
          {statusOptions.map(opt => {
            const checked = (filters.statuses || []).includes(opt.id);
            return (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleStatusToggle(opt.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1B4FD8] focus:ring-[#1B4FD8]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* DISTANCE */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Distance</h4>
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={filters.distance || 5000}
          onChange={handleDistanceChange}
          className="w-full accent-[#1B4FD8]"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>100m</span>
          <span className="font-bold text-[#1B4FD8]">
            {((filters.distance || 5000) / 1000).toFixed(1)}km
          </span>
          <span>5km</span>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* SORT BY */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sort By</h4>
        <select
          value={filters.sortBy || 'newest'}
          onChange={handleSortChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-[#1B4FD8] focus:border-[#1B4FD8]"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <hr className="border-gray-100" />

      {/* ACTIONS */}
      <div className="space-y-3">
        <button
          onClick={handleApply}
          className="w-full py-3 bg-[#1B4FD8] text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="w-full text-center text-sm font-semibold text-[#1B4FD8] hover:text-blue-800 transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  );
};

export default FeedFilters;
