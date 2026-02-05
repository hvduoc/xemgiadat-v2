
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
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
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const MapController = (window as any).MapController;
  const controller = useMemo(() => new MapController(), []);
  
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [view, setView] = useState<'info' | 'listing' | 'success'>('info');
  const [panelState, setPanelState] = useState<'peek' | 'expanded'>('expanded');
  
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
      
      // Reset form khi chọn thửa mới
      setListingForm({ price: '', phone: '', note: '', images: [] });
    });
  }, [controller]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {selectedParcel && (
        <div className={`absolute bottom-0 inset-x-0 z-[100] transition-all duration-300 ease-out transform
          ${panelState === 'expanded' ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}
        `}>
          <div className="max-w-xl mx-auto bg-white rounded-t-[2.5rem] shadow-[0_-10px_50px_rgba(0,0,0,0.2)] pb-safe border-t border-slate-100">
            {/* Handle Bar */}
            <div 
              className="h-10 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => setPanelState(panelState === 'peek' ? 'expanded' : 'peek')}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="px-6 pb-8 overflow-y-auto max-h-[85vh] scrollbar-hide">
              {view === 'info' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
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

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setView('listing')}
                      className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                    >
                      <Rocket className="w-6 h-6 text-yellow-400" /> Rao bán lô này
                    </button>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-slate-100 text-slate-600 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" /> Chia sẻ
                      </button>
                      <button className="flex-1 bg-slate-100 text-slate-600 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                        <Copy className="w-4 h-4" /> Tọa độ
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {view === 'listing' && (
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
    </div>
  );
};

(window as any).App = App;
