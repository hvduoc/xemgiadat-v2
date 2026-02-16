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
 * Main App Component
 */
const App: React.FC = () => {
  const baseUrl = import.meta.env.BASE_URL;
  console.log('[App] Router basename:', baseUrl);

  return (
    <BrowserRouter basename={baseUrl}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
