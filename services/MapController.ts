window.MapController = class MapController {
  private static instance: any = null;
  private map: any;
  private protocol: any;

  constructor() {
    this.protocol = new (window as any).pmtiles.Protocol();
    const mlgl = (window as any).maplibregl;
    if (mlgl.addProtocol && (!mlgl._protocols || !mlgl._protocols.pmtiles)) {
      mlgl.addProtocol('pmtiles', (params: any, callback: any) => {
        return this.protocol.tile(params, callback);
      });
    }
    
    // Đảm bảo worker không truy cập domain hiện tại để tránh lỗi CORS/Location
    mlgl.workerUrl = 'https://unpkg.com/maplibre-gl@5.1.0/dist/maplibre-gl-csp-worker.js';
  }

  static setInstance(instance: any) {
    MapController.instance = instance;
  }

  static flyToParcel(soTo: string, soThua: string) {
    if (!MapController.instance) return null;
    return MapController.instance.flyToParcel(soTo, soThua);
  }

  static flyToCoordinates(lng: number, lat: number, zoom: number = 18) {
    if (!MapController.instance) return;
    MapController.instance.flyToCoordinates(lng, lat, zoom);
  }

  static getMap() {
    return MapController.instance ? MapController.instance.getMap() : null;
  }

  init(container: HTMLDivElement, initialView: any, onParcelClick: (data: any) => void) {
    try {
      const maplibregl = (window as any).maplibregl;
      this.map = new maplibregl.Map({
        container,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap'
            }
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
        },
        center: initialView.lng && initialView.lat ? [initialView.lng, initialView.lat] : [108.2022, 16.0544],
        zoom: initialView.zoom || 14,
        hash: false, // TUYỆT ĐỐI KHÔNG ĐƯỢC BẬT TRONG IFRAME
        validateStyle: false, // Bỏ qua xác thực style để giảm thiểu network calls ngầm
        transformRequest: (url: string) => {
          // Bắt buộc URL tuyệt đối cho mọi resource
          if (url.startsWith('/')) {
            return { url: `https://xemgiadat.com${url}` };
          }
          return { url };
        }
      });

      this.map.on('load', () => {
        const StyleEngine = (window as any).StyleEngine;
        StyleEngine.applyLODStyle(this.map!);
        
        this.map!.on('click', StyleEngine.LAYER_FILL, (e) => {
          this.performSelection(e.point, e.lngLat, onParcelClick);
        });

        this.map!.on('mouseenter', StyleEngine.LAYER_FILL, () => {
          this.map!.getCanvas().style.cursor = 'pointer';
        });

        this.map!.on('mouseleave', StyleEngine.LAYER_FILL, () => {
          this.map!.getCanvas().style.cursor = '';
        });
      });

      this.map.on('moveend', () => {
        if (!this.map) return;
        const LinkService = (window as any).LinkService;
        const c = this.map.getCenter();
        LinkService.updateUrl(c.lat, c.lng, this.map.getZoom());
      });

      return this.map;
    } catch (err) {
      console.error('Map initialization failed:', err);
      return null;
    }
  }

  private performSelection(point: any, lngLat: any, callback: Function) {
    if (!this.map) return;
    const StyleEngine = (window as any).StyleEngine;
    const features = this.map.queryRenderedFeatures(point, {
      layers: [StyleEngine.LAYER_FILL]
    });

    if (features.length > 0) {
      const feature = features[0];
      const parcelId = feature.id || feature.properties?.OBJECTID;
      this.highlightParcel(parcelId as string);
      
      callback({
        id: parcelId,
        ...feature.properties,
        coordinates: [lngLat.lng, lngLat.lat]
      });
    }
  }

  highlightParcel(id: string | number) {
    if (!this.map) return;
    const StyleEngine = (window as any).StyleEngine;
    this.map.setFilter(StyleEngine.LAYER_HIGHLIGHT, ['==', ['id'], id]);
  }

    /**
     * Bay đến thửa đất theo số tờ và số thửa
     * @param soTo - Số tờ bản đồ
     * @param soThua - Số thửa
     */
    async flyToParcel(soTo: string, soThua: string) {
      if (!this.map) return;
    
      const StyleEngine = (window as any).StyleEngine;
    
      // Tìm feature trong viewport hiện tại
      const features = this.map.querySourceFeatures(StyleEngine.SOURCE_ID, {
        sourceLayer: StyleEngine.SOURCE_LAYER
      });

      const targetFeature = features.find((f: any) => {
        const props = f.properties || {};
        const fSoTo = props['Số hiệu tờ bản đồ'] || props.so_to || '';
        const fSoThua = props['Số thửa'] || props.so_thua || '';
        return fSoTo === soTo && fSoThua === soThua;
      });

      if (targetFeature) {
        // Tính tọa độ trung tâm của polygon
        let center: [number, number] = [108.2022, 16.0544];
      
        if (targetFeature.geometry?.type === 'Polygon' && targetFeature.geometry.coordinates?.[0]?.[0]) {
          const coords = targetFeature.geometry.coordinates[0];
          const lngs = coords.map((c: any) => c[0]);
          const lats = coords.map((c: any) => c[1]);
          center = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2
          ];
        }

        // Bay đến và zoom vào
        this.map.flyTo({
          center,
          zoom: 18,
          duration: 1500,
          essential: true
        });

        // Highlight thửa đất
        const parcelId = targetFeature.id || targetFeature.properties?.OBJECTID;
        if (parcelId) {
          setTimeout(() => {
            this.highlightParcel(parcelId);
          }, 1600);
        }
      
        return targetFeature;
      } else {
        console.warn(`Không tìm thấy thửa ${soThua}, tờ ${soTo} trong khu vực hiện tại. Hãy zoom ra hoặc pan map.`);
        return null;
      }
    }

    /**
     * Bay đến tọa độ và tìm thửa đất gần nhất
     * @param lng - Kinh độ
     * @param lat - Vĩ độ
     * @param zoom - Mức zoom (mặc định 18)
     */
    flyToCoordinates(lng: number, lat: number, zoom: number = 18) {
      if (!this.map) return;
    
      this.map.flyTo({
        center: [lng, lat],
        zoom,
        duration: 1500,
        essential: true
      });
    }

    /**
     * Lấy instance map để sử dụng external
     */
    getMap() {
      return this.map;
    }
};
