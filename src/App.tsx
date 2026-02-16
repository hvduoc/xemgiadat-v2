/**
 * App Component
 * Root component with routing configuration
 * 
 * Structure:
 * - BrowserRouter: Enable routing
 * - AuthProvider: Provide auth context globally
 * - Routes: Define application routes
 *   - Dashboard: Main map view
 *   - Portfolio: Saved parcels
 *   - Stats: Placeholder for future analytics
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Portfolio from '@/pages/Portfolio';

/**
 * Placeholder Stats Page
 */
const StatsPage: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900">Thống Kê</h2>
      <p className="text-gray-600 mt-4">Tính năng này sẽ sớm được cập nhật</p>
    </div>
  </div>
);

/**
 * Main App Component
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Dashboard Layout (with Sidebar) */}
          <Route element={<DashboardLayout />}>
            {/* Map page - default route */}
            <Route index element={<Dashboard />} />
            
            {/* Portfolio page */}
            <Route path="/portfolio" element={<Portfolio />} />
            
            {/* Stats page (placeholder) */}
            <Route path="/stats" element={<StatsPage />} />
          </Route>

          {/* Catch-all: redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
