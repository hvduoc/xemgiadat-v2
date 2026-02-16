import type { LandParcel } from '@/types';
import { initFirebase } from '@/config/firebase';

type ListingInput = {
  parcel: LandParcel;
  userId: string;
  loaiGiaoDich: string;
  priceValue: number;
  priceUnit: string;
  isNegotiable: boolean;
  note?: string;
};

export const ListingService = {
  async createListing(input: ListingInput): Promise<string> {
    const { db } = await initFirebase();

    const payload = {
      userId: input.userId,
      so_to: String(input.parcel.so_to),
      so_thua: String(input.parcel.so_thua),
      dien_tich: input.parcel.dien_tich,
      loaiGiaoDich: input.loaiGiaoDich,
      priceValue: input.isNegotiable ? 0 : input.priceValue,
      priceUnit: input.isNegotiable ? 'VND/m2' : input.priceUnit,
      isNegotiable: input.isNegotiable,
      note: input.note || '',
      status: 'approved',
      lat: input.parcel.coordinates[1],
      lng: input.parcel.coordinates[0],
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('listings').add(payload);
    return docRef.id;
  }
};
