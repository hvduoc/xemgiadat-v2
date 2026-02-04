export class LinkService {
  /**
   * Truy cập dữ liệu URL một cách an toàn.
   */
  private static getSafeLocation(): any {
    return (window as any).__SAFE_LOCATION__ || {
      href: 'https://xemgiadat.com/',
      origin: 'https://xemgiadat.com',
      protocol: 'https:',
      host: 'xemgiadat.com',
      hostname: 'xemgiadat.com',
      pathname: '/',
      search: '',
      hash: ''
    };
  }

  static getParams() {
    try {
      const loc = this.getSafeLocation();
      const hash = loc.hash || '';
      const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
      const searchParams = new URLSearchParams(cleanHash);
      
      return {
        lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null,
        lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null,
        zoom: searchParams.get('z') ? parseFloat(searchParams.get('z')!) : null,
        parcelId: searchParams.get('p') || null,
      };
    } catch (e) {
      return { lat: null, lng: null, zoom: null, parcelId: null };
    }
  }

  static updateUrl(lat: number, lng: number, zoom: number, parcelId?: string | null) {
    try {
      const params = new URLSearchParams();
      params.set('lat', lat.toFixed(6));
      params.set('lng', lng.toFixed(6));
      params.set('z', zoom.toFixed(2));
      if (parcelId) params.set('p', parcelId);
      
      const hash = `#${params.toString()}`;
      
      // Chỉ cập nhật history nếu không bị chặn bởi sandbox
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, '', hash);
      }
      
      // Luôn cập nhật vào mock object để ứng dụng đồng bộ
      const safeLoc = (window as any).__SAFE_LOCATION__;
      if (safeLoc) safeLoc.hash = hash;
    } catch (e) {
      // Bỏ qua lỗi trong môi trường hạn chế
    }
  }

  static generateShareLink(parcelId: string, lat: number, lng: number) {
    const loc = this.getSafeLocation();
    const baseUrl = loc.href.split('#')[0];
    const params = `lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&z=18&p=${parcelId}`;
    return `${baseUrl}#${params}`;
  }
}
