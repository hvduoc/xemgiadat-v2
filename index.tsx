import React from 'react';
import ReactDOM from 'react-dom/client';

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

    // Cố gắng ghi đè bằng Proxy (Cảnh báo: Có thể bị trình duyệt chặn ở một số môi trường)
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
      console.warn('Location proxy assignment restricted, using fallback.');
    }
  } catch (e) {
    console.error('Bypass location failed:', e);
  }
};

bypassLocation();

const App = (window as any).App;
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
