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

  init(container: HTMLDivElement, initialView: any, onParcelClick: (data: any) => void, onListingClick?: (data: ListingData) => void) {
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
        
        // Add listing layers
        this.addListingLayers();
        
        // Initialize listings from Firebase if available
        this.refreshListings();
        
        // Handle map clicks with priority: listings first, then parcels
        this.map!.on('click', (e) => {
          // Check for listing clicks first (higher priority)
          if (onListingClick) {
            const listingFeatures = this.map!.queryRenderedFeatures(e.point, {
              layers: ['user-listings-points']
            });
            
            if (listingFeatures.length > 0) {
              const feature = listingFeatures[0];
              const props = feature.properties;
              const coords = feature.geometry.coordinates;
              
              const listingData: ListingData = {
                id: props.id,
                userId: props.userId || '',
                so_to: props.so_to || '',
                so_thua: props.so_thua || '',
                dien_tich: props.dien_tich || 0,
                priceValue: props.priceValue || 0,
                priceUnit: props.priceUnit || 'VND',
                isNegotiable: props.isNegotiable || false,
                loaiGiaoDich: props.loaiGiaoDich || 'ban-dat',
                userName: props.userName || 'Người đăng',
                phone: props.phone || '',
                note: props.note || '',
                status: props.status || 'approved',
                coordinates: [coords[0], coords[1]]
              };
              
              onListingClick(listingData);
              return; // Don't process parcel click
            }
            
            // Check for listing clusters
            const clusterFeatures = this.map!.queryRenderedFeatures(e.point, {
              layers: ['user-listings-clusters']
            });
            
            if (clusterFeatures.length > 0) {
              const cluster = clusterFeatures[0];
              const clusterId = cluster.properties?.cluster_id;
              const source = this.map!.getSource('user-listings');
              
              if (source && clusterId !== undefined) {
                source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                  if (err) return;
                  this.map!.easeTo({
                    center: cluster.geometry.coordinates,
                    zoom
                  });
                });
              }
              return; // Don't process parcel click
            }
          }
          
          // If no listing was clicked, check for parcel click
          const parcelFeatures = this.map!.queryRenderedFeatures(e.point, {
            layers: [StyleEngine.LAYER_FILL]
          });
          
          if (parcelFeatures.length > 0) {
            this.performSelection(e.point, e.lngLat, onParcelClick);
          }
        });

        // Cursor handling for listings
        this.map!.on('mouseenter', 'user-listings-points', () => {
          this.map!.getCanvas().style.cursor = 'pointer';
        });

        this.map!.on('mouseleave', 'user-listings-points', () => {
          this.map!.getCanvas().style.cursor = '';
        });

        this.map!.on('mouseenter', 'user-listings-clusters', () => {
          this.map!.getCanvas().style.cursor = 'pointer';
        });

        this.map!.on('mouseleave', 'user-listings-clusters', () => {
          this.map!.getCanvas().style.cursor = '';
        });

        // Cursor handling for parcels
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

    /**
     * Add listing layers to the map
     */
    private addListingLayers() {
      if (!this.map || this.map.getSource('user-listings')) return;

      // Add source for listings with clustering
      this.map.addSource('user-listings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add cluster layer
      this.map.addLayer({
        id: 'user-listings-clusters',
        type: 'circle',
        source: 'user-listings',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            5,
            '#f1f075',
            10,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            5,
            30,
            10,
            40
          ]
        }
      });

      // Add cluster count layer
      this.map.addLayer({
        id: 'user-listings-cluster-count',
        type: 'symbol',
        source: 'user-listings',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Add individual points layer
      this.map.addLayer({
        id: 'user-listings-points',
        type: 'circle',
        source: 'user-listings',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#ff4444',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    /**
     * Refresh listings from Firebase
     */
    async refreshListings() {
      if (!this.map) return;

      try {
        const firebaseInit = (window as any).__initFirebase;
        if (!firebaseInit) return;

        const { db } = await firebaseInit();
        const snapshot = await db.collection('listings').limit(200).get();
        
        // Extract unique user IDs to fetch user profiles
        const uniqueUserIds = [...new Set(snapshot.docs.map((doc: any) => doc.data().userId).filter(Boolean))];
        
        // Fetch all user profiles in parallel
        const userProfiles: any = {};
        if (uniqueUserIds.length > 0) {
          const userPromises = uniqueUserIds.map((uid: string) => 
            db.collection('users').doc(uid).get()
              .then((userDoc: any) => ({ uid, data: userDoc.exists ? userDoc.data() : null }))
              .catch(() => ({ uid, data: null }))
          );
          const results = await Promise.all(userPromises);
          results.forEach(({ uid, data }: any) => {
            if (data) userProfiles[uid] = data;
          });
        }

        const features = snapshot.docs.map((doc: any) => {
          const data = doc.data() || {};
          if (typeof data.lng !== 'number' || typeof data.lat !== 'number') return null;
          
          // Get user profile or fallback to old data
          const userProfile = data.userId ? userProfiles[data.userId] : null;
          const userName = userProfile?.displayName || data.userName || 'Người đăng';
          const phone = userProfile?.phone || data.phone || '';
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [data.lng, data.lat]
            },
            properties: {
              id: doc.id,
              userId: data.userId || '',
              so_to: data.soHieuToBanDo || '',
              so_thua: data.soThuTuThua || '',
              dien_tich: data.dienTich || 0,
              priceValue: data.priceValue || 0,
              priceUnit: data.priceUnit || 'VND',
              isNegotiable: data.isNegotiable || false,
              loaiGiaoDich: data.loaiGiaoDich || 'ban-dat',
              userName,
              phone,
              note: data.note || '',
              status: data.status || 'approved'
            }
          };
        }).filter(Boolean);

        const source = this.map.getSource('user-listings');
        if (source && source.setData) {
          source.setData({
            type: 'FeatureCollection',
            features
          });
          console.log(`[MapController] ✅ Loaded ${features.length} listings`);
        }
      } catch (err) {
        console.warn('[MapController] Failed to load listings:', err);
      }
    }
};
