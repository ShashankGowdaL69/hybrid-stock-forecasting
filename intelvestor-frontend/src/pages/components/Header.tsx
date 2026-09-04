import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { SparklesIcon } from 'lucide-react';
import React from 'react';

const Header: React.FC = () => {
  const { isSignedIn } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>
      <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
        <div className="flex flex-row items-center">
          {/* <img src="/IntelVestor.png" alt="logo" width={30} height={20} className="relative" /> */}
          <Link to="/">
            <span className="text-white font-bold text-xl">
            IntelVestor <span className="text-blue-400">AI</span>
            </span>
          </Link>
        </div>
        {/* <div className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => scrollToSection('features')}
            className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('testimonials')}
            className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
          >
            Testimonials
          </button>
          <Link to="/dashboard/upgrade" className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200">
            Pricing
          </Link>
        </div> */}
        {isSignedIn ? (
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 opacity-20 blur-sm rounded-full "></div>
              <div className="relative z-10 py-0">
                <UserButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex gap-3 items-center">
            <Link to="/sign-in">
              <button className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 flex items-center gap-1 transition-all duration-200 px-4 py-2">
                <span>Get Started</span>
                <SparklesIcon className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
        <div className="md:hidden flex items-center gap-3">
          {isSignedIn && (
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 opacity-20 blur-sm rounded-full"></div>
              <div className="relative z-10">
                <UserButton />
              </div>
            </div>
          )}
          <button
            className="rounded-md p-2 text-gray-300 hover:bg-gray-800 transition-colors duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden flex flex-col items-center gap-4 py-4 bg-gray-900 border-t border-gray-700 shadow-lg">
          <button
            onClick={() => scrollToSection('features')}
            className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('testimonials')}
            className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
          >
            Testimonials
          </button>
          <Link to="/dashboard/upgrade" className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200">
            Pricing
          </Link>
          {isSignedIn ? (
            <Link to="/dashboard" className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200">
              Dashboard
            </Link>
          ) : (
            <Link to="/sign-in">
              <button className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 flex items-center gap-1 transition-all duration-200 px-4 py-2">
                <span>Get Started</span>
                <SparklesIcon className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;