import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  useEffect(() => {
    console.log('[FOOTER] Mounted');
  }, []);

  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4 xl:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/pictures/logofolder/logo.png"
                alt="Jana Sunuwaai"
                style={{
                  height: "120px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Link>
            <p className="text-[#6B7280] text-sm">
              Empowering communities with transparent issue reporting and resolution.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-8 xl:col-span-1 xl:mt-0 items-center justify-center">
            <div className="flex gap-4 flex-wrap justify-between sm:justify-start lg:col-span-2">
                <Link to="/" className="text-sm text-[#6B7280] hover:text-gray-900">Home</Link>
                <Link to="/feed" className="text-sm text-[#6B7280] hover:text-gray-900">Feed</Link>
                <Link to="/map" className="text-sm text-[#6B7280] hover:text-gray-900">Map</Link>
                <Link to="/about" className="text-sm text-[#6B7280] hover:text-gray-900">About</Link>
                <Link to="/privacy" className="text-sm text-[#6B7280] hover:text-gray-900">Privacy</Link>
                <Link to="/terms" className="text-sm text-[#6B7280] hover:text-gray-900">Terms</Link>
            </div>
          </div>

          <div className="mt-8 xl:col-span-1 xl:mt-0 flex justify-end items-center">
            <Link
              to="/report"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1B4FD8] hover:bg-blue-800 transition-colors"
            >
              Report an Issue
            </Link>
          </div>
        </div>
        
        <div className="mt-12 border-t border-[#E5E7EB] pt-8 flex justify-center">
          <p className="text-sm text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} Jana Sunuwaai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
