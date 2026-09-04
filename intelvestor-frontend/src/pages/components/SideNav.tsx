import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  LineChart,
  MessageSquareText,
  Brain,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SideNavProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, setIsOpen }) => {
  const menuList = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Market Data', icon: Database, path: '/market-data' },
    { name: 'Forecast', icon: LineChart, path: '/forecast' },
    { name: 'Sentiment', icon: MessageSquareText, path: '/sentiment' },
    { name: 'Model Insights', icon: Brain, path: '/model-insights' },
  ];

  return (
    <>
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
              onClick={() => window.innerWidth < 768 && setIsOpen(false)}
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

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Hybrid forecasting using
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ARIMA · LSTM · Sentiment
          </p>
        </div>
      </motion.nav>
    </>
  );
};

export default SideNav;
