/**
 * Main entry point for XemGiaDat v2
 * Initializes React app and all services
 */

console.log('[main.tsx] ENTRY - File loaded');

import React from 'react';
import { createRoot } from 'react-dom/client';
import * as pmtiles from 'pmtiles';

console.log('[main.tsx] React imports loaded');
console.log('[main.tsx] PMTiles module loaded');

(window as any).pmtiles = pmtiles;

// === Service Imports (sets window globals) ===
console.log('[main.tsx] Loading services...');
import '../services/LandParcelService';
console.log('[main.tsx] ✓ LandParcelService loaded');
import '../services/MapController';
console.log('[main.tsx] ✓ MapController loaded');
import '../services/AIInsightService';
console.log('[main.tsx] ✓ AIInsightService loaded');
import '../services/BookmarkService';
console.log('[main.tsx] ✓ BookmarkService loaded');
import '../services/ImageService';
console.log('[main.tsx] ✓ ImageService loaded');
import '../services/PriceService';
console.log('[main.tsx] ✓ PriceService loaded');
import '../services/LinkService';
console.log('[main.tsx] ✓ LinkService loaded');
import '../services/MapModule';
console.log('[main.tsx] ✓ MapModule loaded');

console.log('[main.tsx] Services imports completed');

// === App Component ===
console.log('[main.tsx] Importing App component...');
import App from '../App';
console.log('[main.tsx] App component imported:', App);

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

console.log('[main.tsx] Running bypassLocation...');
bypassLocation();
console.log('[main.tsx] bypassLocation completed');

// Initialize React app
console.log('[main.tsx] Looking for root element...');
const rootElement = document.getElementById('root');
console.log('[main.tsx] Root element found:', rootElement);

if (rootElement) {
  console.log('[main.tsx] ROOT ELEMENT FOUND - Initializing React root...');
  try {
    const root = createRoot(rootElement);
    console.log('[main.tsx] createRoot created:', root);
    
    console.log('[main.tsx] Rendering App component...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('[main.tsx] ✓ React app render() call completed');
  } catch (renderError) {
    console.error('[main.tsx] ✗ ERROR during React render:', renderError);
  }
} else {
  console.error('[main.tsx] ✗ ROOT ELEMENT NOT FOUND - Cannot mount React app!');
}
