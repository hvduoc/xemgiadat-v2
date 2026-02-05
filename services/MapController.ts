class MapController {
  private map: any;
  private protocol: any;

  constructor() {
    const pmtiles = (window as any).pmtiles || (window as any).PMTiles;
    this.protocol = new pmtiles.Protocol();
    const mlgl = (window as any).maplibregl;
    if (mlgl.addProtocol && (!mlgl._protocols || !mlgl._protocols.pmtiles)) {
      mlgl.addProtocol('pmtiles', (params: any, callback: any) => {
        return this.protocol.tile(params, callback);
      });
    }
    
    // Đảm bảo worker không truy cập domain hiện tại để tránh lỗi CORS/Location
    mlgl.workerUrl = 'https://unpkg.com/maplibre-gl@5.1.0/dist/maplibre-gl-csp-worker.js';
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
}

(window as any).MapController = MapController;
