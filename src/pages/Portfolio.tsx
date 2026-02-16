/**
 * Portfolio Page
 * Display saved land parcels
 * 
 * Features:
 * - Table view of saved parcels
 * - Delete action with confirmation
 * - Empty state
 */

import React, { useState, useEffect } from 'react';
import { Trash2, MapPin } from 'lucide-react';
import type { LandParcel } from '@/types';
import * as storage from '@/utils/storage';
import { mapController } from '@/services/MapController';

export const Portfolio: React.FC = () => {
  const [portfolioItems, setPortfolioItems] = useState<LandParcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load portfolio items on mount
   */
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const items = storage.getAssets();
        setPortfolioItems(items);
        console.log('[Portfolio] Loaded', items.length, 'items');
      } catch (error) {
        console.error('[Portfolio] Error loading portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolio();
  }, []);

  /**
   * Handle delete action
   */
  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa thửa đất này khỏi portfolio?'
    );

    if (!confirmed) return;

    const success = storage.removeAsset(id);
    if (success) {
      setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
      console.log('[Portfolio] Deleted:', id);
    }
  };

  /**
   * Handle view on map
   */
  const handleViewOnMap = (parcel: LandParcel) => {
    mapController.highlightParcel(parcel);
    console.log('[Portfolio] Viewing on map:', parcel.id);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải Portfolio...</p>
        </div>
      </div>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Portfolio Trống
          </h2>
          <p className="text-gray-600 mt-2 max-w-sm">
            Chưa có thửa đất nào được lưu. Tìm kiếm và lưu các thửa đất quan tâm
            trên bản đồ để xây dựng portfolio của bạn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-3xl font-bold text-gray-900">Tài Sản Của Tôi</h1>
        <p className="text-gray-600 mt-2">
          Bạn có <span className="font-semibold text-blue-600">{portfolioItems.length}</span> thửa đất
          được lưu
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-8 py-4 font-semibold text-gray-900 text-sm">
                Tờ/Thửa
              </th>
              <th className="px-8 py-4 font-semibold text-gray-900 text-sm">
                Địa Chỉ
              </th>
              <th className="px-8 py-4 font-semibold text-gray-900 text-sm">
                Diện Tích
              </th>
              <th className="px-8 py-4 font-semibold text-gray-900 text-sm">
                Loại Đất
              </th>
              <th className="px-8 py-4 font-semibold text-gray-900 text-sm">
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {portfolioItems.map((parcel, index) => (
              <tr
                key={parcel.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-8 py-4 text-gray-900 font-semibold">
                  {parcel.so_to}:{parcel.so_thua}
                </td>
                <td className="px-8 py-4 text-gray-600 text-sm">
                  {parcel.dia_chi}
                </td>
                <td className="px-8 py-4 text-gray-900">
                  {parcel.dien_tich.toLocaleString()} m²
                </td>
                <td className="px-8 py-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {parcel.loai_dat}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOnMap(parcel)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 
                               font-medium text-sm transition-colors"
                      title="Xem trên bản đồ"
                    >
                      Xem Bản Đồ
                    </button>
                    <button
                      onClick={() => handleDelete(parcel.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg 
                               transition-colors"
                      title="Xóa khỏi portfolio"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
