"use client";

import {
  Compass,
  Building2,
  ReceiptText,
  Search,
  ChevronLeft,
  Clock,
  Bus,
  Users,
  Star,
  MapPin,
  Flag,
  CreditCard,
} from "lucide-react";

const getHotelPrice = (hotelId: string) => {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) {
    hash = hotelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const basePrice = Math.abs(hash % 8) * 150000 + 400000; // 400k to 1.45M VND
  return basePrice;
};

const getHotelRating = (hotelId: string) => {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) {
    hash = hotelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseRate = 3.5 + Math.abs(hash % 4) * 0.5; // 3.5, 4.0, 4.5, 5.0
  return baseRate;
};

interface LookupSidePanelProps {
  sidePanelMode: "TOUR_DETAILS" | "UNIVERSAL_SEARCH" | null;
  setSidePanelMode: (mode: "TOUR_DETAILS" | "UNIVERSAL_SEARCH" | null) => void;
  activePanelTab: "TOURS" | "HOTELS" | "BOOKINGS";
  setActivePanelTab: (tab: "TOURS" | "HOTELS" | "BOOKINGS") => void;
  panelSearchQuery: string;
  setPanelSearchQuery: (query: string) => void;
  loadingPanelData: boolean;
  loadingSideTour: boolean;
  sideTourDetails: any;
  sideTourId: string | null;
  setSideTourId: (id: string | null) => void;
  setSideTourDetails: (details: any) => void;
  expandedBookingId: string | null;
  setExpandedBookingId: (id: string | null) => void;
  filteredTours: any[];
  filteredHotels: any[];
  filteredBookings: any[];
  panelBookingsList: any[];
  startDestinations: string[];
  endDestinations: string[];
  hotelLocations: string[];
  tourStartDest: string;
  setTourStartDest: (val: string) => void;
  tourEndDest: string;
  setTourEndDest: (val: string) => void;
  tourPriceRange: string;
  setTourPriceRange: (val: string) => void;
  tourMinRating: number;
  setTourMinRating: (val: number) => void;
  hotelLocation: string;
  setHotelLocation: (val: string) => void;
  hotelPriceRange: string;
  setHotelPriceRange: (val: string) => void;
  hotelMinRating: number;
  setHotelMinRating: (val: number) => void;
  handleOpenSideTour: (tourId: string) => Promise<void>;
  handleSecureBookingSearch: () => Promise<void>;
  fetchPanelData: (tab: "TOURS" | "HOTELS" | "BOOKINGS") => Promise<void>;
}

