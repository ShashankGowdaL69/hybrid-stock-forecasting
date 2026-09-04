import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import {
  LayoutGrid,
  X,
  LogOut,
  ChevronRight,
  Home,
  Activity,
  LineChart,
  PieChart,
  Users,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SideNavProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, setIsOpen }) => {
  const [currentTime, setCurrentTime] = useState('');

  const menuList = [
    { id: 0, name: 'Home', icon: Home, path: '/' },
    { id: 1, name: 'Insights', icon: LayoutGrid, path: '/insights' },
    { id: 2, name: 'Sentiment Analysis', icon: Activity, path: '/sentiment' },
    { id: 3, name: 'Predictions', icon: LineChart, path: '/predictions' },
    { id: 4, name: 'Portfolio Analytics', icon: PieChart, path: '/portfolio' },
    { id: 5, name: 'Social Insights', icon: Users, path: '/social' },
    { id: 6, name: 'Support', icon: HelpCircle, path: '/support' },
  ];

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
    const handleResize = () => setIsOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <motion.nav 
        initial={{ x: -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 h-screen border-r border-gray-700 bg-gray-800 text-white z-50 w-64 md:w-64 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-400">IntelVestor AI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          {menuList.map((menu) => (
            <NavLink
              key={menu.id}
              to={menu.path}
              onClick={() => window.innerWidth < 768 && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-900/50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <menu.icon size={20} className="text-blue-400" />
                    <span>{menu.name}</span>
                  </div>
                  {isActive && <ChevronRight size={16} className="text-blue-300" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700 flex items-center gap-3">
          <UserButton />
          <div>
            <p className="text-sm font-medium">Your Account</p>
            <p className="text-xs text-gray-400">{currentTime}</p>
          </div>
          <button className="ml-auto text-gray-300 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
      </motion.nav>
    </>
  );
};

export default SideNav;