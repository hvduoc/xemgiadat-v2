import type { LandParcel } from '@/types';

export const LinkService = {
  generateShareLink(parcel: LandParcel): string {
    const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const params = new URLSearchParams({
      so_to: String(parcel.so_to),
      so_thua: String(parcel.so_thua),
      lat: String(parcel.coordinates[1]),
      lng: String(parcel.coordinates[0])
    });

    return `${baseUrl}?${params.toString()}`;
  }
};
