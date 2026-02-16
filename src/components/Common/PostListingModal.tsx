import React, { useMemo, useState } from 'react';
import type { LandParcel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ListingService } from '@/services/ListingService';

interface PostListingModalProps {
  open: boolean;
  onClose: () => void;
  selectedParcel: LandParcel | null;
}

export const PostListingModal: React.FC<PostListingModalProps> = ({
  open,
  onClose,
  selectedParcel,
}) => {
  const { user } = useAuth();
  const [loaiGiaoDich, setLoaiGiaoDich] = useState('ban');
  const [priceValue, setPriceValue] = useState('');
  const [priceUnit, setPriceUnit] = useState('VND/m2');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!user || !selectedParcel) return false;
    if (isNegotiable) return true;
    const numericPrice = Number(priceValue);
    return Number.isFinite(numericPrice) && numericPrice > 0;
  }, [user, selectedParcel, isNegotiable, priceValue]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selectedParcel) {
      setStatusMessage('Vui long dang nhap va chon thua dat.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await ListingService.createListing({
        parcel: selectedParcel,
        userId: user.id,
        loaiGiaoDich,
        priceValue: Number(priceValue),
        priceUnit,
        isNegotiable,
        note,
      });

      setStatusMessage('Dang tin thanh cong.');
    } catch (error) {
      console.error('[PostListingModal] create listing failed:', error);
      setStatusMessage('Khong the dang tin. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
          aria-label="Close post listing"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-gray-900">Dang tin bat dong san</h2>
        <p className="text-sm text-gray-600 mb-4">
          {selectedParcel
            ? `To ${selectedParcel.so_to} - Thua ${selectedParcel.so_thua}`
            : 'Chua co thua dat duoc chon.'}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loai giao dich</label>
            <select
              value={loaiGiaoDich}
              onChange={(event) => setLoaiGiaoDich(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ban">Ban</option>
              <option value="cho-thue">Cho thue</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="negotiable"
              type="checkbox"
              checked={isNegotiable}
              onChange={(event) => setIsNegotiable(event.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="negotiable" className="text-sm text-gray-700">
              Gia thuong luong
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Gia</label>
              <input
                type="number"
                value={priceValue}
                onChange={(event) => setPriceValue(event.target.value)}
                disabled={isNegotiable}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Don vi</label>
              <input
                type="text"
                value={priceUnit}
                onChange={(event) => setPriceUnit(event.target.value)}
                disabled={isNegotiable}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ghi chu</label>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {statusMessage && (
            <div className="text-sm text-blue-600">{statusMessage}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Dang gui...' : 'Dang tin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostListingModal;
