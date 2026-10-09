import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  Activity,
  Star,
  History,
  X,
  Menu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserButton } from '@clerk/clerk-react';
import { dark } from '@clerk/ui/themes';

interface SideNavProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideNav: React.FC<SideNavProps> = ({
  isOpen,
  setIsOpen,
}) => {
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsOpen]);

  const menuList = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      name: 'Forecast',
      icon: LineChart,
      path: '/predictions',
    },
    {
      name: 'Watchlist',
      icon: Star,
      path: '/watchlist',
    },
    {
      name: 'Forecast History',
      icon: History,
      path: '/history',
    },
    {
      name: 'Sentiment Simulation',
      icon: Activity,
      path: '/sentiment-simulation',
    },
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          title="Open navigation menu"
          className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg border border-slate-700 bg-slate-950 text-white shadow-lg hover:bg-slate-800 transition-colors"
        >
          <Menu size={22} />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.nav
        initial={{ x: -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white z-50 flex flex-col"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Hybrid Forecasting
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Forecasting Framework
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-3 space-y-1">
          {menuList.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              onClick={() =>
                window.innerWidth < 768 &&
                setIsOpen(false)
              }
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <menu.icon size={19} />
              <span>{menu.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <UserButton
            appearance={{
              theme: dark,
            }}
            userProfileProps={{
              appearance: {
                theme: dark,
              },
            }}
          />

          <div>
            <p className="text-sm font-medium">
              Your Account
            </p>

            <p className="text-xs text-slate-500">
              Clerk account
            </p>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default SideNav;