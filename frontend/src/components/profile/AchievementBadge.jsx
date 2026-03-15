import React from 'react';
import { Lock } from 'lucide-react';

const AchievementBadge = ({ name, description, icon: Icon, bgColor, iconColor, borderColor, earned }) => {
  if (earned) {
    return (
      <div className={`flex items-start gap-4 p-4 rounded-xl border bg-white transition-all hover:shadow-sm`} style={{ borderColor }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor }}>
          {Icon && <Icon className="w-6 h-6" style={{ color: iconColor }} />}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-[#111827] text-sm">{name}</h4>
          <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{description}</p>
          <span className="inline-block mt-2 text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">EARNED ✓</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-[#E5E7EB] bg-white opacity-60">
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F3F4F6]">
        <Lock className="w-6 h-6 text-[#9CA3AF]" />
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-[#9CA3AF] text-sm">{name}</h4>
        <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{description}</p>
        <span className="inline-block mt-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">LOCKED 🔒</span>
      </div>
    </div>
  );
};

export default AchievementBadge;
