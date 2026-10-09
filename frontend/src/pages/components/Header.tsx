import { Link } from 'react-router-dom';
import {
  SparklesIcon,
} from 'lucide-react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react';
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="h-1 w-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700" />

      <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">

        <Link to="/">
          <span className="text-white font-semibold text-xl tracking-tight">
            Hybrid Forecasting
          </span>
        </Link>

        <div className="flex items-center gap-3">

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 text-sm">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard">
              <button className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-2 transition-colors px-4 py-2 text-sm">
                <span>Open Dashboard</span>
                <SparklesIcon className="w-4 h-4" />
              </button>
            </Link>
          </SignedIn>

        </div>
      </div>
    </header>
  );
};

export default Header;