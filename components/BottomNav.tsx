import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Building2Icon, ClockIcon, LayoutDashboardIcon, MenuIcon } from './icons/Icons';
import MoreMenu from './MoreMenu';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { path: '/projects', label: 'Projects', icon: Building2Icon },
  { path: '/time-tracking', label: 'Time', icon: ClockIcon },
];

const BottomNav: React.FC = () => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const location = useLocation();

  const isMoreMenuActive = ![
    '/',
    '/projects',
    '/time-tracking'
  ].includes(location.pathname);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary-navy flex justify-around items-center z-30">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
                isActive ? 'text-white' : 'text-blue-200 hover:text-white'
              }`
            }
          >
            <Icon className="w-6 h-6 mb-1" />
            <span>{label}</span>
          </NavLink>
        ))}
        {/* More Menu Button */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
            isMoreMenuActive ? 'text-white' : 'text-blue-200 hover:text-white'
          }`}
          aria-label="Open more menu options"
        >
          <MenuIcon className="w-6 h-6 mb-1" />
          <span>More</span>
        </button>
      </nav>
      <MoreMenu isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} />
    </>
  );
};

export default BottomNav;