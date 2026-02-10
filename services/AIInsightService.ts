/**
 * AIInsightService - Provides AI-powered price insights for parcels
 */
class AIInsightService {
  private static priceData: any = null;
  private static dataLoaded: boolean = false;

  /**
   * Initialize and load price data
   */
  static async init() {
    if (this.dataLoaded) return;
    
    // Data is now sharded per-commune — no monolithic file to load
    // Price insights use hardcoded heuristics (area average not available in shards)
    this.dataLoaded = true;
    console.log('[AIInsight] Initialized (sharded mode — no monolithic index)');
  }

  /**
   * Calculate average price per m² for a specific area
   */
  static getAreaAveragePrice(maXa: string): number | null {
    if (!this.priceData || !Array.isArray(this.priceData)) return null;

    const relevantParcels = this.priceData.filter((p: any) => p.ma_xa === maXa);
    if (relevantParcels.length === 0) return null;

    const prices = relevantParcels
      .map((p: any) => p.gia_uoc_tinh)
      .filter((price: number) => price > 0);

    if (prices.length === 0) return null;

    const total = prices.reduce((sum: number, price: number) => sum + price, 0);
    return total / prices.length;
  }

  /**
   * Get AI-powered price insight for a parcel
   */
  static getPriceInsight(parcel: {
    dien_tich: number;
    gia_uoc_tinh?: number;
    ma_xa: string;
  }): {
    type: 'good' | 'high' | 'potential' | 'unknown';
    message: string;
    badge: string;
  } {
    // If no price available, return unknown
    if (!parcel.gia_uoc_tinh || parcel.gia_uoc_tinh <= 0) {
      return {
        type: 'unknown',
        message: 'Chưa có đủ dữ liệu để đánh giá',
        badge: 'Đang cập nhật'
      };
    }

    const pricePerM2 = parcel.gia_uoc_tinh / parcel.dien_tich;
    const areaAverage = this.getAreaAveragePrice(parcel.ma_xa);

    // If no comparison data available
    if (!areaAverage) {
      // Use general heuristics based on total price
      if (parcel.gia_uoc_tinh < 500000000) { // < 500M
        return {
          type: 'good',
          message: 'Giá phù hợp với thị trường, tiềm năng đầu tư tốt',
          badge: 'Giá tốt'
        };
      } else if (parcel.gia_uoc_tinh > 2000000000) { // > 2B
        return {
          type: 'high',
          message: 'Mức giá cao, phù hợp với nhà đầu tư chuyên nghiệp',
          badge: 'Cao cấp'
        };
      } else {
        return {
          type: 'potential',
          message: 'Vị trí đẹp, giá hợp lý cho đầu tư dài hạn',
          badge: 'Tiềm năng'
        };
      }
    }

    // Compare with area average
    const avgPricePerM2 = areaAverage / 100; // Estimate average parcel size
    const priceDiff = ((pricePerM2 - avgPricePerM2) / avgPricePerM2) * 100;

    if (priceDiff < -10) {
      return {
        type: 'good',
        message: `Giá thấp hơn trung bình khu vực ${Math.abs(priceDiff).toFixed(0)}%, cơ hội đầu tư tốt`,
        badge: 'Giá tốt'
      };
    } else if (priceDiff > 20) {
      return {
        type: 'high',
        message: `Giá cao hơn trung bình khu vực ${priceDiff.toFixed(0)}%, vị trí đắc địa`,
        badge: 'Cao cấp'
      };
    } else {
      return {
        type: 'potential',
        message: 'Giá phù hợp với thị trường, đáng để xem xét',
        badge: 'Hợp lý'
      };
    }
  }

  /**
   * Get listing price insight
   */
  static getListingInsight(listing: {
    dien_tich: number;
    priceValue: number;
    isNegotiable: boolean;
  }): {
    type: 'good' | 'high' | 'potential' | 'unknown';
    message: string;
    badge: string;
  } {
    if (!listing.priceValue || listing.priceValue <= 0) {
      if (listing.isNegotiable) {
        return {
          type: 'potential',
          message: 'Giá có thể thương lượng, liên hệ để biết thêm chi tiết',
          badge: 'Thương lượng'
        };
      }
      return {
        type: 'unknown',
        message: 'Liên hệ chủ nhà để biết giá chính xác',
        badge: 'Liên hệ'
      };
    }

    const pricePerM2 = listing.priceValue / listing.dien_tich;

    // Price per m² thresholds for Da Nang
    if (pricePerM2 < 5000000) { // < 5M/m²
      return {
        type: 'good',
        message: 'Mức giá rất hợp lý, nên xem xét đầu tư ngay',
        badge: 'Giá tốt'
      };
    } else if (pricePerM2 < 15000000) { // 5-15M/m²
      return {
        type: 'potential',
        message: 'Giá phù hợp với thị trường, đáng để khảo sát kỹ',
        badge: 'Hợp lý'
      };
    } else if (pricePerM2 < 30000000) { // 15-30M/m²
      return {
        type: 'high',
        message: 'Vị trí đắc địa, phù hợp kinh doanh hoặc đầu tư cao cấp',
        badge: 'Cao cấp'
      };
    } else {
      return {
        type: 'high',
        message: 'Bất động sản hạng sang, khu vực trung tâm hoặc mặt tiền',
        badge: 'Hạng sang'
      };
    }
  }

  /**
   * Get status badges for parcel/listing
   */
  static getStatusBadges(item: any): string[] {
    const badges: string[] = [];

    // Check if newly listed (if we have createdAt timestamp)
    if (item.createdAt) {
      const daysSinceCreated = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) {
        badges.push('Mới đăng');
      }
    }

    // Check if verified (GIS data is always verified)
    if (item.so_thua && item.so_to) {
      badges.push('Đã xác thực');
    }

    // Add price insight badge
    const insight = item.priceValue 
      ? this.getListingInsight(item)
      : this.getPriceInsight(item);
    
    if (insight.badge && !badges.includes(insight.badge)) {
      badges.push(insight.badge);
    }

    return badges.slice(0, 3); // Max 3 badges
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  (window as any).AIInsightService = AIInsightService;
  AIInsightService.init();
}
