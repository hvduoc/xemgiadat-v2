/**
 * Main entry point for XemGiaDat v2
 * Initializes React app and all services
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// === Service Imports (sets window globals) ===
import '../services/LandParcelService';
import '../services/AIInsightService';
import '../services/BookmarkService';
import '../services/ImageService';
import '../services/PriceService';
import '../services/LinkService';
import '../services/MapModule';

// === App Component ===
import App from '../App';

/**
 * CẦU CHÌ BẢO VỆ: bypassLocation
 * Sử dụng Proxy để đánh lừa các thư viện bên thứ 3 (như MapLibre) 
 * khi chúng cố gắng đọc window.location.
 */
const bypassLocation = () => {
  try {
    const fakeLoc: any = { 
      href: 'https://xemgiadat.com/', 
      origin: 'https://xemgiadat.com', 
      protocol: 'https:',
      host: 'xemgiadat.com',
      hostname: 'xemgiadat.com',
      pathname: '/',
      search: '',
      hash: '',
      toString: () => 'https://xemgiadat.com/'
    };
    
    // Đặt vào biến toàn cục để các service khác sử dụng
    (window as any).__SAFE_LOCATION__ = fakeLoc;

    // Cố gắng ghi đè bằng Proxy
    try {
      const locationProxy = new Proxy(window.location, {
        get: (target, prop) => {
          if (prop in fakeLoc) return fakeLoc[prop];
          try { return (target as any)[prop]; } catch (e) { return undefined; }
        }
      });
      Object.defineProperty(window, 'location', {
        value: locationProxy,
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      console.warn('[Bypass] Location proxy assignment restricted, using fallback.');
    }
  } catch (e) {
    console.error('[Bypass] Failed:', e);
  }
};

bypassLocation();

// Initialize React app
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('[App] Initializing React root...');
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[App] ✓ React app mounted');
} else {
  console.error('[App] Root element not found!');
}
