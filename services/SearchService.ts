/**
 * SearchService - Tìm kiếm thửa đất từ PMTiles vector source
 * Sử dụng querySourceFeatures để truy vấn features từ vector tiles đã load
 */
window.SearchService = class SearchService {
  private mapController: any;
  private searchModule: any;
  
  constructor(mapController?: any) {
    this.mapController = mapController || { map: window.MapController.getMap() };
    const SearchModule = (window as any).SearchModule;
    this.searchModule = new SearchModule();
  }

  /**
   * Tìm kiếm thửa đất theo số tờ/thửa hoặc địa chỉ
   * @param query - Chuỗi tìm kiếm (số tờ, số thửa, địa chỉ)
   * @returns Promise<ParcelData[]> - Danh sách các thửa đất tìm được
   */
  async searchParcels(query: string): Promise<ParcelData[]> {
    if (!query || !this.mapController?.map) return [];
    
    try {
      const StyleEngine = (window as any).StyleEngine;
      const map = this.mapController.map;
      
      // Lấy tất cả features từ source (trong viewport và tiles đã load)
      const features = map.querySourceFeatures(StyleEngine.SOURCE_ID, {
        sourceLayer: StyleEngine.SOURCE_LAYER
      });

      if (!features || features.length === 0) {
        console.warn('No features loaded yet. Try zooming in or panning the map.');
        return [];
      }

      // Chuyển đổi features thành ParcelData
      const parcels: ParcelData[] = features.map((f: any) => {
        const props = f.properties || {};
        // Lấy tọa độ trung tâm của polygon nếu có
        let coordinates: [number, number] = [108.2022, 16.0544]; // default
        
        if (f.geometry?.type === 'Polygon' && f.geometry.coordinates?.[0]?.[0]) {
          const coords = f.geometry.coordinates[0];
          const lngs = coords.map((c: any) => c[0]);
          const lats = coords.map((c: any) => c[1]);
          coordinates = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2
          ];
        }

        // Map properties - support both Vietnamese and camelCase property names
        // Priority: camelCase (SoThuTuThua, SoHieuToBanDo) > Vietnamese > snake_case
        const soThua = String(props.SoThuTuThua || props['Số thửa'] || props.so_thua || '');
        const soTo = String(props.SoHieuToBanDo || props['Số hiệu tờ bản đồ'] || props.so_to || '');

        return {
          id: f.id || props.OBJECTID || props['Mã thửa đất'] || '',
          so_thua: soThua,
          so_to: soTo,
          dien_tich: parseFloat(props['Diện tích'] || props.dien_tich || 0),
          muc_dich: props['Ký hiệu mục đích sử dụng'] || props.muc_dich || '',
          ma_xa: props['Mã xã'] || props.ma_xa || '',
          dia_chi: props['Địa chỉ'] !== 'Null' ? props['Địa chỉ'] : 'TP. Đà Nẵng',
          coordinates
        };
      });

      // Debug log to see actual data structure
      if (parcels.length > 0) {
        console.log("[Search Debug] Sample Data:", parcels[0]);
        console.log("[Search Debug] Raw Properties:", features[0]?.properties);
      }

      // Sử dụng SearchModule để rank và filter kết quả
      const results = await this.searchModule.search(query, parcels);
      
      return results.slice(0, 10).map((r: any) => r.parcel);
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }

  /**
   * Tìm thửa đất theo số tờ và số thửa chính xác
   * @param soTo - Số tờ bản đồ
   * @param soThua - Số thửa
   * @returns ParcelData | null
   */
  async find(soTo: string, soThua: string): Promise<ParcelData | null> {
    if (!soTo || !soThua) return null;
    const results = await this.searchParcels(`${soTo} ${soThua}`);

    const exact = results.find(p =>
      p.so_to === soTo && p.so_thua === soThua
    );

    const found = exact || (results.length > 0 ? results[0] : null);
    if (found) {
      window.MapController.flyToParcel(soTo, soThua);
    }

    return found;
  }

  terminate() {
    this.searchModule?.terminate();
  }
};
