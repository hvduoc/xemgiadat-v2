/**
 * Dashboard Page
 * The main map view with search overlay
 * 
 * Contains:
 * - Full-screen MapViewer
 * - SearchBar overlay
 * - Optional: Selected parcel info card
 */

import React, { useState, useEffect } from 'react';
import type { LandParcel } from '@/types';
import MapViewer from '@/components/Map/MapViewer';
import SearchBar from '@/components/Search/SearchBar';
import * as storage from '@/utils/storage';

export const Dashboard: React.FC = () => {
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleParcelSelect = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setIsSaved(storage.hasAsset(parcel.id));
    console.log('[Dashboard] Selected parcel:', parcel.id);
  };

  // Listen for parcel:selected events from MapController click handler
  useEffect(() => {
    const handleParcelSelectedEvent = (event: Event) => {
      const customEvent = event as CustomEvent<LandParcel>;
      console.log('[Dashboard] parcel:selected event received:', customEvent.detail.id);
      handleParcelSelect(customEvent.detail);
    };

    window.addEventListener('parcel:selected', handleParcelSelectedEvent);
    return () => {
      window.removeEventListener('parcel:selected', handleParcelSelectedEvent);
    };
  }, []);

  const handleSaveParcel = () => {
    if (!selectedParcel) return;
    
    const success = storage.saveAsset(selectedParcel);
    if (success) {
      setIsSaved(true);
      console.log('[Dashboard] Parcel saved:', selectedParcel.id);
    }
  };

  const handleRemoveParcel = () => {
    if (!selectedParcel) return;
    
    const success = storage.removeAsset(selectedParcel.id);
    if (success) {
      setIsSaved(false);
      console.log('[Dashboard] Parcel removed:', selectedParcel.id);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Viewer */}
      <MapViewer
        containerId="main-map"
        className="w-full h-full"
        onMapReady={() => {
          console.log('[Dashboard] Map ready');
        }}
      />

      {/* Search Bar Overlay */}
      <SearchBar onParcelSelect={handleParcelSelect} />

      {/* Selected Parcel Info Card */}
      {selectedParcel && (
        <div className="absolute bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-20 animate-slide-up">
          {/* Header */}
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Tờ {selectedParcel.so_to} - Thửa {selectedParcel.so_thua}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{selectedParcel.dia_chi}</p>
          </div>

          {/* Details */}
          <div className="py-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Diện tích</span>
              <span className="font-semibold text-gray-900">
                {selectedParcel.dien_tich.toLocaleString()} m²
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Loại đất</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {selectedParcel.loai_dat}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Tọa độ</span>
              <span className="text-xs text-gray-600">
                {selectedParcel.coordinates[0].toFixed(4)}, {selectedParcel.coordinates[1].toFixed(4)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex gap-2">
            {isSaved ? (
              <button
                onClick={handleRemoveParcel}
                className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 
                         font-medium text-sm transition-colors"
              >
                Xóa Khỏi Portfolio
              </button>
            ) : (
              <button
                onClick={handleSaveParcel}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         font-medium text-sm transition-colors"
              >
                Lưu Vào Portfolio
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
