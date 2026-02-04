import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapController } from './services/MapController';
import { LinkService } from './services/LinkService';
import { PriceService } from './services/PriceService';
import { ImageService } from './services/ImageService';
import { ParcelData } from './types';
import { 
  MapPin, 
  Share2, 
  Info,
  X,
  ChevronUp,
  Copy,
  Rocket,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Banknote,
  Send
} from 'lucide-react';

const App: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const controller = useMemo(() => new MapController(), []);
  
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [panelState, setPanelState] = useState<'peek' | 'expanded' | 'closed'>('peek');
  const [view, setView] = useState<'info' | 'listing' | 'success'>('info');
  
  // Listing Form States
  const [listingForm, setListingForm] = useState({
    title: '',
    price: '',
    phone: '',
    images: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const initial = LinkService.getParams();
    
    controller.init(mapContainerRef.current, initial, (data: any) => {
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
      setView('info');
      setPanelState('expanded');
      
      // Auto-fill logic
      setListingForm({
        title: `Bán đất Thửa ${parcel.so_thua} Tờ ${parcel.so_to}, ${parcel.dia_chi}`,
        price: '',
        phone: '',
        images: []
      });
    });
  }, [controller]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const remaining = 5 - listingForm.images.length;
      if (remaining <= 0) return;

      const newImages = await Promise.all(
        files.slice(0, remaining).map(file => ImageService.compressImage(file, 0.6, 1000))
      );
      setListingForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (idx: number) => {
    setListingForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const submitListing = async () => {
    setIsSubmitting(true);
    // Giả lập gửi API
    await new Promise(r => setTimeout(r, 1500));
    setView('success');
    setIsSubmitting(false);
    
    setTimeout(() => {
      setPanelState('closed');
      setSelectedParcel(null);
    }, 3000);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* BOTTOM SHEET */}
      <div 
        className={`absolute bottom-0 inset-x-0 z-[100] transition-all duration-300 ease-out transform
          ${panelState === 'closed' ? 'translate-y-full' : 'translate-y-0'}
        `}
      >
        <div className={`max-w-xl mx-auto bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 pb-safe
          ${panelState === 'peek' ? 'h-[64px]' : 'h-auto max-h-[90vh]'}
          flex flex-col transition-all duration-300 overflow-hidden
        `}>
          {/* Handle bar */}
          <div 
            className="h-10 flex flex-col items-center justify-center cursor-pointer shrink-0"
            onClick={() => setPanelState(panelState === 'peek' ? 'expanded' : 'peek')}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          {selectedParcel && (
            <div className="px-6 pb-8 overflow-y-auto scrollbar-hide">
              
              {/* VIEW: THÔNG TIN CHI TIẾT */}
              {view === 'info' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">
                        Thửa {selectedParcel.so_thua} <span className="text-slate-300 font-medium">/ Tờ {selectedParcel.so_to}</span>
                      </h2>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-red-500" /> {selectedParcel.dia_chi}
                      </p>
                    </div>
                    <button onClick={() => setSelectedParcel(null)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-transform">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diện tích</p>
                        <p className="text-lg font-black text-slate-800">{selectedParcel.dien_tich} m²</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sử dụng</p>
                        <p className="text-lg font-black text-slate-800">{selectedParcel.muc_dich}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-2">Giá trị ước tính (Bản đồ 2025)</span>
                      <p className="text-3xl font-black text-blue-700 tracking-tight leading-none">
                        {PriceService.formatCurrency(selectedParcel.gia_uoc_tinh || 0)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button 
                        onClick={() => setView('listing')}
                        className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                      >
                        <Rocket className="w-6 h-6 text-orange-400" /> Đăng tin rao bán
                      </button>
                      <div className="flex gap-2">
                         <button className="flex-1 bg-slate-100 text-slate-600 h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-slate-200 transition-colors">
                            <Share2 className="w-4 h-4" /> Chia sẻ
                         </button>
                         <button className="flex-1 bg-slate-100 text-slate-600 h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-slate-200 transition-colors">
                            <Copy className="w-4 h-4" /> Tọa độ
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: FORM ĐĂNG TIN */}
              {view === 'listing' && (
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('info')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900">Rao bán thửa đất</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Tiêu đề quảng cáo</label>
                      <input 
                        className="w-full px-5 h-14 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                        value={listingForm.title}
                        onChange={e => setListingForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    {/* Price & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Giá mong muốn</label>
                        <div className="relative">
                          <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="number"
                            placeholder="Nhập giá..."
                            className="w-full pl-10 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                            value={listingForm.price}
                            onChange={e => setListingForm(prev => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Số điện thoại</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            placeholder="09xxx..."
                            className="w-full pl-10 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                            value={listingForm.phone}
                            onChange={e => setListingForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Hình ảnh thực tế ({listingForm.images.length}/5)</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {listingForm.images.length < 5 && (
                          <label className="w-24 h-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                            <Camera className="w-6 h-6 text-slate-400 mb-1" />
                            <span className="text-[9px] font-bold text-slate-400">Tải ảnh lên</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                        )}
                        {listingForm.images.map((img, i) => (
                          <div key={i} className="relative w-24 h-24 shrink-0 group">
                            <img src={img} className="w-full h-full object-cover rounded-2xl shadow-sm border border-slate-200" />
                            <button 
                              onClick={() => removeImage(i)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg active:scale-90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium italic">
                        Dữ liệu pháp lý (Diện tích, số thửa) đã được tự động xác thực từ GIS.
                      </p>
                    </div>

                    <button 
                      onClick={submitListing}
                      disabled={isSubmitting || !listingForm.phone || !listingForm.price}
                      className={`w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all
                        ${isSubmitting || !listingForm.phone || !listingForm.price 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-blue-600 text-white active:scale-95 shadow-blue-100'}
                      `}
                    >
                      {isSubmitting ? 'Đang gửi...' : <><Send className="w-5 h-5" /> Xác nhận đăng tin</>}
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: SUCCESS */}
              {view === 'success' && (
                <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 className="w-14 h-14 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Tuyệt vời!</h2>
                  <p className="text-slate-500 text-center max-w-[240px]">
                    Tin đăng rao bán của bạn đã được khởi tạo thành công trên bản đồ.
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
