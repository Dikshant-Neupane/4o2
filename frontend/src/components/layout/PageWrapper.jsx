import React from 'react';

export function PageWrapper({ children }) {
  return (
    <main className="min-h-screen bg-[#F8F9FC] pt-28">
      {/*
        pt-28 = 112px top padding
        Breakdown: 16px (navbar top offset) + 64px (navbar height)
                   + 32px (breathing room) = 112px
        This works on EVERY page automatically
      */}
      {children}
    </main>
  );
}
