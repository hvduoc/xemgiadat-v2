/**
 * MapViewer Component
 * Thin React wrapper for MapController
 * 
 * Responsibilities:
 * - Renders map container div
 * - Initializes MapController on mount
 * - Cleans up resources on unmount
 * 
 * NOTE: All map logic is delegated to MapController service,
 * NOT implemented here. This keeps separation of concerns.
 */

import React, { useEffect, useRef } from 'react';
import { mapController } from '@/services/MapController';

interface MapViewerProps {
  containerId?: string;
  onMapReady?: () => void;
  className?: string;
}

/**
 * MapViewer - React functional component for map display
 * 
 * Usage:
 *   <MapViewer 
 *     containerId="map-container"
 *     onMapReady={() => console.log('Map ready!')}
 *     className="w-full h-full"
 *   />
 */
export const MapViewer: React.FC<MapViewerProps> = ({
  containerId = 'map-container',
  onMapReady,
  className = 'w-full h-full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Initialize map (idempotent - safe to call multiple times)
        if (!mapController.isReady()) {
          await mapController.initialize(containerId);
          console.log('[MapViewer] ✓ Map initialization successful');
        }

        // Callback when map is ready
        if (onMapReady) {
          onMapReady();
        }
      } catch (error) {
        console.error('[MapViewer] Map initialization failed:', error);
        // Optionally: display error message to user (toast, alert, etc.)
      }
    };

    // Cache the initialization promise to avoid re-running on re-renders
    if (!initPromiseRef.current) {
      initPromiseRef.current = initializeMap();
    }

    return () => {
      // Cleanup on unmount
      // NOTE: We do NOT call mapController.destroy() here because:
      // 1. MapController is a singleton (used globally)
      // 2. Destroying on component unmount would break other components
      // 3. Cleanup happens at app shutdown, not component unmount
      console.log('[MapViewer] Unmounted (map persists for other components)');
    };
  }, [containerId, onMapReady]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#f0f0f0',
      }}
      data-testid="map-viewer"
    >
      {/* Loading state placeholder */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 0.3,
        }}
      >
        <p className="text-gray-500">Initializing map...</p>
      </div>
    </div>
  );
};

export default MapViewer;
