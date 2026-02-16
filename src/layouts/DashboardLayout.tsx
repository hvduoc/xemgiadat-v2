/**
 * DashboardLayout Component
 * Main application shell with sidebar and outlet
 * 
 * Structure:
 * - Fixed Sidebar (left)
 * - Flex Main Content (right)
 * - Uses Outlet from react-router-dom
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Layout/Sidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
