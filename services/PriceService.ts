
import { ParcelData } from '../types';

export class PriceService {
  // Mock logic: In a real app, this would query a complex table based on street name and area
  static calculateTotalValue(parcel: ParcelData): number {
    // Fix: Using dien_tich and a mock unit price (45,000,000 VND/m2) consistent with App.tsx
    // Property 'dienTich' was changed to 'dien_tich' and 'giaNhaNuoc' was replaced as it doesn't exist.
    return (parcel.dien_tich || 0) * 45000000;
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
