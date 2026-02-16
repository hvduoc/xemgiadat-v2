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
import { LinkService } from '@/services/LinkService';

export const Dashboard: React.FC = () => {
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);

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

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2000);
  };

  const handleShare = () => {
    if (!selectedParcel) return;
    const link = LinkService.generateShareLink(selectedParcel);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(shareUrl, '_blank', 'noopener');
  };

  const handleCopyLink = async () => {
    if (!selectedParcel) return;
    const link = LinkService.generateShareLink(selectedParcel);

    try {
      await navigator.clipboard.writeText(link);
      showToast('Da sao chep lien ket');
    } catch (error) {
      console.warn('[Dashboard] Clipboard copy failed:', error);
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Da sao chep lien ket');
    }
  };

  const handleDirections = () => {
    if (!selectedParcel) return;
    const [lng, lat] = selectedParcel.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener');
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

          <div className="pt-4 grid grid-cols-2 gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 text-xs font-semibold"
            >
              Chia se
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 text-xs font-semibold"
            >
              Copy link
            </button>
            <button
              onClick={handleDirections}
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-xs font-semibold"
            >
              Chi duong
            </button>
            <button
              onClick={() => setIsStreetViewOpen(true)}
              className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs font-semibold"
            >
              Street View
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="absolute bottom-6 left-6 z-30 bg-black/80 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}

      {isStreetViewOpen && selectedParcel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-4 relative">
            <button
              onClick={() => setIsStreetViewOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
              aria-label="Close Street View"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Street View</h3>
            <iframe
              title="Street View"
              className="w-full h-[60vh] rounded-lg border"
              src={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedParcel.coordinates[1]},${selectedParcel.coordinates[0]}`}
              loading="lazy"
            />
            <a
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedParcel.coordinates[1]},${selectedParcel.coordinates[0]}`}
              target="_blank"
              rel="noopener"
            >
              Mo Street View trong tab moi
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
