
const React = (window as any).React;
const { useEffect, useRef, useState, useMemo } = React;
const lucide = (window as any).lucideReact || {};
const {
  MapPin,
  Share2,
  X,
  ChevronUp,
  Copy,
  Rocket,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Banknote,
  Send,
  FileText,
  Info,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Eye,
  Box,
  Wrench,
  Coffee,
  Video,
  Scissors,
  QrCode
} = lucide;

const App = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const MapController = (window as any).MapController;
  const controller = useMemo(() => {
    const instance = new MapController();
    MapController.setInstance(instance);
    return instance;
  }, []);
    const [searchService, setSearchService] = useState<any>(null);
  
  const [selectedParcel, setSelectedParcel] = useState(null as ParcelData | null);
  const [selectedListing, setSelectedListing] = useState(null as ListingData | null);
  const [view, setView] = useState('info' as 'info' | 'listing' | 'success' | 'listing-detail');
  const [panelState, setPanelState] = useState('expanded' as 'peek' | 'expanded');
  const [is3DView, setIs3DView] = useState(false);
  
  // Monetization modals
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ParcelData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
  
  const [listingForm, setListingForm] = useState({
    price: '',
    phone: '',
    note: '',
    images: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const LinkService = (window as any).LinkService;
    const PriceService = (window as any).PriceService;
      const SearchService = (window as any).SearchService;
    const initial = LinkService.getParams();
    
    controller.init(
      mapContainerRef.current, 
      initial, 
      (data: any) => {
        // Parcel click handler
        const parcel: ParcelData = {
          id: data.id || data.OBJECTID,
          so_thua: data['Số thửa'] || data.so_thua || 'N/A',
          so_to: data['Số hiệu tờ bản đồ'] || data.so_to || 'N/A',
          dien_tich: Number(data['Diện tích'] || data.dien_tich || 0),
          muc_dich: data['Ký hiệu mục đích sử dụng'] || data.muc_dich || 'N/A',
          ma_xa: data['Mã xã'] || data.ma_xa || 'N/A',
          dia_chi: data['Địa chỉ'] !== 'Null' ? data['Địa chỉ'] : 'TP. Đà Nẵng',
          coordinates: data.coordinates,
        };
        
        parcel.gia_uoc_tinh = PriceService.calculateTotalValue(parcel);
        setSelectedParcel(parcel);
        setSelectedListing(null);
        setView('info');
        setPanelState('expanded');
        
        // Reset form khi chọn thửa mới
        setListingForm({ price: '', phone: '', note: '', images: [] });
        
        // Close search dropdown
        setSearchQuery('');
        setSearchResults([]);
      },
      (listingData: ListingData) => {
        // Listing click handler
        setSelectedListing(listingData);
        setSelectedParcel(null);
        setView('listing-detail');
        setPanelState('expanded');
        
        // Close search dropdown
        setSearchQuery('');
        setSearchResults([]);
      }
    );
    
    // Handle deep link for listings
    if (initial.listingId) {
      console.log('[App] Loading listing from deep link:', initial.listingId);
      controller.getListingById(initial.listingId).then((listing: ListingData | null) => {
        if (listing) {
          setSelectedListing(listing);
          setSelectedParcel(null);
          setView('listing-detail');
          setPanelState('expanded');
          
          // Fly to listing location
          if (listing.coordinates) {
            controller.flyToCoordinates(listing.coordinates[0], listing.coordinates[1], 18);
          }
        } else {
          console.warn('[App] Listing not found:', initial.listingId);
        }
      });
    }
    
      // Khởi tạo SearchService sau khi map đã load
      const service = new SearchService(controller);
      setSearchService(service);
    
      return () => {
        service?.terminate();
      };
  }, [controller]);

  // Haptic feedback simulation
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    // Try native vibration API
    if ('vibrate' in navigator) {
      const durations = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(durations[type]);
    }
    
    // Visual feedback through CSS animation
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.style.transform = 'scale(0.95)';
      setTimeout(() => {
        activeElement.style.transform = '';
      }, 100);
    }
  };

  // Toggle 3D view
  const toggle3DView = () => {
    const map = controller.getMap();
    if (!map) return;

    triggerHaptic('medium');
    
    if (!is3DView) {
      // Switch to 3D view
      map.easeTo({
        pitch: 60,
        bearing: -20,
        duration: 1000
      });
      setIs3DView(true);
    } else {
      // Switch back to 2D view
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
      setIs3DView(false);
    }
  };

  // Get AI insight for current parcel
  const getAIInsight = () => {
    const AIInsightService = (window as any).AIInsightService;
    if (!AIInsightService) return null;

    if (selectedParcel) {
      return AIInsightService.getPriceInsight(selectedParcel);
    } else if (selectedListing) {
      return AIInsightService.getListingInsight(selectedListing);
    }
    return null;
  };

  // Get status badges
  const getStatusBadges = () => {
    const AIInsightService = (window as any).AIInsightService;
    if (!AIInsightService) return [];

    const item = selectedParcel || selectedListing;
    if (!item) return [];

    return AIInsightService.getStatusBadges(item);
  };

    const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim() || !searchService) return;
    
      setIsSearching(true);
      try {
        const results = await searchService.searchParcels(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const handleSelectSearchResult = async (parcel: ParcelData) => {
      // Calculate price
      const PriceService = (window as any).PriceService;
      parcel.gia_uoc_tinh = PriceService.calculateTotalValue(parcel);
      
      // Set selected parcel immediately to open Bottom Sheet
      setSelectedParcel(parcel);
      setView('info');
      setPanelState('expanded');
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      
      // Fly to parcel location
      await controller.flyToParcel(parcel.so_to, parcel.so_thua);
    };

  const handleImageUpload = async (e: any) => {
    if (e.target.files) {
      // Fix: Cast Array.from result to File[] to ensure the map function receives typed File objects
      const ImageService = (window as any).ImageService;
      const files: File[] = Array.from(e.target.files);
      const compressed = await Promise.all(
        files.slice(0, 5).map((file: File) => ImageService.compressImage(file, 0.6, 1000))
      );
      setListingForm(prev => ({ ...prev, images: [...prev.images, ...compressed] }));
    }
  };

  const submitListing = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setView('success');
    setIsSubmitting(false);
    setTimeout(() => {
      setSelectedParcel(null);
      setView('info');
    }, 3000);
  };
  
  // Monetization handlers
  const handleVIPService = (service: string) => {
    const item = selectedParcel || selectedListing;
    const location = item ? `Tờ ${item.so_to}, Thửa ${item.so_thua}` : 'Vị trí chưa xác định';
    const zaloLink = `https://zalo.me/0123456789?text=${encodeURIComponent(`Xin chào! Tôi muốn sử dụng dịch vụ: ${service} cho ${location}`)}`;
    window.open(zaloLink, '_blank');
    setShowVIPModal(false);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
        {/* Search Bar with Glassmorphism */}
        <div className="absolute top-4 left-4 right-4 z-50">
          <form onSubmit={handleSearch} className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20">
            <div className="flex items-center px-4 py-3">
              <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.3-4.3" strokeWidth="2"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm số tờ, số thửa..."
                className="flex-1 outline-none text-slate-900 font-semibold placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="ml-2 p-1">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>
          
            {/* Search Results Dropdown */}
            {(isSearching || searchResults.length > 0) && (
              <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                    <p className="mt-2 text-sm">Đang tìm kiếm...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-500 text-sm">
                    Không tìm thấy kết quả. Hãy zoom ra hoặc pan map.
                  </div>
                ) : (
                  searchResults.map((parcel, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(parcel)}
                      className="w-full px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">
                            Tờ {parcel.so_to} / Thửa {parcel.so_thua}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {parcel.dia_chi} • {parcel.dien_tich} m²
                          </p>
                        </div>
                        <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </form>
        </div>

        {/* 3D View Toggle Button */}
        <div className="absolute bottom-28 right-4 z-50 flex flex-col gap-3">
          <button
            onClick={toggle3DView}
            className={`backdrop-blur-xl ${is3DView ? 'bg-blue-600/90' : 'bg-white/90'} 
              rounded-2xl shadow-2xl border ${is3DView ? 'border-blue-400/20' : 'border-white/20'} 
              p-4 transition-all duration-300 active:scale-95 hover:scale-105`}
            aria-label={is3DView ? 'Chuyển về 2D' : 'Chuyển sang 3D'}
          >
            <Box className={`w-6 h-6 ${is3DView ? 'text-white' : 'text-slate-700'}`} />
            <div className={`text-xs font-bold mt-1 ${is3DView ? 'text-white' : 'text-slate-700'}`}>
              {is3DView ? '2D' : '3D'}
            </div>
          </button>
          
          {/* Coffee Button */}
          <button
            onClick={() => setShowCoffeeModal(true)}
            className="backdrop-blur-xl bg-amber-600/90 rounded-2xl shadow-2xl border border-amber-400/20 p-4 transition-all duration-300 active:scale-95 hover:scale-105"
            aria-label="Mời cà phê"
          >
            <Coffee className="w-6 h-6 text-white" />
            <div className="text-xs font-bold mt-1 text-white">Cà phê</div>
          </button>
        </div>

      <div ref={mapContainerRef} className="w-full h-full" />

      {(selectedParcel || selectedListing) && (
        <div className={`absolute bottom-0 inset-x-0 z-[100] transition-all duration-300 ease-out transform
          ${panelState === 'expanded' ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}
        `}>
          <div className="max-w-xl mx-auto backdrop-blur-2xl bg-white/95 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] pb-safe border-t border-white/20">
            {/* Handle Bar */}
            <div 
              className="h-10 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => setPanelState(panelState === 'peek' ? 'expanded' : 'peek')}
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            <div className="px-6 pb-8 overflow-y-auto max-h-[85vh] scrollbar-hide">
              {view === 'info' && selectedParcel && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Status Badges */}
                  {getStatusBadges().length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {getStatusBadges().map((badge, i) => (
                        <span 
                          key={i}
                          className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm
                            ${badge.includes('Giá tốt') || badge.includes('Hợp lý') ? 'bg-green-100 text-green-700 border border-green-200' :
                              badge.includes('Cao cấp') || badge.includes('Hạng sang') ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              badge.includes('Mới đăng') ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              badge.includes('Đã xác thực') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'}
                          `}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">
                        Thửa {selectedParcel.so_thua} <span className="text-slate-300">/ Tờ {selectedParcel.so_to}</span>
                      </h2>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-red-500" /> {selectedParcel.dia_chi}
                      </p>
                    </div>
                    <button onClick={() => setSelectedParcel(null)} className="p-2 bg-slate-100 rounded-full">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diện tích</p>
                      <p className="text-lg font-black text-slate-800">{selectedParcel.dien_tich} m²</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Loại đất</p>
                      <p className="text-lg font-black text-slate-800">{selectedParcel.muc_dich}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl mb-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Giá nhà nước 2025</span>
                      <p className="text-3xl font-black text-yellow-700 leading-none mt-1">
                        {((window as any).PriceService).formatCurrency(selectedParcel.gia_uoc_tinh || 0)}
                      </p>
                    </div>
                    <Info className="w-6 h-6 text-yellow-400" />
                  </div>

                  {/* AI Insights Section */}
                  {getAIInsight() && (
                    <div className="backdrop-blur-sm bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-5 rounded-2xl mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">AI Đánh giá</span>
                      </div>
                      <div className="flex items-start gap-3">
                        {getAIInsight()?.type === 'good' && <TrendingDown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                        {getAIInsight()?.type === 'high' && <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />}
                        {getAIInsight()?.type === 'potential' && <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {getAIInsight()?.message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { triggerHaptic('medium'); setView('listing'); }}
                      className="w-full h-16 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:shadow-2xl"
                    >
                      <Rocket className="w-6 h-6 text-yellow-400" /> Rao bán lô này
                    </button>
                    
                    {/* VIP Service Button */}
                    <button 
                      onClick={() => { triggerHaptic('medium'); setShowVIPModal(true); }}
                      className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all hover:shadow-xl"
                    >
                      <Wrench className="w-5 h-5" /> Yêu cầu Dịch vụ
                    </button>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => triggerHaptic('light')}
                        className="flex-1 backdrop-blur-sm bg-slate-100/80 text-slate-700 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Share2 className="w-4 h-4" /> Chia sẻ
                      </button>
                      <button 
                        onClick={() => triggerHaptic('light')}
                        className="flex-1 backdrop-blur-sm bg-slate-100/80 text-slate-700 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Copy className="w-4 h-4" /> Tọa độ
                      </button>
                    </div>
                    
                    {/* Advertising Placeholder */}
                    <div className="mt-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 font-medium">📢 Liên hệ quảng cáo tại đây</p>
                    </div>
                  </div>
                </div>
              )}

              {view === 'listing' && selectedParcel && (
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('info')} className="p-2 bg-slate-100 rounded-full">
                      <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900">Chi tiết rao bán</h2>
                  </div>

                  <div className="space-y-4">
                    {/* GIS Verified Data - Read Only */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dữ liệu GIS xác thực</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                         <div><p className="text-[9px] text-slate-400 font-bold uppercase">Tờ</p><p className="font-black text-slate-700">{selectedParcel.so_to}</p></div>
                         <div><p className="text-[9px] text-slate-400 font-bold uppercase">Thửa</p><p className="font-black text-slate-700">{selectedParcel.so_thua}</p></div>
                         <div><p className="text-[9px] text-slate-400 font-bold uppercase">DT (m²)</p><p className="font-black text-slate-700">{selectedParcel.dien_tich}</p></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Giá bán (VNĐ)</label>
                        <div className="relative">
                          <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="number" 
                            className="w-full h-14 bg-white border border-slate-200 rounded-xl pl-11 pr-4 font-bold outline-none focus:border-blue-500"
                            placeholder="Nhập giá..."
                            value={listingForm.price}
                            onChange={e => setListingForm({...listingForm, price: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">SĐT liên hệ</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            className="w-full h-14 bg-white border border-slate-200 rounded-xl pl-11 pr-4 font-bold outline-none focus:border-blue-500"
                            placeholder="09xxx..."
                            value={listingForm.phone}
                            onChange={e => setListingForm({...listingForm, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Ghi chú (Tùy chọn)</label>
                      <textarea 
                        className="w-full h-24 bg-white border border-slate-200 rounded-xl p-4 font-medium text-sm outline-none focus:border-blue-500 resize-none"
                        placeholder="Mô tả ưu điểm thửa đất, hướng, pháp lý..."
                        value={listingForm.note}
                        onChange={e => setListingForm({...listingForm, note: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-2 block">Hình ảnh thực tế ({listingForm.images.length}/5)</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {listingForm.images.length < 5 && (
                          <label className="w-20 h-20 shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                            <Camera className="w-5 h-5 text-slate-400" />
                            <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </label>
                        )}
                        {listingForm.images.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 shrink-0">
                            <img src={img} className="w-full h-full object-cover rounded-2xl border border-slate-100" />
                            <button onClick={() => setListingForm({...listingForm, images: listingForm.images.filter((_, idx) => idx !== i)})} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg">
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={submitListing}
                      disabled={isSubmitting || !listingForm.phone || !listingForm.price}
                      className={`w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all
                        ${isSubmitting || !listingForm.phone || !listingForm.price ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-xl active:scale-95'}
                      `}
                    >
                      {isSubmitting ? 'Đang đăng tin...' : <><Send className="w-5 h-5" /> Hoàn tất đăng tin</>}
                    </button>
                  </div>
                </div>
              )}

              {view === 'listing-detail' && selectedListing && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Status Badges */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {getStatusBadges().map((badge, i) => (
                      <span 
                        key={i}
                        className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm
                          ${badge.includes('Giá tốt') || badge.includes('Hợp lý') ? 'bg-green-100 text-green-700 border border-green-200' :
                            badge.includes('Cao cấp') || badge.includes('Hạng sang') ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            badge.includes('Mới đăng') ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            badge.includes('Đã xác thực') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'}
                        `}
                      >
                        {badge}
                      </span>
                    ))}
                    {/* Old Listing Badge */}
                    {selectedListing.createdAt && ((window as any).DateFormatter?.isOldListing(selectedListing.createdAt)) && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm bg-gray-100 text-gray-600 border border-gray-300">
                        ⏳ Tin cũ - Cần xác thực lại
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">
                        {selectedListing.loaiGiaoDich === 'ban-dat' ? '🏷️ Bán đất' : 
                         selectedListing.loaiGiaoDich === 'ban-nha' ? '🏠 Bán nhà' :
                         selectedListing.loaiGiaoDich === 'cho-thue' ? '🔑 Cho thuê' : 'Tin đăng'}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-red-500" /> Tờ {selectedListing.so_to || 'N/A'} / Thửa {selectedListing.so_thua || 'N/A'}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedListing(null); }} className="p-2 bg-slate-100 rounded-full">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diện tích</p>
                      <p className="text-lg font-black text-slate-800">{selectedListing.dien_tich} m²</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giá bán</p>
                      <p className="text-lg font-black text-slate-800">
                        {selectedListing.isNegotiable ? 
                          'Thương lượng' : 
                          selectedListing.priceValue > 0 ? 
                            ((window as any).PriceService).formatCurrency(selectedListing.priceValue) : 
                            'Liên hệ'
                        }
                      </p>
                    </div>
                  </div>

                  {selectedListing.note && (
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Ghi chú</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedListing.note}</p>
                    </div>
                  )}

                  {/* AI Insights Section */}
                  {getAIInsight() && (
                    <div className="backdrop-blur-sm bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-5 rounded-2xl mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">AI Đánh giá</span>
                      </div>
                      <div className="flex items-start gap-3">
                        {getAIInsight()?.type === 'good' && <TrendingDown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                        {getAIInsight()?.type === 'high' && <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />}
                        {getAIInsight()?.type === 'potential' && <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {getAIInsight()?.message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin liên hệ</span>
                    </div>
                    <p className="font-bold text-slate-900 mb-1">{selectedListing.userName}</p>
                    {selectedListing.phone && (
                      <a href={`tel:${selectedListing.phone}`} className="text-blue-600 font-semibold flex items-center gap-2 hover:underline">
                        <Phone className="w-4 h-4" />
                        {selectedListing.phone}
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {selectedListing.phone && (
                      <a 
                        href={`tel:${selectedListing.phone}`}
                        onClick={() => triggerHaptic('heavy')}
                        className="w-full h-16 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:shadow-2xl"
                      >
                        <Phone className="w-6 h-6" /> Gọi điện ngay
                      </a>
                    )}
                    
                    {/* VIP Service Button */}
                    <button 
                      onClick={() => { triggerHaptic('medium'); setShowVIPModal(true); }}
                      className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all hover:shadow-xl"
                    >
                      <Wrench className="w-5 h-5" /> Yêu cầu Dịch vụ
                    </button>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          triggerHaptic('medium');
                          const BookmarkService = (window as any).BookmarkService;
                          const isBookmarked = BookmarkService.toggleBookmark(selectedListing.id);
                          // Force re-render
                          setSelectedListing({...selectedListing});
                        }}
                        className="flex-1 backdrop-blur-sm bg-slate-100/80 text-slate-700 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        {((window as any).BookmarkService?.isBookmarked(selectedListing.id)) ? 
                          <><BookmarkCheck className="w-4 h-4" /> Đã lưu</> : 
                          <><Bookmark className="w-4 h-4" /> Lưu</>
                        }
                      </button>
                      <button 
                        onClick={() => {
                          triggerHaptic('light');
                          const LinkService = (window as any).LinkService;
                          const shareLink = LinkService.generateListingShareLink(
                            selectedListing.id,
                            selectedListing.coordinates[0],
                            selectedListing.coordinates[1]
                          );
                          navigator.clipboard?.writeText(shareLink);
                          alert('Link đã được copy!');
                        }}
                        className="flex-1 bg-slate-100 text-slate-600 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" /> Chia sẻ
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedListing.coordinates) {
                            (window as any).MapController.flyToCoordinates(
                              selectedListing.coordinates[0], 
                              selectedListing.coordinates[1], 
                              18
                            );
                          }
                        }}
                        className="flex-1 bg-slate-100 text-slate-600 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4" /> Vị trí
                      </button>
                    </div>
                    
                    {/* Advertising Placeholder */}
                    <div className="mt-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 font-medium">📢 Liên hệ quảng cáo tại đây</p>
                    </div>
                  </div>
                </div>
              )}

              {view === 'success' && (
                <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 className="w-14 h-14 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Thành công!</h2>
                  <p className="text-slate-500 text-center max-w-[240px] text-sm leading-relaxed">
                    Tin rao của bạn đã được liên kết với dữ liệu GIS và đang chờ duyệt.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* VIP Service Modal */}
      {showVIPModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowVIPModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">🛠️ Dịch vụ VIP</h3>
              <button onClick={() => setShowVIPModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleVIPService('Chụp ảnh 360°')}
                className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
              >
                <Camera className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-bold text-slate-900">Chụp ảnh 360°</p>
                  <p className="text-xs text-slate-600">Ảnh toàn cảnh chuyên nghiệp</p>
                </div>
              </button>
              
              <button 
                onClick={() => handleVIPService('Quay Flycam')}
                className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
              >
                <Video className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-bold text-slate-900">Quay Flycam</p>
                  <p className="text-xs text-slate-600">Video từ trên cao</p>
                </div>
              </button>
              
              <button 
                onClick={() => handleVIPService('Dọn cỏ/Cắm mốc')}
                className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
              >
                <Scissors className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="font-bold text-slate-900">Dọn cỏ / Cắm mốc</p>
                  <p className="text-xs text-slate-600">Chăm sóc đất đai</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Coffee Modal */}
      {showCoffeeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCoffeeModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setShowCoffeeModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <Coffee className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">☕ Mời cà phê</h3>
            <p className="text-sm text-slate-600 mb-6">
              Nếu ứng dụng hữu ích với bạn, hãy mời chúng tôi ly cà phê nhé! ❤️
            </p>
            
            {/* QR Code Placeholder */}
            <div className="bg-slate-100 rounded-2xl p-6 mb-4 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-400" />
            </div>
            
            <p className="text-xs text-slate-500 mb-2">Quét mã QR để gửi qua Momo/Banking</p>
            <p className="text-xs font-bold text-slate-700">Số tài khoản: 0123456789</p>
            <p className="text-xs text-slate-600">Ngân hàng: VCB - Chủ TK: ADMIN</p>
            
            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-800 font-medium">
                🙏 Cảm ơn sự ủng hộ của bạn!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
(window as any).App = App;
