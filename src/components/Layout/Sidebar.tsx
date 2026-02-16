/**
 * Sidebar Component
 * Navigation sidebar for LandManager Pro dashboard
 * 
 * Features:
 * - Responsive design with TailwindCSS
 * - Active route highlighting
 * - User profile section at bottom
 * - Icons from lucide-react
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, FolderHeart, BarChart3, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Bản Đồ',
      path: '/',
      icon: <Map className="w-5 h-5" />,
    },
    {
      label: 'Tài Sản Của Tôi',
      path: '/portfolio',
      icon: <FolderHeart className="w-5 h-5" />,
      badge: '0',
    },
    {
      label: 'Thống Kê',
      path: '/stats',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
            LP
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Land
            <span className="text-blue-400">Manager</span>
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-2">GIS Portfolio Hub</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700 bg-opacity-50">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-400 truncate">
              {user?.role === 'admin' ? 'Admin' : 'User'}
            </p>
          </div>
        </div>
        {/* Đăng Tin Button */}
        <button
          onClick={() => {
            if (user?.id) {
              console.log('[Sidebar] Posting form would open for user:', user.id);
              // TODO: Open posting modal/form
            } else {
              console.log('[Sidebar] User not logged in - show login modal');
              // TODO: Show login modal
            }
          }}
          className="w-full px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-green-500 
                     rounded-lg hover:shadow-lg transition-all active:scale-95"
        >
          ✓ Đăng Tin
        </button>
        <button
          onClick={() => {
            console.log('[Sidebar] Logout clicked');
            // TODO: Implement logout
          }}
          className="w-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white 
                     border border-slate-600 rounded-lg hover:bg-slate-700 transition-all"
        >
          Đăng Xuất
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 text-center border-t border-slate-700">
        <p className="text-xs text-slate-500">LandManager Pro v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