export function LookupSidePanel({
  sidePanelMode,
  setSidePanelMode,
  activePanelTab,
  panelSearchQuery,
  setPanelSearchQuery,
  loadingPanelData,
  loadingSideTour,
  sideTourDetails,
  setSideTourId,
  setSideTourDetails,
  expandedBookingId,
  setExpandedBookingId,
  filteredTours,
  filteredHotels,
  filteredBookings,
  panelBookingsList,
  startDestinations,
  endDestinations,
  hotelLocations,
  tourStartDest,
  setTourStartDest,
  tourEndDest,
  setTourEndDest,
  tourPriceRange,
  setTourPriceRange,
  tourMinRating,
  setTourMinRating,
  hotelLocation,
  setHotelLocation,
  hotelPriceRange,
  setHotelPriceRange,
  hotelMinRating,
  setHotelMinRating,
  handleOpenSideTour,
  handleSecureBookingSearch,
  fetchPanelData,
}: LookupSidePanelProps) {
  if (!sidePanelMode) return null;

  return (
    <div className="
      absolute md:relative inset-0 md:inset-auto z-20 md:z-auto
      w-full md:w-[380px] lg:w-[440px] xl:w-[500px]
      border-l border-slate-100 bg-slate-50/50 flex flex-col h-full
      animate-in slide-in-from-right duration-300 shrink-0
    ">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          {sidePanelMode === "TOUR_DETAILS" && (
            <button
              onClick={() => setSidePanelMode("UNIVERSAL_SEARCH")}
              className="mr-1 p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Quay lại danh sách"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h3 className="font-bold text-slate-800 text-sm">
            {sidePanelMode === "TOUR_DETAILS" ? "Chi tiết Tour" : "Tra cứu thông tin tổng hợp"}
          </h3>
        </div>
        <button
          onClick={() => {
            setSidePanelMode(null);
            setSideTourId(null);
            setSideTourDetails(null);
          }}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Đóng bảng tra cứu"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable details */}
      {sidePanelMode === "TOUR_DETAILS" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingSideTour ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Đang tải chi tiết Tour...</span>
            </div>
          ) : !sideTourDetails ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              ⚠️ Không thể tải dữ liệu Tour hoặc Tour không tồn tại.
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300 text-left">
              {/* Basic info card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase border border-blue-100">
                    {sideTourDetails.tourType === "JOIN_IN" ? "Ghép đoàn" : "Riêng biệt"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Mã: {sideTourDetails.id}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-800 leading-snug">
                  {sideTourDetails.name}
                </h4>
                <div className="flex items-baseline gap-1 mt-2.5">
                  <span className="text-xs text-slate-400">Giá niêm yết:</span>
                  <span className="text-lg font-black text-emerald-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(sideTourDetails.price || 0)}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 rounded-2xl p-3.5 border border-indigo-100/50 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-indigo-500 block uppercase font-extrabold tracking-wider">Thời gian</span>
                    <span className="text-sm font-bold text-slate-800">
                      {sideTourDetails.durationDays}N{sideTourDetails.durationNights}Đ
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/40 to-amber-100/10 rounded-2xl p-3.5 border border-amber-100/50 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-amber-600 block uppercase font-extrabold tracking-wider">Phương tiện</span>
                    <span className="text-sm font-bold text-slate-800 block break-words">
                      {sideTourDetails.vehicleType || "Xe du lịch"}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50/40 to-blue-100/10 rounded-2xl p-3.5 border border-blue-100/50 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-blue-500 block uppercase font-extrabold tracking-wider">Slot tối đa</span>
                    <span className="text-sm font-bold text-slate-800">
                      {sideTourDetails.maximumSlots} chỗ
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50/40 to-yellow-100/10 rounded-2xl p-3.5 border border-yellow-100/50 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-yellow-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-yellow-600 block uppercase font-extrabold tracking-wider">Đánh giá</span>
                    <span className="text-sm font-bold text-slate-800">
                      {sideTourDetails.rating ? `${sideTourDetails.rating} / 5` : "Chưa có"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Destination details */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-rose-500 fill-rose-50 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Điểm khởi hành</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{sideTourDetails.startDestinationName || "Hà Nội / TP.HCM"}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-2.5 flex items-start gap-2.5">
                  <Flag className="w-5 h-5 text-slate-500 fill-slate-50 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Điểm kết thúc</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{sideTourDetails.endDestinationName || "Nha Trang / Phú Quốc"}</p>
                  </div>
                </div>
              </div>

              {/* Collapsible/Scrolling Description */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
                <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Mô tả chi tiết</h5>
                <p className="text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto pr-1 whitespace-pre-wrap scrollbar-thin">
                  {sideTourDetails.description || "Chưa có mô tả chi tiết."}
                </p>
              </div>

              {/* Schedules list */}
              {sideTourDetails.schedules && sideTourDetails.schedules.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Lịch trình & Slot khởi hành</h5>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {sideTourDetails.schedules.map((sch: any, idx: number) => (
                      <div key={sch.id || idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-xs flex justify-between items-center gap-2">
                        <div>
                          <p className="font-bold text-slate-700">Khởi hành: {new Date(sch.startDate).toLocaleDateString("vi-VN")}</p>
                          <p className="text-slate-400 text-[9px] mt-0.5">Kết thúc: {new Date(sch.endDate).toLocaleDateString("vi-VN")}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block font-black px-2.5 py-1 rounded-lg text-[9px] ${sch.availableSlot > 5
                            ? "bg-emerald-50 text-emerald-700"
                            : sch.availableSlot > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                            }`}>
                            {sch.availableSlot > 0 ? `Còn trống ${sch.availableSlot} chỗ` : "Hết chỗ"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Universal lookup view */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Tab selection */}
          <div className="p-3 border-b border-slate-100 bg-white grid grid-cols-3 gap-1 shrink-0">
            <button
              onClick={() => fetchPanelData("TOURS")}
              className={`flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all border ${activePanelTab === "TOURS"
                ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Compass className="w-4 h-4 mb-1" />
              <span className="text-[10px]">Tours</span>
            </button>
            <button
              onClick={() => fetchPanelData("HOTELS")}
              className={`flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all border ${activePanelTab === "HOTELS"
                ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Building2 className="w-4 h-4 mb-1" />
              <span className="text-[10px]">Khách sạn</span>
            </button>
            <button
              onClick={() => fetchPanelData("BOOKINGS")}
              className={`flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all border ${activePanelTab === "BOOKINGS"
                ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <ReceiptText className="w-4 h-4 mb-1" />
              <span className="text-[10px]">Đơn hàng</span>
            </button>
          </div>

          {/* Search input bar */}
          <div className="p-3 bg-white border-b border-slate-100 shrink-0">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={panelSearchQuery}
                  onChange={(e) => setPanelSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && activePanelTab === "BOOKINGS") {
                      handleSecureBookingSearch();
                    }
                  }}
                  placeholder={
                    activePanelTab === "TOURS"
                      ? "Tìm Tours theo tên, mã..."
                      : activePanelTab === "HOTELS"
                        ? "Tìm Khách sạn theo tên, sđt, địa chỉ..."
                        : "Nhập chính xác Mã đơn hàng để tra cứu..."
                  }
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {panelSearchQuery && (
                  <button
                    onClick={() => setPanelSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-extrabold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              {activePanelTab === "BOOKINGS" && (
                <button
                  onClick={() => handleSecureBookingSearch()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all shrink-0"
                >
                  Tra cứu
                </button>
              )}
            </div>
          </div>

          {/* Tours Filters Panel */}
          {activePanelTab === "TOURS" && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-600 shrink-0">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Điểm đi</label>
                <select
                  value={tourStartDest}
                  onChange={(e) => setTourStartDest(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="">Tất cả điểm đi</option>
                  {startDestinations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Điểm đến</label>
                <select
                  value={tourEndDest}
                  onChange={(e) => setTourEndDest(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="">Tất cả điểm đến</option>
                  {endDestinations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Khoảng giá</label>
                <select
                  value={tourPriceRange}
                  onChange={(e) => setTourPriceRange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="ALL">Tất cả giá</option>
                  <option value="UNDER_5M">Dưới 5 triệu</option>
                  <option value="5M_10M">5 - 10 triệu</option>
                  <option value="ABOVE_10M">Trên 10 triệu</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Đánh giá sao</label>
                <select
                  value={tourMinRating}
                  onChange={(e) => setTourMinRating(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value={0}>Tất cả số sao</option>
                  <option value={3}>3 sao trở lên</option>
                  <option value={4}>4 sao trở lên</option>
                  <option value={5}>5 sao tuyệt đối</option>
                </select>
              </div>
            </div>
          )}

          {/* Hotel Filters Panel */}
          {activePanelTab === "HOTELS" && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-2 text-[10px] text-slate-600 shrink-0">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Địa điểm</label>
                <select
                  value={hotelLocation}
                  onChange={(e) => setHotelLocation(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="">Tất cả</option>
                  {hotelLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Khoảng giá</label>
                <select
                  value={hotelPriceRange}
                  onChange={(e) => setHotelPriceRange(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="UNDER_500K">Dưới 500K</option>
                  <option value="500K_1M">500K - 1M</option>
                  <option value="ABOVE_1M">Trên 1M</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Số sao</label>
                <select
                  value={hotelMinRating}
                  onChange={(e) => setHotelMinRating(Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 outline-none text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value={0}>Tất cả</option>
                  <option value={3.5}>3.5 sao+</option>
                  <option value={4}>4.0 sao+</option>
                  <option value={4.5}>4.5 sao+</option>
                </select>
              </div>
            </div>
          )}

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loadingPanelData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                {/* Tours tab content */}
                {activePanelTab === "TOURS" && (
                  filteredTours.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      Không tìm thấy tour phù hợp.
                    </div>
                  ) : (
                    filteredTours.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenSideTour(t.id)}
                        className="bg-white rounded-xl p-3 border border-slate-100 hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all text-left space-y-2 animate-in fade-in duration-200"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="inline-block text-[8px] font-extrabold uppercase bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100">
                            {t.tourType === "JOIN_IN" ? "Ghép đoàn" : "Riêng"}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">Mã: {t.id}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
                          {t.name}
                        </h4>
                        <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-50 text-[10px]">
                          <span className="text-slate-400">{t.durationDays}N{t.durationNights}Đ | {t.vehicleType || "Xe"}</span>
                          <span className="font-extrabold text-emerald-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(t.price || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* Hotels tab content */}
                {activePanelTab === "HOTELS" && (
                  filteredHotels.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      Không tìm thấy khách sạn phù hợp.
                    </div>
                  ) : (
                    filteredHotels.map((h) => {
                      const hotelPrice = getHotelPrice(h.id);
                      const hotelRating = getHotelRating(h.id);
                      return (
                        <div
                          key={h.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-100 hover:shadow-sm transition-all text-left space-y-2.5 animate-in fade-in duration-200"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-800 truncate flex-1">
                              🏨 {h.name}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">ID: {h.id}</span>
                          </div>
                          <div className="space-y-1 text-[10px] text-slate-600 leading-normal">
                            {h.phone && <p>📞 <span className="font-semibold">{h.phone}</span></p>}
                            {h.address && <p>📍 {h.address}</p>}
                          </div>
                          {h.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-3 bg-slate-50/50 p-2 rounded-lg leading-relaxed border border-slate-50">
                              {h.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100/80 text-[10px]">
                            <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                              <span>★</span> <span>{hotelRating.toFixed(1)} / 5</span>
                            </div>
                            <span className="font-black text-emerald-600">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(hotelPrice)} / Đêm
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                )}

                {/* Bookings tab content */}
                {activePanelTab === "BOOKINGS" && (
                  panelBookingsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3.5 animate-in fade-in duration-200">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-sm border border-amber-100">
                        🔒
                      </div>
                      <div className="max-w-[280px]">
                        <h5 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Bảo mật thông tin</h5>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Vui lòng nhập chính xác **Mã đơn hàng** phía trên và nhấn **Tra cứu** để hiển thị thông tin.
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredBookings.map((b) => {
                      const isExpanded = expandedBookingId === b.id;
                      const custName = b.customer?.fullName || "Ẩn danh";
                      const custEmail = b.customer?.email || "";
                      const statusStyles =
                        b.status === "PAID" || b.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : b.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-rose-50 text-rose-700 border-rose-100";

                      return (
                        <div
                          key={b.id}
                          className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-all text-left animate-in fade-in duration-200"
                        >
                          {/* Booking header card */}
                          <div
                            onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                            className="p-3 cursor-pointer select-none space-y-2"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                📄 #{b.id}
                              </span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${statusStyles}`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-[10px]">
                              <h4 className="font-bold text-slate-800 truncate">
                                👤 {custName}
                              </h4>
                              {custEmail && <p className="text-slate-400 truncate pl-3.5">{custEmail}</p>}
                            </div>
                            <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-slate-50 text-[10px]">
                              <span className="text-slate-400">
                                {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("vi-VN") : "N/A"}
                              </span>
                              <span className="font-extrabold text-emerald-600">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(b.finalPrice || b.totalPrice || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-2 text-[10px] text-slate-600 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-2 gap-2 text-slate-600">
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Số lượng</span>
                                  <span className="font-semibold text-slate-700">
                                    {b.quantity || 0} vé ({b.adults || 0}L, {b.children || 0}T)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Đơn giá</span>
                                  <span className="font-semibold text-slate-700">
                                    {new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(b.unitPrice || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Thanh toán</span>
                                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3 text-slate-500" />
                                    {b.paymentMethod || "COD"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Trạng thái TT</span>
                                  <span className={`font-semibold ${b.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                                    {b.paymentStatus || "UNPAID"}
                                  </span>
                                </div>
                              </div>

                              {b.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100/60">
                                  <span className="text-slate-400">Giảm giá:</span>
                                  <span className="font-semibold text-rose-500">
                                    -{new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(b.discountAmount)}
                                  </span>
                                </div>
                              )}

                              {b.pointUsed > 0 && (
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400">Điểm sử dụng:</span>
                                  <span className="font-semibold text-slate-700">
                                    {b.pointUsed} điểm
                                  </span>
                                </div>
                              )}

                              {b.paymentDate && (
                                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1">
                                  <span>Ngày thanh toán:</span>
                                  <span>{new Date(b.paymentDate).toLocaleString("vi-VN")}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
