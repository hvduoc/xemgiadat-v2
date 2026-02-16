/**
 * DashboardLayout Component
 * Main application shell with sidebar and outlet
 * 
 * Structure:
 * - Fixed Sidebar (left)
 * - Flex Main Content (right)
 * - Uses Outlet from react-router-dom
 */

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Layout/Sidebar';
import type { LandParcel } from '@/types';
import LoginModal from '@/components/Common/LoginModal';
import PostListingModal from '@/components/Common/PostListingModal';

export const DashboardLayout: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);

  useEffect(() => {
    const handleLoginOpen = () => setIsLoginOpen(true);
    const handlePostOpen = () => setIsPostOpen(true);
    const handleParcelSelected = (event: Event) => {
      const customEvent = event as CustomEvent<LandParcel>;
      setSelectedParcel(customEvent.detail);
    };

    window.addEventListener('auth:login', handleLoginOpen);
    window.addEventListener('posting:open', handlePostOpen);
    window.addEventListener('parcel:selected', handleParcelSelected);

    return () => {
      window.removeEventListener('auth:login', handleLoginOpen);
      window.removeEventListener('posting:open', handlePostOpen);
      window.removeEventListener('parcel:selected', handleParcelSelected);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-white">
        <Outlet />
      </main>

      <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <PostListingModal
        open={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        selectedParcel={selectedParcel}
      />
    </div>
  );
};

export default DashboardLayout;
