window.MapController = class MapController {
  private static instance: any = null;
  private map: any;
  private protocol: any;
  private listingsCache: any = null;
  private listingsCacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

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

  static drawRadiusCircle(center: [number, number], radius: number) {
    if (!MapController.instance) return;
    MapController.instance.drawRadiusCircle(center, radius);
  }

  static clearRadiusCircle() {
    if (!MapController.instance) return;
    MapController.instance.clearRadiusCircle();
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
              tiles: ['https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
        
        // Add radius circle layer
        this.addRadiusCircleLayer();
        
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
              const geometry = feature.geometry;
              
              // Validate geometry type
              if (geometry.type !== 'Point') {
                console.warn('[MapController] Expected Point geometry for listing, got:', geometry.type);
                return;
              }
              
              const coords = geometry.coordinates as [number, number];
              
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
              const source = this.map!.getSource('user-listings') as any;
              
              if (source && clusterId !== undefined && typeof source.getClusterExpansionZoom === 'function') {
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
     * Refresh listings from Firebase with client-side caching
     * @param forceRefresh - Force refresh even if cache is valid
     */
    async refreshListings(forceRefresh: boolean = false) {
      if (!this.map) return;

      try {
        // Check cache validity
        const now = Date.now();
        const cacheAge = now - this.listingsCacheTimestamp;
        const isCacheValid = this.listingsCache && cacheAge < this.CACHE_DURATION_MS;

        if (!forceRefresh && isCacheValid) {
          console.log(`[MapController] 📦 Using cached listings (age: ${Math.round(cacheAge / 1000)}s)`);
          this.updateMapSource(this.listingsCache);
          return;
        }

        console.log('[MapController] 🔄 Fetching fresh listings from Firebase...');
        const firebaseInit = (window as any).__initFirebase;
        if (!firebaseInit) {
          throw new Error('Firebase not initialized');
        }

        const { db } = await firebaseInit();
        const snapshot = await db.collection('listings').limit(200).get();
        
        if (!snapshot) {
          throw new Error('Failed to fetch listings from Firebase');
        }
        
        // Extract unique user IDs to fetch user profiles
        const uniqueUserIds = [...new Set(snapshot.docs.map((doc: any) => doc.data().userId).filter(Boolean))];
        
        // Fetch all user profiles in parallel
        const userProfiles: any = {};
        if (uniqueUserIds.length > 0) {
          const userPromises = uniqueUserIds.map((uid: string) => 
            db.collection('users').doc(uid).get()
              .then((userDoc: any) => ({ uid, data: userDoc.exists ? userDoc.data() : null }))
              .catch((err: any) => {
                console.warn(`[MapController] Failed to fetch user ${uid}:`, err);
                return { uid, data: null };
              })
          );
          const results = await Promise.all(userPromises);
          results.forEach(({ uid, data }: any) => {
            if (data) userProfiles[uid] = data;
          });
        }

        const features = snapshot.docs.map((doc: any) => {
          try {
            const data = doc.data() || {};
            if (typeof data.lng !== 'number' || typeof data.lat !== 'number') {
              console.warn(`[MapController] Invalid coordinates for listing ${doc.id}`);
              return null;
            }
            
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
          } catch (err) {
            console.warn(`[MapController] Error processing listing ${doc.id}:`, err);
            return null;
          }
        }).filter(Boolean);

        // Cache the results
        this.listingsCache = features;
        this.listingsCacheTimestamp = now;
        
        this.updateMapSource(features);
        console.log(`[MapController] ✅ Loaded ${features.length} listings (cached for ${this.CACHE_DURATION_MS / 1000}s)`);
      } catch (err: any) {
        console.error('[MapController] ❌ Failed to load listings:', err);
        
        // Show user-friendly error
        const errorMessage = err.message || 'Unknown error';
        if (typeof (window as any).showNotification === 'function') {
          (window as any).showNotification('Không thể tải dữ liệu tin đăng. Vui lòng thử lại sau.', 'error');
        } else {
          console.error('[MapController] Error notification handler not found');
        }
        
        // Use cached data if available as fallback
        if (this.listingsCache) {
          console.log('[MapController] 📦 Using stale cache as fallback');
          this.updateMapSource(this.listingsCache);
        }
      }
    }

    /**
     * Update map source with listing data
     */
    private updateMapSource(features: any[]) {
      try {
        const source = this.map.getSource('user-listings') as any;
        if (source && typeof source.setData === 'function') {
          source.setData({
            type: 'FeatureCollection',
            features
          });
        }
      } catch (err) {
        console.error('[MapController] Failed to update map source:', err);
      }
    }

    /**
     * Invalidate listings cache (call when user submits new listing)
     */
    invalidateListingsCache() {
      this.listingsCache = null;
      this.listingsCacheTimestamp = 0;
      console.log('[MapController] 🗑️ Cache invalidated');
    }

    /**
     * Get listing by ID from cache or Firebase
     */
    async getListingById(listingId: string): Promise<any | null> {
      try {
        // Try cache first
        if (this.listingsCache) {
          const cached = this.listingsCache.find((f: any) => f.properties.id === listingId);
          if (cached) {
            console.log('[MapController] 📦 Found listing in cache');
            return cached.properties;
          }
        }

        // Fetch from Firebase
        console.log('[MapController] 🔄 Fetching listing from Firebase...');
        const firebaseInit = (window as any).__initFirebase;
        if (!firebaseInit) {
          throw new Error('Firebase not initialized');
        }

        const { db } = await firebaseInit();
        const doc = await db.collection('listings').doc(listingId).get();
        
        if (!doc.exists) {
          console.warn('[MapController] Listing not found:', listingId);
          return null;
        }

        const data = doc.data();
        if (typeof data.lng !== 'number' || typeof data.lat !== 'number') {
          console.warn('[MapController] Invalid coordinates for listing:', listingId);
          return null;
        }

        // Get user profile
        let userName = data.userName || 'Người đăng';
        let phone = data.phone || '';
        
        if (data.userId) {
          try {
            const userDoc = await db.collection('users').doc(data.userId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              userName = userData.displayName || userName;
              phone = userData.phone || phone;
            }
          } catch (err) {
            console.warn('[MapController] Failed to fetch user profile:', err);
          }
        }

        return {
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
          status: data.status || 'approved',
          coordinates: [data.lng, data.lat]
        };
      } catch (err) {
        console.error('[MapController] Failed to get listing:', err);
        return null;
      }
    }

    /**
     * Add radius circle layer to the map
     */
    private addRadiusCircleLayer() {
      if (!this.map || this.map.getSource('parcel-radius')) return;

      // Add source for radius circle
      this.map.addSource('parcel-radius', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add fill layer with light blue color
      this.map.addLayer({
        id: 'parcel-radius-fill',
        type: 'fill',
        source: 'parcel-radius',
        paint: {
          'fill-color': 'rgba(59, 130, 246, 0.1)',
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.8,
            18, 0.5
          ]
        },
        layout: {
          'visibility': 'visible'
        }
      });

      // Add dashed border layer
      this.map.addLayer({
        id: 'parcel-radius-border',
        type: 'line',
        source: 'parcel-radius',
        paint: {
          'line-color': 'rgba(59, 130, 246, 0.8)',
          'line-width': 2,
          'line-dasharray': [3, 3],
          'line-opacity': 1
        },
        layout: {
          'visibility': 'visible'
        }
      });

      // Add transition for smooth animations
      if (this.map.setPaintProperty) {
        this.map.setPaintProperty('parcel-radius-fill', 'fill-opacity-transition', {
          duration: 300,
          delay: 0
        });
        this.map.setPaintProperty('parcel-radius-border', 'line-opacity-transition', {
          duration: 300,
          delay: 0
        });
      }
    }

    /**
     * Draw radius circle around a point
     * @param center - Center coordinates [lng, lat]
     * @param radius - Radius in meters (100-2000m)
     */
    drawRadiusCircle(center: [number, number], radius: number) {
      if (!this.map) return;

      // Validate radius parameter
      const MIN_RADIUS = 100;
      const MAX_RADIUS = 2000;
      const validRadius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius));
      
      if (validRadius !== radius) {
        console.warn(`[MapController] Radius ${radius}m out of range, clamped to ${validRadius}m`);
      }

      const turf = (window as any).turf;
      if (!turf) {
        console.error('[MapController] Turf.js not loaded');
        return;
      }

      try {
        // Create circle using Turf.js
        const circle = turf.circle(center, validRadius, { steps: 64, units: 'meters' });
        
        const source = this.map.getSource('parcel-radius') as any;
        if (source && typeof source.setData === 'function') {
          source.setData({
            type: 'FeatureCollection',
            features: [circle]
          });
        }
      } catch (err) {
        console.error('[MapController] Failed to draw radius circle:', err);
      }
    }

    /**
     * Clear radius circle from the map
     */
    clearRadiusCircle() {
      if (!this.map) return;

      try {
        const source = this.map.getSource('parcel-radius') as any;
        if (source && typeof source.setData === 'function') {
          source.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      } catch (err) {
        console.error('[MapController] Failed to clear radius circle:', err);
      }
    }
};
