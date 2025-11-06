import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ListChecksIcon,
  CalendarIcon,
  MapIcon,
  UsersIcon,
  ClipboardCheckIcon,
  UserCircleIcon,
  FileTextIcon,
} from './icons/Icons';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/tasks', label: 'Tasks', icon: ListChecksIcon },
  { path: '/schedule', label: 'Schedule', icon: CalendarIcon },
  { path: '/punch-lists', label: 'Punch Lists', icon: ClipboardCheckIcon },
  { path: '/invoicing', label: 'Invoicing', icon: FileTextIcon },
  { path: '/team', label: 'Team', icon: UsersIcon },
  { path: '/map', label: 'Map View', icon: MapIcon },
  { path: '/profile', label: 'Profile', icon: UserCircleIcon },
];

const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Menu Content */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transition-transform transform translate-y-0"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-center text-gray-800">More Options</h2>
        </div>
        <nav className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {menuItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex flex-col items-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-7 h-7 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MoreMenu;