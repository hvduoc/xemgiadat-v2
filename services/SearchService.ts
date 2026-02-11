/**
 * SearchService - Tìm kiếm thửa đất từ search_index.json
 * Sử dụng pre-built search index để tìm kiếm nhanh chóng
 */
window.SearchService = class SearchService {
  private mapController: any;
  private searchModule: any;
  private searchIndex: Map<string, ParcelData> | null = null;
  private indexLoadPromise: Promise<void> | null = null;
  
  constructor(mapController?: any) {
    this.mapController = mapController || { map: window.MapController.getMap() };
    const SearchModule = (window as any).SearchModule;
    this.searchModule = new SearchModule();
    // Start loading index immediately
    this.indexLoadPromise = this.loadSearchIndex();
  }

  /**
   * Load search index from ./data/search_index.json
   */
  private async loadSearchIndex(): Promise<void> {
    if (this.searchIndex) return;
    
    try {
      const response = await fetch('./data/search_index.json');
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.searchIndex = new Map();
      
      // Build map for quick lookup: "so_to:so_thua" -> ParcelData
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          const parcelData = value as any;
          const mapKey = `${parcelData.so_to}:${parcelData.so_thua}`;
          this.searchIndex.set(mapKey, {
            id: parcelData.id || mapKey,
            so_thua: parcelData.so_thua || '',
            so_to: parcelData.so_to || '',
            dien_tich: parseFloat(parcelData.dien_tich || 0),
            muc_dich: parcelData.muc_dich || '',
            ma_xa: parcelData.ma_xa || '',
            dia_chi: parcelData.dia_chi !== 'Null' ? parcelData.dia_chi : 'TP. Đà Nẵng',
            coordinates: parcelData.coordinates || [108.2022, 16.0544]
          });
        }
      }
      
      console.log(`Search index loaded: ${this.searchIndex.size} parcels`);
    } catch (err) {
      console.error('Failed to load search index:', err);
      this.searchIndex = new Map(); // Empty map to avoid retrying
    }
  }

  /**
   * Tìm kiếm thửa đất theo số tờ/thửa hoặc địa chỉ
   * @param query - Chuỗi tìm kiếm (số tờ, số thửa, địa chỉ)
   * @returns Promise<ParcelData[]> - Danh sách các thửa đất tìm được
   */
  async searchParcels(query: string): Promise<ParcelData[]> {
    if (!query) return [];
    
    // Wait for index to load
    await this.indexLoadPromise;
    
    if (!this.searchIndex || this.searchIndex.size === 0) {
      console.warn('Search index not loaded');
      return [];
    }
    
    try {
      // Convert map to array for searching
      const parcels = Array.from(this.searchIndex.values());
      
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
