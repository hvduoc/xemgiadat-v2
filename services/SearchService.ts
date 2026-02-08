/**
 * SearchService - Tìm kiếm thửa đất với index tọa độ
 * V2: Sử dụng search index (soTo:soThua → [lng, lat]) để flyTo trực tiếp
 * Click map vẫn dùng queryRenderedFeatures để bắt polygon chính xác
 */
window.SearchService = class SearchService {
  private mapController: any;
  private searchModule: any;
  private searchIndex: Map<string, [number, number]> | null = null;
  private indexLoading: Promise<void> | null = null;
  
  constructor(mapController?: any) {
    this.mapController = mapController || { map: window.MapController.getMap() };
    const SearchModule = (window as any).SearchModule;
    this.searchModule = new SearchModule();
    
    // Bắt đầu load search index ngay khi khởi tạo
    this.loadSearchIndex();
  }
  
  /**
   * Load search index từ file hoặc build từ PMTiles
   * Chỉ chạy một lần và cache trong RAM
   */
  private async loadSearchIndex(): Promise<void> {
    if (this.indexLoading) {
      return this.indexLoading;
    }
    
    if (this.searchIndex) {
      return Promise.resolve();
    }
    
    this.indexLoading = (async () => {
      try {
        console.log('[SearchService] Loading search index...');
        
        // Thử load từ file trước
        try {
          const response = await fetch('/data/search_index.json');
          if (response.ok) {
            const data = await response.json();
            
            // Kiểm tra format - nếu là version 2.0 với flat index
            if (data.version === '2.0' && data.index && typeof data.index === 'object') {
              this.searchIndex = new Map();
              for (const [key, coords] of Object.entries(data.index)) {
                if (Array.isArray(coords) && coords.length === 2) {
                  this.searchIndex.set(key, coords as [number, number]);
                }
              }
              console.log(`[SearchService] ✓ Loaded ${this.searchIndex.size} parcels from search_index.json`);
              return;
            }
          }
        } catch (err) {
          console.warn('[SearchService] Could not load search_index.json, will build from PMTiles:', err);
        }
        
        // Fallback: Build index từ PMTiles features
        await this.buildSearchIndexFromPMTiles();
        
      } catch (err) {
        console.error('[SearchService] Error loading search index:', err);
        // Fallback to empty index - search sẽ vẫn hoạt động qua querySourceFeatures
        this.searchIndex = new Map();
      }
    })();
    
    return this.indexLoading;
  }
  
  /**
   * Build search index từ PMTiles features hiện có
   * Được gọi khi không có file search_index.json hoặc format cũ
   */
  private async buildSearchIndexFromPMTiles(): Promise<void> {
    console.log('[SearchService] Building search index from PMTiles...');
    
    const map = this.mapController?.map;
    if (!map) {
      throw new Error('Map not available');
    }
    
    const StyleEngine = (window as any).StyleEngine;
    
    // Đợi map load xong
    if (!map.loaded()) {
      await new Promise<void>((resolve) => {
        map.once('load', () => resolve());
      });
    }
    
    // Đợi source load xong
    const source = map.getSource(StyleEngine.SOURCE_ID);
    if (!source) {
      // Đợi một chút để source được thêm vào
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Query tất cả features
    const features = map.querySourceFeatures(StyleEngine.SOURCE_ID, {
      sourceLayer: StyleEngine.SOURCE_LAYER
    });
    
    console.log(`[SearchService] Found ${features.length} features, building index...`);
    
    this.searchIndex = new Map();
    
    for (const feature of features) {
      const props = feature.properties || {};
      
      // Extract soTo and soThua
      const soTo = String(props.SoHieuToBanDo || props['Số hiệu tờ bản đồ'] || props.so_to || '').trim();
      const soThua = String(props.SoThuTuThua || props['Số thửa'] || props.so_thua || '').trim();
      
      if (!soTo || !soThua) continue;
      
      const key = `${soTo}:${soThua}`;
      
      // Calculate centroid
      let centroid: [number, number] = [108.2022, 16.0544];
      if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]?.[0]) {
        const coords = feature.geometry.coordinates[0];
        const lngs = coords.map((c: any) => c[0]);
        const lats = coords.map((c: any) => c[1]);
        centroid = [
          (Math.min(...lngs) + Math.max(...lngs)) / 2,
          (Math.min(...lats) + Math.max(...lats)) / 2
        ];
      }
      
      this.searchIndex.set(key, centroid);
    }
    
    console.log(`[SearchService] ✓ Built index with ${this.searchIndex.size} parcels`);
    
    // Optional: Save to localStorage for next time
    try {
      const indexData = {
        version: '2.0',
        generated: new Date().toISOString(),
        total_parcels: this.searchIndex.size,
        index: Object.fromEntries(this.searchIndex)
      };
      
      const jsonStr = JSON.stringify(indexData);
      if (jsonStr.length < 5 * 1024 * 1024) { // Only if < 5MB
        localStorage.setItem('search_index_cache', jsonStr);
        console.log('[SearchService] ✓ Cached index to localStorage');
      }
    } catch (err) {
      console.warn('[SearchService] Could not cache to localStorage:', err);
    }
  }

  /**
   * Tìm kiếm thửa đất theo số tờ/thửa hoặc địa chỉ
   * V2: Sử dụng search index để tìm nhanh theo số tờ/thửa
   * @param query - Chuỗi tìm kiếm (số tờ, số thửa, địa chỉ)
   * @returns Promise<ParcelData[]> - Danh sách các thửa đất tìm được
   */
  async searchParcels(query: string): Promise<ParcelData[]> {
    if (!query || !this.mapController?.map) return [];
    
    try {
      // Đảm bảo search index đã load
      await this.loadSearchIndex();
      
      const map = this.mapController.map;
      const q = query.toLowerCase().trim();
      
      // Parse query để tìm format "số tờ số thửa"
      const parts = q.split(/\s+/);
      if (parts.length === 2) {
        const soToNum = parts[0];
        const soThuaNum = parts[1];
        
        // Nếu cả hai đều là số, thử lookup trực tiếp trong index
        if (!isNaN(Number(soToNum)) && !isNaN(Number(soThuaNum))) {
          const key = `${soToNum}:${soThuaNum}`;
          
          if (this.searchIndex && this.searchIndex.has(key)) {
            const coords = this.searchIndex.get(key)!;
            
            console.log(`[SearchService] Found exact match in index: ${key} → [${coords[0]}, ${coords[1]}]`);
            
            // Trả về kết quả từ index (không cần query PMTiles)
            return [{
              id: key,
              so_to: soToNum,
              so_thua: soThuaNum,
              dien_tich: 0, // Sẽ được lấy sau khi click vào map
              muc_dich: '',
              ma_xa: '',
              dia_chi: 'TP. Đà Nẵng',
              coordinates: coords
            }];
          }
        }
      }
      
      // Fallback: Query từ PMTiles features (cho các trường hợp tìm theo địa chỉ, etc.)
      const StyleEngine = (window as any).StyleEngine;
      const features = map.querySourceFeatures(StyleEngine.SOURCE_ID, {
        sourceLayer: StyleEngine.SOURCE_LAYER
      });

      if (!features || features.length === 0) {
        console.warn('[SearchService] No features loaded yet. Try zooming in or panning the map.');
        return [];
      }

      // Chuyển đổi features thành ParcelData
      const parcels: ParcelData[] = features.map((f: any) => {
        const props = f.properties || {};
        const soTo = String(props.SoHieuToBanDo || props['Số hiệu tờ bản đồ'] || props.so_to || '').trim();
        const soThua = String(props.SoThuTuThua || props['Số thửa'] || props.so_thua || '').trim();
        
        // Ưu tiên lấy tọa độ từ search index
        let coordinates: [number, number] = [108.2022, 16.0544];
        const key = `${soTo}:${soThua}`;
        
        if (this.searchIndex && this.searchIndex.has(key)) {
          coordinates = this.searchIndex.get(key)!;
        } else if (f.geometry?.type === 'Polygon' && f.geometry.coordinates?.[0]?.[0]) {
          // Fallback: tính từ geometry
          const coords = f.geometry.coordinates[0];
          const lngs = coords.map((c: any) => c[0]);
          const lats = coords.map((c: any) => c[1]);
          coordinates = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2
          ];
        }

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

      // Sử dụng SearchModule để rank và filter kết quả
      const results = await this.searchModule.search(query, parcels);
      
      return results.slice(0, 10).map((r: any) => r.parcel);
    } catch (err) {
      console.error('[SearchService] Search error:', err);
      return [];
    }
  }

  /**
   * Tìm thửa đất theo số tờ và số thửa chính xác
   * V2: Sử dụng search index để flyTo trực tiếp
   * @param soTo - Số tờ bản đồ
   * @param soThua - Số thửa
   * @returns ParcelData | null
   */
  async find(soTo: string, soThua: string): Promise<ParcelData | null> {
    if (!soTo || !soThua) return null;
    
    try {
      // Đảm bảo search index đã load
      await this.loadSearchIndex();
      
      const key = `${soTo}:${soThua}`;
      
      // Lookup trong search index
      if (this.searchIndex && this.searchIndex.has(key)) {
        const coords = this.searchIndex.get(key)!;
        
        console.log(`[SearchService] Direct lookup: ${key} → [${coords[0]}, ${coords[1]}]`);
        
        // FlyTo trực tiếp với tọa độ từ index
        const map = this.mapController?.map;
        if (map) {
          map.flyTo({
            center: coords,
            zoom: 20,
            duration: 1500,
            essential: true
          });
        }
        
        // Trả về parcel data (chi tiết sẽ được lấy sau khi map click)
        return {
          id: key,
          so_to: soTo,
          so_thua: soThua,
          dien_tich: 0,
          muc_dich: '',
          ma_xa: '',
          dia_chi: 'TP. Đà Nẵng',
          coordinates: coords
        };
      }
      
      // Fallback: tìm bằng searchParcels
      console.log(`[SearchService] Key ${key} not in index, using searchParcels fallback`);
      const results = await this.searchParcels(`${soTo} ${soThua}`);

      const exact = results.find(p =>
        p.so_to === soTo && p.so_thua === soThua
      );

      const found = exact || (results.length > 0 ? results[0] : null);
      
      if (found) {
        // FlyTo với tọa độ tìm được
        const map = this.mapController?.map;
        if (map && found.coordinates) {
          map.flyTo({
            center: found.coordinates,
            zoom: 20,
            duration: 1500,
            essential: true
          });
        }
      }

      return found;
    } catch (err) {
      console.error('[SearchService] Find error:', err);
      return null;
    }
  }

  terminate() {
    this.searchModule?.terminate();
  }
};
