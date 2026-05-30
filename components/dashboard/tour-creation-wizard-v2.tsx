'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  X, ChevronRight, ChevronLeft, Plus, Trash2, Upload, Loader,
  ChevronDown, ChevronUp, GripVertical, Hotel, Utensils, Ticket,
  Navigation, Calculator, Percent, TrendingUp, Package, AlertCircle,
  Check, Bus, Plane, MapPin, Route, Bed, Camera,
} from 'lucide-react';
import { tourService } from '@/services/tourService';
import { locationService, Location } from '@/services/locationService';
import { vehicleService } from '@/services/vehicleService';
import { tourguideService, Staff } from '@/services/tourguideService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useCurrentUser } from '../../hooks/useAuth';
import { apiClient } from '@/lib/api-client';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface TourCreationWizardV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTourId?: string | null;
}

interface Vehicle {
  id?: string;
  type: string;
  seatCount: number;
  description?: string;
  transportCompanyId?: string;
  transportCompany?: {
    id: string;
    name: string;
    location?: {
      id: string;
      name?: string;
    } | null;
  } | null;
}

interface Venue {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  price?: number;
  description?: string;
  location?: { id: string; name: string };
}

type ActivityType = 'TRANSPORT' | 'DINING' | 'VISIT' | 'CHECKIN';

interface ActivityDetail {
  id: string;                 // temp local id for drag/drop
  activityType: ActivityType;
  timeFrame: string;
  title: string;
  note: string;
  // venue links
  hotelId: string;
  restaurantId: string;
  serviceId: string;
  // resolved names (display)
  hotelName?: string;
  restaurantName?: string;
  serviceName?: string;
  servicePrice?: number;

  // visit and location logic
  locationId: string;
  isCustomLocation?: boolean;
  customLocationText?: string;
  attachService?: boolean;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  collapsed: boolean;
  activities: ActivityDetail[];
}

interface ScheduleItem {
  id?: string;
  startDate: string;
  endDate: string;
  vehicleId: string;
  price: number;
  bookedPeople: number;
  note: string;
  guideIds: string[]; // IDs của các tour guide được phân công
}

interface TourBasicInfo {
  id: string; name: string; description: string; tourType: 'JOIN_IN' | 'PRIVATE';
  price: number; rating: number; startDate: string; durationDays: number;
  durationNights: number; maximumSlots: number; minPeople: number;
  startDestinationId: string; endDestinationId: string; vehicleId: string;
  tourCode: string;
}

// ─── Activity config ──────────────────────────────────────────────────────────
const ACT_CFG: Record<ActivityType, { label: string; iconClass: string; color: string; border: string; bg: string }> = {
  TRANSPORT: { label: 'Di chuyển', iconClass: 'fa-solid fa-bus', color: 'text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50' },
  DINING: { label: 'Ăn uống', iconClass: 'fa-solid fa-utensils', color: 'text-amber-700', border: 'border-amber-300', bg: 'bg-amber-50' },
  VISIT: { label: 'Tham quan', iconClass: 'fa-solid fa-camera', color: 'text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  CHECKIN: { label: 'Nhận phòng', iconClass: 'fa-solid fa-bed', color: 'text-purple-700', border: 'border-purple-300', bg: 'bg-purple-50' },
};

const mkId = () => `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const makeBlankVisitActivity = (): ActivityDetail => ({
  id: mkId(),
  activityType: 'VISIT',
  timeFrame: '',
  title: '',
  note: '',
  hotelId: '',
  restaurantId: '',
  serviceId: '',
  locationId: '',
  isCustomLocation: false,
  customLocationText: '',
  attachService: false,
});

function makeDefaultDays(n: number): ItineraryDay[] {
  return Array.from({ length: n }, (_, i) => {
    const day = i + 1;
    return {
      dayNumber: day,
      title: day === 1 ? `Ngày ${day}: Khởi hành` : `Ngày ${day}: Khám phá`,
      description: '',
      collapsed: day > 1,
      activities: [makeBlankVisitActivity()],
    };
  });
}

const formatVehicleLabel = (v: any) => {
  let typeLabel = 'Xe';
  if (v.seatCount === 9) {
    return 'Limousine 9 chỗ';
  } else if (v.seatCount === 16) {
    return 'Xe 16 chỗ';
  } else if (v.seatCount === 29) {
    return 'Xe 29 chỗ';
  } else if (v.seatCount === 35) {
    return 'Xe 35 chỗ';
  } else if (v.seatCount === 45) {
    return 'Xe 45 chỗ';
  }

  const typeLower = (v.type || '').toLowerCase();
  if (typeLower.includes('limousine')) {
    typeLabel = 'Limousine';
  } else if (typeLower.includes('bus') || typeLower.includes('khách')) {
    typeLabel = 'Xe khách';
  } else if (typeLower.includes('car') || typeLower.includes('con') || typeLower.includes('ô tô')) {
    typeLabel = 'Xe ô tô';
  } else if (typeLower.includes('minivan') || typeLower.includes('du lịch')) {
    typeLabel = 'Xe du lịch';
  } else {
    typeLabel = v.type || 'Xe';
  }
  return `${typeLabel} ${v.seatCount} chỗ`;
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: 'Thông tin cơ bản' },
    { n: 2, label: 'Lịch trình' },
    { n: 3, label: 'Hình ảnh' },
    { n: 4, label: 'Lịch khởi hành' },
  ];
  return (
    <div className="flex items-center justify-between px-2 mt-4">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm border-2 ${step === s.n ? 'bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100'
              : step > s.n ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-400'
              }`}>
              {step > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step === s.n ? 'text-emerald-700' : 'text-slate-400'}`}>{s.label}</span>
          </div>
          {i < 3 && (
            <div className={`flex-1 h-0.5 mx-3 rounded-full ${step > s.n ? 'bg-emerald-400' : 'bg-slate-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Venue select pill ────────────────────────────────────────────────────────
function VenueSelect({ type, venues, value, onChange }: {
  type: 'hotel' | 'restaurant' | 'service';
  venues: Venue[];
  value: string;
  onChange: (id: string, name?: string, price?: number) => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    hotel: <i className="fa-solid fa-bed text-purple-700 text-xs"></i>,
    restaurant: <i className="fa-solid fa-utensils text-amber-700 text-xs"></i>,
    service: <i className="fa-solid fa-ticket text-emerald-700 text-xs"></i>,
  };
  const labels: Record<string, string> = { hotel: 'Khách sạn', restaurant: 'Nhà hàng', service: 'Dịch vụ/Vé' };
  const colors: Record<string, string> = {
    hotel: 'border-purple-300 bg-purple-50 focus:ring-purple-400',
    restaurant: 'border-amber-300 bg-amber-50 focus:ring-amber-400',
    service: 'border-emerald-300 bg-emerald-50 focus:ring-emerald-400',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`p-1.5 rounded-lg ${colors[type].split(' ').slice(1, 3).join(' ')} flex items-center justify-center`}>{icons[type]}</span>
      <select
        value={value}
        onChange={e => {
          const v = venues.find(x => x.id === e.target.value);
          onChange(e.target.value, v?.name, v?.price);
        }}
        className="flex-1 px-2.5 py-1.5 h-9 text-xs font-semibold rounded-lg border bg-white focus:outline-none focus:ring-4 focus:border-emerald-500 focus:ring-emerald-500/15 text-slate-700 border-slate-300 transition-all"
        title={`Chọn ${labels[type]}`}
      >
        <option value="">— {labels[type]} —</option>
        {venues.map(v => (
          <option key={v.id} value={v.id}>
            {v.name}{v.price ? ` (${new Intl.NumberFormat('vi-VN').format(v.price)}đ)` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────


function ActivityRow({
  act, index, total, hotels, restaurants, services, locations, allowedParentIds,
  onChange, onRemove, onMoveUp, onMoveDown,
}: {
  act: ActivityDetail; index: number; total: number;
  hotels: Venue[]; restaurants: Venue[]; services: Venue[]; locations: Location[];
  /** Mảng các parentId hợp lệ cho bộ lọc Attraction:
   *  = union(tourStops, endDestinationId) */
  allowedParentIds: string[];
  onChange: (field: keyof ActivityDetail, value: any) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const cfg = ACT_CFG[act.activityType];
  const selectedService = services.find(s => s.id === act.serviceId);
  const isLocationLocked = !!selectedService?.location?.id;
  const endInputRef = useRef<HTMLInputElement>(null);

  const handleServiceChange = (serviceId: string, name?: string, price?: number) => {
    onChange('serviceId', serviceId);
    onChange('serviceName', name);
    onChange('servicePrice', price);

    // Auto-fill and lock location if selected service has a location
    if (serviceId) {
      const selectedSvc = services.find(s => s.id === serviceId);
      if (selectedSvc?.location?.id) {
        onChange('locationId', selectedSvc.location.id);
        onChange('isCustomLocation', false);
        onChange('customLocationText', '');
      }
    }
  };

  const filteredServices = (() => {
    // Trường hợp A: Chọn Địa điểm trước (hệ thống) -> lọc danh sách Service chỉ thuộc địa điểm đó
    if (act.locationId && !act.isCustomLocation) {
      return services.filter(s => s.location?.id === act.locationId);
    }
    // Trường hợp B: Nhập Địa điểm tự do (hoặc không chọn) -> hiện toàn bộ dịch vụ
    return services;
  })();

  const attractionLocations = (() => {
    const attractions = locations.filter(l => l.type === 'ATTRACTION');
    // Nếu có tỉnh/thành được chọn trong tuyến: chỉ hiện attraction thuộc các địa phương đó
    if (allowedParentIds.length > 0) {
      const filtered = attractions.filter(l => l.parentId && allowedParentIds.includes(l.parentId));
      // Nếu có kết quả thì dùng, nếu không (chưa chọn tỉnh nào) thì hiện tất cả
      return filtered.length > 0 ? filtered : attractions;
    }
    return attractions;
  })();

  const [startVal = '', endVal = ''] = (act.timeFrame || '').split(' - ');

  const handleTimeChange = (inputVal: string, isStart: boolean) => {
    let digits = inputVal.replace(/\D/g, '');
    if (digits.length > 4) {
      digits = digits.substring(0, 4);
    }

    if (digits.length >= 1) {
      const d1 = parseInt(digits[0]);
      if (d1 > 2) return;
    }
    if (digits.length >= 2) {
      const hh = parseInt(digits.substring(0, 2));
      if (hh > 23) return;
    }
    if (digits.length >= 3) {
      const d3 = parseInt(digits[2]);
      if (d3 > 5) return;
    }
    if (digits.length >= 4) {
      const mm = parseInt(digits.substring(2, 4));
      if (mm > 59) return;
    }

    let formatted = digits;
    if (digits.length >= 3) {
      formatted = `${digits.substring(0, 2)}:${digits.substring(2)}`;
    }

    const start = isStart ? formatted : startVal;
    const end = isStart ? endVal : formatted;
    onChange('timeFrame', `${start} - ${end}`);

    if (isStart && formatted.length === 5 && endInputRef.current) {
      endInputRef.current.focus();
    }
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${cfg.border} bg-white shadow-xs`}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
        {/* Drag handle */}
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-all" title="Lên"><ChevronUp className="w-3 h-3 text-slate-500" /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-all" title="Xuống"><ChevronDown className="w-3 h-3 text-slate-500" /></button>
        </div>
        <i className="fa-solid fa-grip-vertical text-slate-400 w-3.5 h-3.5 flex-shrink-0 text-center"></i>

        {/* Type selector */}
        <span className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0 w-7 h-7`}>
          <i className={`${cfg.iconClass} text-xs`} />
        </span>
        <select
          value={act.activityType}
          onChange={e => {
            onChange('activityType', e.target.value as ActivityType);
            // Reset venue when type changes
            onChange('hotelId', ''); onChange('restaurantId', ''); onChange('serviceId', '');
          }}
          className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border ${cfg.border} ${cfg.color} bg-white focus:outline-none focus:ring-1 flex-shrink-0 cursor-pointer`}
          title="Loại hoạt động"
        >
          {(Object.keys(ACT_CFG) as ActivityType[]).map(t => (
            <option key={t} value={t}>{ACT_CFG[t].label}</option>
          ))}
        </select>

        {/* Time frame */}
        <div className="flex items-center gap-1 flex-shrink-0 bg-white border border-slate-300 rounded-lg px-2 h-9 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:outline-none transition-all">
          <input
            type="text"
            value={startVal}
            onChange={e => handleTimeChange(e.target.value, true)}
            placeholder="08:00"
            className="w-10 text-center text-xs font-mono font-semibold bg-transparent text-slate-700 focus:outline-none border-none p-0"
            title="Giờ bắt đầu (HH:mm)"
          />
          <span className="text-slate-400 text-xs font-bold font-mono">→</span>
          <input
            type="text"
            ref={endInputRef}
            value={endVal}
            onChange={e => handleTimeChange(e.target.value, false)}
            placeholder="11:30"
            className="w-10 text-center text-xs font-mono font-semibold bg-transparent text-slate-700 focus:outline-none border-none p-0"
            title="Giờ kết thúc (HH:mm)"
          />
        </div>

        {/* Title */}
        <Input
          value={act.title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="Tên hoạt động"
          className="flex-1 text-xs h-9 px-2.5 font-semibold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0 focus:outline-none transition-all"
        />

        <button onClick={onRemove} className="p-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex-shrink-0" title="Xóa">
          <i className="fa-solid fa-trash-can text-sm" />
        </button>
      </div>

      {/* Conditional venue section */}
      {(act.activityType === 'DINING' || act.activityType === 'CHECKIN' || act.activityType === 'VISIT') && (
        <div className="px-3 pb-2.5 pt-1.5 flex items-center gap-3 flex-wrap border-t border-slate-100 bg-white">
          {act.activityType === 'DINING' && (
            <div className="flex-1 min-w-[200px]">
              <VenueSelect type="restaurant" venues={restaurants} value={act.restaurantId}
                onChange={(id, name) => { onChange('restaurantId', id); onChange('restaurantName', name); onChange('hotelId', ''); onChange('serviceId', ''); }}
              />
            </div>
          )}
          {act.activityType === 'CHECKIN' && (
            <div className="flex-1 min-w-[200px]">
              <VenueSelect type="hotel" venues={hotels} value={act.hotelId}
                onChange={(id, name) => { onChange('hotelId', id); onChange('hotelName', name); onChange('restaurantId', ''); onChange('serviceId', ''); }}
              />
            </div>
          )}
          {act.activityType === 'VISIT' && (
            <div className="flex flex-col gap-2 flex-1 min-w-[280px]">
              {/* Location selection */}
              <div className="flex items-center gap-1.5 flex-1">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center justify-center w-7 h-7">
                  <i className="fa-solid fa-map-pin text-xs" />
                </span>

                {act.isCustomLocation ? (
                  <div className="flex-1 flex items-center gap-1.5">
                    <Input
                      value={act.customLocationText || ''}
                      disabled={isLocationLocked}
                      onChange={e => onChange('customLocationText', e.target.value)}
                      placeholder="Nhập địa điểm tự do... (VD: Bãi biển hoang sơ)"
                      className="flex-1 text-xs h-9 px-2.5 font-semibold border-slate-300 bg-white focus:ring-4 focus:border-emerald-500 focus:ring-emerald-500/15 text-slate-700 rounded-lg"
                    />
                    {!isLocationLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange('isCustomLocation', false);
                          onChange('customLocationText', '');
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline flex-shrink-0"
                      >
                        Chọn hệ thống
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-1.5">
                    <select
                      value={act.locationId || ''}
                      disabled={isLocationLocked}
                      onChange={e => {
                        onChange('locationId', e.target.value);
                        // Reset selected service when location changes to prevent mismatched data
                        onChange('serviceId', '');
                        onChange('serviceName', '');
                        onChange('servicePrice', 0);
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:border-emerald-500 focus:ring-emerald-500/15 text-slate-700 h-9 transition-all"
                    >
                      <option value="">— Chọn Địa điểm —</option>
                      {attractionLocations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    {!isLocationLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange('isCustomLocation', true);
                          onChange('locationId', '');
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline flex-shrink-0"
                      >
                        Nhập tự do
                      </button>
                    )}
                  </div>
                )}
                {isLocationLocked && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-0.5" title="Địa điểm được khóa theo dịch vụ đã chọn">
                    🔒 Khóa
                  </span>
                )}
              </div>

              {/* Toggle switch for attach service */}
              <div className="flex items-center gap-2 pl-8">
                <input
                  type="checkbox"
                  id={`attach-svc-${act.id}`}
                  checked={!!act.attachService}
                  onChange={e => {
                    const checked = e.target.checked;
                    onChange('attachService', checked);
                    if (!checked) {
                      // Clear service fields if turned off
                      onChange('serviceId', '');
                      onChange('serviceName', '');
                      onChange('servicePrice', 0);
                    }
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor={`attach-svc-${act.id}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none">
                  Đính kèm vé / dịch vụ thu phí
                </label>
              </div>

              {/* Conditional Service dropdown */}
              {act.attachService && (
                <div className="flex items-center gap-1.5 pl-8">
                  <span className="p-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-300 flex items-center justify-center w-7 h-7">
                    <i className="fa-solid fa-ticket text-xs" />
                  </span>
                  <select
                    value={act.serviceId || ''}
                    onChange={e => {
                      const selectedVal = e.target.value;
                      const selectedSvc = filteredServices.find(x => x.id === selectedVal);
                      handleServiceChange(selectedVal, selectedSvc?.name, selectedSvc?.price);
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:border-emerald-500 focus:ring-emerald-500/15 text-slate-700 h-9 transition-all"
                  >
                    <option value="">— Chọn Dịch vụ / Vé —</option>
                    {filteredServices.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}{v.price ? ` (${new Intl.NumberFormat('vi-VN').format(v.price)}đ)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {/* Note inline */}
          <Input
            value={act.note}
            onChange={e => onChange('note', e.target.value)}
            placeholder="Ghi chú nội bộ..."
            className="flex-1 min-w-[180px] text-xs h-9 px-2.5 italic text-slate-500 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0 focus:outline-none rounded-lg transition-all"
          />
        </div>
      )}

      {/* Note for TRANSPORT */}
      {act.activityType === 'TRANSPORT' && (
        <div className="px-3 pb-2 pt-1 border-t border-slate-100 bg-white">
          <Input
            value={act.note}
            onChange={e => onChange('note', e.target.value)}
            placeholder="Ghi chú: Hướng dẫn viên kiểm tra đủ thành viên..."
            className="w-full text-xs h-9 px-2.5 italic text-slate-500 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0 focus:outline-none rounded-lg transition-all"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function TourCreationWizardV2({ isOpen, onClose, onSuccess, editTourId }: TourCreationWizardV2Props) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const user = useCurrentUser();

  // Dropdown data
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hotels, setHotels] = useState<Venue[]>([]);
  const [restaurants, setRestaurants] = useState<Venue[]>([]);
  const [services, setServices] = useState<Venue[]>([]);
  const [tourGuides, setTourGuides] = useState<Staff[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Step 1: Basic info (12-col grid)
  const [basicInfo, setBasicInfo] = useState<TourBasicInfo>({
    id: '', name: '', description: '', tourType: 'JOIN_IN', price: 0, rating: 0,
    startDate: '', durationDays: 3, durationNights: 2, maximumSlots: 20,
    minPeople: 2, startDestinationId: '', endDestinationId: '', vehicleId: '',
    tourCode: `TOUR-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  // Step 2: Itinerary days
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [profitMargin, setProfitMargin] = useState(25); // %
  // Tuyến hành trình: danh sách các tỉnh/thành đi qua (theo thứ tự)
  const [tourStops, setTourStops] = useState<string[]>(['']); // mỗi phần tử là locationId

  // Step 3: Images
  const [tourImageUrls, setTourImageUrls] = useState<string[]>(['', '', '']);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [createdTourId, setCreatedTourId] = useState<string | null>(null);

  // Step 4: Schedule
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleForm, setScheduleForm] = useState<ScheduleItem>({
    startDate: '', endDate: '', vehicleId: '', price: 0, bookedPeople: 0, note: '', guideIds: [],
  });
  const [scheduleGuideDropdown, setScheduleGuideDropdown] = useState<string>(''); // guide đang chọn để thêm vào form

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('Wizard V2 useEffect: isOpen =', isOpen, 'editTourId =', editTourId);
    if (isOpen) {
      loadAll();
      if (editTourId) {
        console.log('Wizard V2: Triggering loadTourForEdit for', editTourId);
        loadTourForEdit(editTourId);
      } else {
        console.log('Wizard V2: Triggering resetFormToDefault');
        resetFormToDefault();
      }
    }
  }, [isOpen, editTourId]);

  const loadTourForEdit = async (id: string) => {
    console.log('Wizard V2: loadTourForEdit called with ID:', id);
    setLoadingData(true);
    try {
      // 1. Fetch tour details
      const res = await apiClient.get<any>(`/tours/${id}`);
      console.log('Wizard V2: loadTourForEdit API response:', res);
      if (res.success && res.data) {
        const tour = res.data;

        // 2. Map basicInfo
        setBasicInfo({
          id: tour.id || '',
          name: tour.name || '',
          description: tour.description || '',
          tourType: tour.tourType || 'JOIN_IN',
          price: tour.price || 0,
          rating: tour.rating || 0,
          startDate: tour.startDate || '',
          durationDays: tour.durationDays || 3,
          durationNights: tour.durationNights || 2,
          maximumSlots: tour.maximumSlots || 20,
          minPeople: tour.minPeople || 2,
          startDestinationId: tour.startDestinationId || tour.startDestination?.id || '',
          endDestinationId: tour.endDestinationId || tour.endDestination?.id || '',
          vehicleId: tour.vehicleId || tour.schedules?.[0]?.vehicleId || tour.tourSchedules?.[0]?.vehicle?.id || '',
          tourCode: tour.tourCode || '',
        });

        // 3. Map tourStops from tourLocations
        try {
          const locsRes = await apiClient.get<any>(`/tour-locations/tour/${id}`);
          if (locsRes.success && Array.isArray(locsRes.data)) {
            const stops = [...locsRes.data]
              .sort((a: any, b: any) => (a.visitOrder || 0) - (b.visitOrder || 0))
              .map((tl: any) => tl.location?.id || '');
            const filteredStops = stops.filter(Boolean);
            setTourStops(filteredStops.length > 0 ? filteredStops : ['']);
          } else {
            setTourStops(['']);
          }
        } catch (err) {
          console.error('Failed to load tour stops', err);
          setTourStops(['']);
        }

        // 4. Map images
        let imgs: string[] = [];
        if (Array.isArray(tour.images)) {
          imgs = [...tour.images];
        } else if (tour.tourImages && tour.tourImages.length > 0) {
          imgs = tour.tourImages.map((img: any) => img.imageUrl);
        }
        while (imgs.length < 3) imgs.push('');
        setTourImageUrls(imgs);

        // 5. Map schedules
        const rawSchedules = tour.schedules || tour.tourSchedules || [];
        if (rawSchedules.length > 0) {
          const scheds = await Promise.all(rawSchedules.map(async (sch: any) => {
            // Fetch guide assignments for this schedule to get guide IDs
            let guideIds: string[] = [];
            try {
              const gaRes = await apiClient.get<any>(`/guides-assignments/schedule/${sch.id}`);
              if (gaRes.success && Array.isArray(gaRes.data)) {
                guideIds = gaRes.data.map((ga: any) => ga.tourGuide?.id).filter(Boolean);
              }
            } catch (err) {
              console.error('Failed to load guide assignments for schedule', sch.id, err);
            }
            return {
              id: sch.id,
              startDate: sch.startDate || '',
              endDate: sch.endDate || '',
              vehicleId: sch.vehicleId || sch.vehicle?.id || '',
              price: sch.price || 0,
              bookedPeople: sch.bookedPeople || 0,
              note: sch.note || '',
              guideIds,
            };
          }));
          setSchedules(scheds);
        } else {
          setSchedules([]);
        }

        // 6. Fetch itineraries (days and details)
        const itinRes = await apiClient.get<any>(`/tour-itineraries/tour/${id}`);
        if (itinRes.success && Array.isArray(itinRes.data)) {
          const sortedItins = [...itinRes.data].sort((a: any, b: any) => (a.dayNumber || 0) - (b.dayNumber || 0));
          const mappedDays = sortedItins.map((itin: any) => {
            const activities = itin.itineraryDetails ? itin.itineraryDetails.map((act: any) => {
              // Parse custom location if needed
              let isCustomLocation = false;
              let customLocationText = '';
              let noteText = act.note || '';
              const match = noteText.match(/\(Địa điểm tự do: (.*?)\)/);
              if (match) {
                isCustomLocation = true;
                customLocationText = match[1];
                noteText = noteText.replace(/\s*\(Địa điểm tự do:.*?\)/, '');
              } else if (noteText.startsWith('Địa điểm tự do: ')) {
                isCustomLocation = true;
                customLocationText = noteText.replace('Địa điểm tự do: ', '');
                noteText = '';
              }

              return {
                id: act.id || mkId(),
                activityType: act.activityType || 'VISIT',
                timeFrame: act.timeFrame || '',
                title: act.title || '',
                note: noteText,
                hotelId: act.hotel?.id || '',
                restaurantId: act.restaurant?.id || '',
                serviceId: act.service?.id || '',
                locationId: act.location?.id || '',
                isCustomLocation,
                customLocationText,
                attachService: !!act.service?.id,
              };
            }) : [makeBlankVisitActivity()];

            if (activities.length === 0) {
              activities.push(makeBlankVisitActivity());
            }

            return {
              dayNumber: itin.dayNumber || 1,
              title: itin.title || '',
              description: itin.description || '',
              collapsed: (itin.dayNumber || 1) > 1,
              activities,
            };
          });
          setDays(mappedDays);
        }
      }
    } catch (err) {
      console.error('Failed to load tour for edit', err);
      setError('Lỗi khi tải thông tin tour chỉnh sửa');
    } finally {
      setLoadingData(false);
    }
  };

  // ── Auto-save draft function ──────────────────────────────────────────────
  const autoSaveDraft = async () => {
    // Only auto-save if modal is open, not currently submitting/autosaving,
    // has a user logged in, and basicInfo name is filled out.
    if (!isOpen || isSubmitting || isAutoSaving || !user?.id || !basicInfo.name.trim()) return;

    setIsAutoSaving(true);
    try {
      const tourId = editTourId || createdTourId || generateId('C');
      const now = new Date().toISOString();

      const tourPayload = {
        ...basicInfo,
        id: tourId,
        availableSlots: basicInfo.maximumSlots,
        status: 'PENDING', // Saved draft is set to PENDING status, representing DRAFT
        managerId: '30052610000',
        tourPlannerId: user.id,
        createdAt: now,
        updatedAt: now,
      };

      // 1. Save / update the tour entity
      let tourRes;
      if (editTourId || createdTourId) {
        tourRes = await tourService.updateTour(tourId, tourPayload as any);
      } else {
        tourRes = await tourService.createTour(tourPayload as any);
      }

      if (tourRes.success && tourRes.data) {
        const cid = tourRes.data.id;
        if (!createdTourId && !editTourId) {
          setCreatedTourId(cid);
        }

        // Clean up and save images
        try {
          const oldImgs = await apiClient.get<any>(`/tour-images/tour/${cid}`);
          if (oldImgs.success && Array.isArray(oldImgs.data)) {
            for (const img of oldImgs.data) {
              await apiClient.delete(`/tour-images/${img.id}`);
            }
          }
        } catch (e) { console.error('Auto-save: Failed to delete old images', e); }

        for (let i = 0; i < tourImageUrls.length; i++) {
          if (tourImageUrls[i]) {
            await tourService.createTourImage({ id: generateId('TI'), tour: { id: cid }, imageUrl: tourImageUrls[i] } as any);
          }
        }

        // Clean up and save itineraries
        try {
          const oldItins = await apiClient.get<any>(`/tour-itineraries/tour/${cid}`);
          if (oldItins.success && Array.isArray(oldItins.data)) {
            for (const itin of oldItins.data) {
              await apiClient.delete(`/tour-itineraries/${itin.id}`);
            }
          }
        } catch (e) { console.error('Auto-save: Failed to delete old itineraries', e); }

        for (const day of days) {
          const itinRes = await apiClient.post('/tour-itineraries', {
            id: generateId('ITN'),
            tour: { id: cid },
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
          });
          if (itinRes.success && itinRes.data) {
            const itinId = itinRes.data.id;
            for (const act of day.activities) {
              const isCustom = act.isCustomLocation && act.customLocationText;
              const finalNote = isCustom
                ? (act.note ? `${act.note} (Địa điểm tự do: ${act.customLocationText})` : `Địa điểm tự do: ${act.customLocationText}`)
                : act.note;
              const finalLocation = (!act.isCustomLocation && act.locationId) ? { id: act.locationId } : null;

              await apiClient.post('/itinerary-details', {
                id: generateId('DTL'),
                tourItinerary: { id: itinId },
                activityType: act.activityType,
                timeFrame: act.timeFrame,
                title: act.title,
                note: finalNote,
                location: finalLocation,
                hotel: act.hotelId ? { id: act.hotelId } : null,
                restaurant: act.restaurantId ? { id: act.restaurantId } : null,
                service: act.serviceId ? { id: act.serviceId } : null,
              });
            }
          }
        }

        // Clean up and save schedules + assignments
        try {
          const oldScheds = await apiClient.get<any>(`/tour-schedules/tour/${cid}`);
          if (oldScheds.success && Array.isArray(oldScheds.data)) {
            for (const oldSch of oldScheds.data) {
              const exists = schedules.some(s => s.id === oldSch.id);
              if (!exists) {
                await apiClient.delete(`/tour-schedules/${oldSch.id}`);
              }
            }
          }
        } catch (e) { console.error('Auto-save: Failed to delete removed schedules', e); }

        for (const sch of schedules) {
          const isNew = !sch.id || !sch.id.startsWith('TS');
          const schPayload = {
            id: isNew ? generateId('TS') : sch.id,
            tour: { id: cid },
            vehicle: { id: sch.vehicleId },
            startDate: sch.startDate,
            endDate: sch.endDate,
            price: sch.price,
            bookedPeople: sch.bookedPeople,
            availableSlot: basicInfo.maximumSlots - sch.bookedPeople,
            isActive: true,
            note: sch.note,
            status: 'UPCOMING',
          };

          let schRes;
          if (isNew) {
            schRes = await tourService.createTourSchedule(schPayload);
          } else {
            schRes = await tourService.updateTourSchedule(sch.id!, schPayload);
          }

          if (schRes.success && schRes.data) {
            const scheduleId = (schRes.data as any).id;
            if (!isNew) {
              try {
                const gaRes = await apiClient.get<any>(`/guides-assignments/schedule/${scheduleId}`);
                if (gaRes.success && Array.isArray(gaRes.data)) {
                  for (const ga of gaRes.data) {
                    await apiClient.delete(`/guides-assignments/${ga.id}`);
                  }
                }
              } catch (e) { console.error('Auto-save: Failed to clear old guide assignments', e); }
            }

            if (sch.guideIds.length > 0) {
              for (const guideId of sch.guideIds) {
                await apiClient.post('/guides-assignments', {
                  id: generateId('GA'),
                  tourSchedule: { id: scheduleId },
                  tourGuide: { id: guideId },
                  startAt: `${sch.startDate}T07:00:00`,
                  endAt: `${sch.endDate}T20:00:00`,
                });
              }
            }
          }
        }

        // Clean up and save tour locations
        try {
          const oldLocs = await apiClient.get<any>(`/tour-locations/tour/${cid}`);
          if (oldLocs.success && Array.isArray(oldLocs.data)) {
            for (const loc of oldLocs.data) {
              await apiClient.delete(`/tour-locations/${loc.id}`);
            }
          }
        } catch (e) { console.error('Auto-save: Failed to delete old locations', e); }

        const validStops = tourStops.filter(id => !!id);
        for (let i = 0; i < validStops.length; i++) {
          await apiClient.post('/tour-locations', {
            id: generateId('TL'),
            tour: { id: cid },
            location: { id: validStops[i] },
            visitOrder: i + 1,
            days: Math.ceil((basicInfo.durationDays || 1) / Math.max(validStops.length, 1)),
            note: '',
          });
        }

        const dateStr = new Date().toLocaleTimeString('vi-VN');
        setLastAutoSaved(dateStr);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // ── Auto-save draft effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setLastAutoSaved(null);
      return;
    }

    const interval = setInterval(() => {
      autoSaveDraft();
    }, 60000); // Auto-save draft every 60 seconds

    return () => clearInterval(interval);
  }, [isOpen, basicInfo, days, tourStops, tourImageUrls, schedules, createdTourId, editTourId, user]);

  const loadAll = async () => {
    setLoadingData(true);
    try {
      const [locR, vehR, hotelR, restR, svcR, guideR] = await Promise.all([
        locationService.getLocations(),
        vehicleService.getVehicles(),
        apiClient.get('/hotels'),
        apiClient.get('/restaurants'),
        apiClient.get('/services'),
        tourguideService.getTourGuides(),
      ]);
      if (locR.success && locR.data) setLocations(locR.data);
      if (vehR.success && vehR.data) setVehicles(vehR.data);
      if (hotelR.success && hotelR.data) setHotels(hotelR.data.map((h: any) => ({ id: h.id, name: h.name, address: h.address, phone: h.phone, price: h.basePricePerNight })));
      if (restR.success && restR.data) setRestaurants(restR.data.map((r: any) => ({ id: r.id, name: r.name, address: r.address, phone: r.phone, price: r.pricePerPax })));
      if (svcR.success && svcR.data) setServices(svcR.data.map((s: any) => ({ id: s.id, name: s.name, price: s.price, location: s.location })));
      if (guideR.success && guideR.data) setTourGuides(guideR.data);
    } catch (err) { console.error('loadAll error', err); }
    finally { setLoadingData(false); }
  };

  // ── Regenerate days when durationDays changes ─────────────────────────────
  useEffect(() => {
    const n = Math.max(1, basicInfo.durationDays || 1);
    setDays(prev => {
      if (prev.length === n) return prev;
      if (prev.length < n) {
        const extra = Array.from({ length: n - prev.length }, (_, i) => {
          const day = prev.length + i + 1;
          return {
            dayNumber: day,
            title: day === 1 ? `Ngày ${day}: Khởi hành` : `Ngày ${day}: Khám phá`,
            description: '',
            collapsed: day > 1,
            activities: [makeBlankVisitActivity()]
          };
        });
        return [...prev, ...extra];
      }
      return prev.slice(0, n);
    });
  }, [basicInfo.durationDays]);

  // ── Cost calculation ──────────────────────────────────────────────────────
  const { totalServiceCost, suggestedPrice } = (() => {
    let cost = 0;
    days.forEach(day => {
      day.activities.forEach(act => {
        if (act.activityType === 'DINING' && act.restaurantId) {
          const rest = restaurants.find(r => r.id === act.restaurantId);
          if (rest?.price) cost += rest.price;
        } else if (act.activityType === 'CHECKIN' && act.hotelId) {
          const hot = hotels.find(h => h.id === act.hotelId);
          if (hot?.price) cost += hot.price / 2;
        } else if (act.activityType === 'VISIT' && act.serviceId) {
          const svc = services.find(s => s.id === act.serviceId);
          if (svc?.price) cost += svc.price;
        }
      });
    });
    return { totalServiceCost: cost, suggestedPrice: Math.ceil(cost * (1 + profitMargin / 100) / 1000) * 1000 };
  })();

  // Group and filter vehicles by startDestinationId
  const groupedVehicleOptions = useMemo(() => {
    const filtered = basicInfo.startDestinationId
      ? vehicles.filter((v) => v.transportCompany?.location?.id === basicInfo.startDestinationId)
      : vehicles;

    const groups: Record<string, Vehicle[]> = {};
    filtered.forEach((v) => {
      const companyName = v.transportCompany?.name || 'Nhà xe chưa xác định';
      if (!groups[companyName]) {
        groups[companyName] = [];
      }
      groups[companyName].push(v);
    });

    return groups;
  }, [vehicles, basicInfo.startDestinationId]);

  // ── Activity helpers ──────────────────────────────────────────────────────
  const updateActivity = (dayIdx: number, actIdx: number, field: keyof ActivityDetail, value: any) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      activities: d.activities.map((a, ai) => ai !== actIdx ? a : { ...a, [field]: value }),
    }));
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d, activities: d.activities.filter((_, ai) => ai !== actIdx),
    }));
  };

  const addActivity = (dayIdx: number) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : { ...d, activities: [...d.activities, makeBlankVisitActivity()] }));
  };

  const moveActivity = (dayIdx: number, actIdx: number, direction: 'up' | 'down') => {
    setDays(prev => prev.map((d, di) => {
      if (di !== dayIdx) return d;
      const acts = [...d.activities];
      const targetIdx = direction === 'up' ? actIdx - 1 : actIdx + 1;
      if (targetIdx < 0 || targetIdx >= acts.length) return d;
      [acts[actIdx], acts[targetIdx]] = [acts[targetIdx], acts[actIdx]];
      return { ...d, activities: acts };
    }));
  };

  const toggleCollapse = (dayIdx: number) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : { ...d, collapsed: !d.collapsed }));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const generateId = (prefix: string) => {
    const d = new Date();
    return `${prefix}${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  };

  const handleBasicChange = (field: keyof TourBasicInfo, value: any) =>
    setBasicInfo(prev => ({ ...prev, [field]: value }));

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (!basicInfo.name.trim() || !basicInfo.startDestinationId || !basicInfo.endDestinationId || !basicInfo.vehicleId) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc (*)'); return;
      }
    } else if (step === 2) {
      if (days.length === 0 || days.every(d => d.activities.length === 0)) {
        setError('Vui lòng thêm ít nhất một hoạt động'); return;
      }
    } else if (step === 3) {
      if (tourImageUrls.filter(Boolean).length < 1) {
        setError('Vui lòng tải lên ít nhất 1 ảnh'); return;
      }
      setScheduleForm(prev => ({
        ...prev,
        price: prev.price === 0 ? suggestedPrice : prev.price
      }));
    }
    setError(null); setStep(s => s + 1);
  };

  const handlePrev = () => { setError(null); setStep(s => s - 1); };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (!e.target.files?.[0]) return;
    setUploadingIdx(idx);
    try {
      const res = await uploadToCloudinary(e.target.files[0]);
      if (res.success && res.imageUrl) {
        setTourImageUrls(prev => { const n = [...prev]; n[idx] = res.imageUrl!; return n; });
        setSuccessMessage(`✅ Ảnh ${idx + 1} đã tải lên thành công!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else setError(res.error || 'Upload thất bại');
    } catch { setError('Lỗi upload'); }
    finally { setUploadingIdx(null); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    setIsSubmitting(true); setError(null);
    try {
      if (!user?.id) throw new Error('Bạn phải đăng nhập');
      const tourId = editTourId || createdTourId || generateId('C');
      const now = new Date().toISOString();

      const tourPayload = {
        ...basicInfo, id: tourId, availableSlots: basicInfo.maximumSlots,
        status: 'ACTIVE', managerId: '30052610000', tourPlannerId: user.id,
        createdAt: now, updatedAt: now,
      };

      if (editTourId || createdTourId) {
        // Clean up old items before recreating
        // 1. Clean up old images
        try {
          const oldImgs = await apiClient.get<any>(`/tour-images/tour/${tourId}`);
          if (oldImgs.success && Array.isArray(oldImgs.data)) {
            for (const img of oldImgs.data) {
              await apiClient.delete(`/tour-images/${img.id}`);
            }
          }
        } catch (e) { console.error('Failed to delete old images', e); }

        // 2. Clean up old itineraries
        try {
          const oldItins = await apiClient.get<any>(`/tour-itineraries/tour/${tourId}`);
          if (oldItins.success && Array.isArray(oldItins.data)) {
            for (const itin of oldItins.data) {
              await apiClient.delete(`/tour-itineraries/${itin.id}`);
            }
          }
        } catch (e) { console.error('Failed to delete old itineraries', e); }

        // 3. Clean up old tour locations
        try {
          const oldLocs = await apiClient.get<any>(`/tour-locations/tour/${tourId}`);
          if (oldLocs.success && Array.isArray(oldLocs.data)) {
            for (const loc of oldLocs.data) {
              await apiClient.delete(`/tour-locations/${loc.id}`);
            }
          }
        } catch (e) { console.error('Failed to delete old locations', e); }

        // 4. Clean up old schedules that are not in the new schedules list
        try {
          const oldScheds = await apiClient.get<any>(`/tour-schedules/tour/${tourId}`);
          if (oldScheds.success && Array.isArray(oldScheds.data)) {
            for (const oldSch of oldScheds.data) {
              const exists = schedules.some(s => s.id === oldSch.id);
              if (!exists) {
                await apiClient.delete(`/tour-schedules/${oldSch.id}`);
              }
            }
          }
        } catch (e) { console.error('Failed to delete removed schedules', e); }
      }

      let tourRes;
      if (editTourId || createdTourId) {
        tourRes = await tourService.updateTour(tourId, tourPayload as any);
      } else {
        tourRes = await tourService.createTour(tourPayload as any);
      }

      if (!tourRes.success || !tourRes.data) throw new Error('Không thể lưu tour: ' + tourRes.message);
      const cid = tourRes.data.id;
      setCreatedTourId(cid);

      // Save images
      for (let i = 0; i < tourImageUrls.length; i++) {
        if (tourImageUrls[i]) {
          await tourService.createTourImage({ id: generateId('TI'), tour: { id: cid }, imageUrl: tourImageUrls[i] } as any);
        }
      }

      // Save itineraries (TourItinerary per day)
      for (const day of days) {
        const itinRes = await apiClient.post('/tour-itineraries', {
          id: generateId('ITN'),
          tour: { id: cid },
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
        });
        if (itinRes.success && itinRes.data) {
          const itinId = itinRes.data.id;
          // Save details
          for (const act of day.activities) {
            const isCustom = act.isCustomLocation && act.customLocationText;
            const finalNote = isCustom
              ? (act.note ? `${act.note} (Địa điểm tự do: ${act.customLocationText})` : `Địa điểm tự do: ${act.customLocationText}`)
              : act.note;
            const finalLocation = (!act.isCustomLocation && act.locationId) ? { id: act.locationId } : null;

            await apiClient.post('/itinerary-details', {
              id: generateId('DTL'),
              tourItinerary: { id: itinId },
              activityType: act.activityType,
              timeFrame: act.timeFrame,
              title: act.title,
              note: finalNote,
              location: finalLocation,
              hotel: act.hotelId ? { id: act.hotelId } : null,
              restaurant: act.restaurantId ? { id: act.restaurantId } : null,
              service: act.serviceId ? { id: act.serviceId } : null,
            });
          }
        }
      }

      // Save schedules + guide assignments
      for (const sch of schedules) {
        const isNew = !sch.id || !sch.id.startsWith('TS');
        const schPayload = {
          id: isNew ? generateId('TS') : sch.id,
          tour: { id: cid },
          vehicle: { id: sch.vehicleId },
          startDate: sch.startDate,
          endDate: sch.endDate,
          price: sch.price,
          bookedPeople: sch.bookedPeople,
          availableSlot: basicInfo.maximumSlots - sch.bookedPeople,
          isActive: true,
          note: sch.note,
          status: 'UPCOMING',
        };

        let schRes;
        if (isNew) {
          schRes = await tourService.createTourSchedule(schPayload);
        } else {
          schRes = await tourService.updateTourSchedule(sch.id!, schPayload);
        }

        // Phân công hướng dẫn viên
        if (schRes.success && schRes.data) {
          const scheduleId = (schRes.data as any).id;

          // Clear old assignments for this schedule if it's an existing one
          if (!isNew) {
            try {
              const gaRes = await apiClient.get<any>(`/guides-assignments/schedule/${scheduleId}`);
              if (gaRes.success && Array.isArray(gaRes.data)) {
                for (const ga of gaRes.data) {
                  await apiClient.delete(`/guides-assignments/${ga.id}`);
                }
              }
            } catch (e) { console.error('Failed to clear old guide assignments', e); }
          }

          if (sch.guideIds.length > 0) {
            for (const guideId of sch.guideIds) {
              await apiClient.post('/guides-assignments', {
                id: generateId('GA'),
                tourSchedule: { id: scheduleId },
                tourGuide: { id: guideId },
                startAt: `${sch.startDate}T07:00:00`,
                endAt: `${sch.endDate}T20:00:00`,
              });
            }
          }
        }
      }

      // Save tour locations (tuyến hành trình)
      const validStops = tourStops.filter(id => !!id);
      for (let i = 0; i < validStops.length; i++) {
        await apiClient.post('/tour-locations', {
          id: generateId('TL'),
          tour: { id: cid },
          location: { id: validStops[i] },
          visitOrder: i + 1,
          days: Math.ceil((basicInfo.durationDays || 1) / Math.max(validStops.length, 1)),
          note: '',
        });
      }

      setSuccessMessage(editTourId ? '✅ Tour đã được cập nhật thành công!' : '✅ Tour đã được tạo thành công!');
      setTimeout(() => { onSuccess(); handleClose(); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally { setIsSubmitting(false); }
  };

  const resetFormToDefault = () => {
    setStep(1); setError(null); setSuccessMessage(null); setCreatedTourId(null);
    setTourImageUrls(['', '', '']); setDays(makeDefaultDays(3));
    setBasicInfo({ id: '', name: '', description: '', tourType: 'JOIN_IN', price: 0, rating: 0, startDate: '', durationDays: 3, durationNights: 2, maximumSlots: 20, minPeople: 2, startDestinationId: '', endDestinationId: '', vehicleId: '', tourCode: `TOUR-${Math.floor(100000 + Math.random() * 900000)}` });
    setTourStops(['']);
    setSchedules([]);
    setScheduleForm({ startDate: '', endDate: '', vehicleId: '', price: 0, bookedPeople: 0, note: '', guideIds: [] });
    setScheduleGuideDropdown('');
  };

  const handleClose = () => {
    resetFormToDefault();
    onClose();
  };

  // ── Select style helper ───────────────────────────────────────────────────
  const customInputClass = 'w-full h-11 bg-white border border-slate-300 rounded-lg px-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0 focus:outline-none transition-all';
  const customSelectClass = 'w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-all';
  const customTextareaClass = 'w-full min-h-[120px] bg-white border border-slate-300 rounded-lg px-3.5 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0 focus:outline-none transition-all resize-none';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto bg-white rounded-2xl p-0">
        {/* Header */}
        <DialogHeader className="px-8 pt-7 pb-4 border-b border-slate-100 sticky top-0 bg-white z-20 rounded-t-2xl">
          <DialogTitle className="text-2xl font-black text-slate-900 flex items-center justify-between w-full">
            <span className="flex items-center gap-2.5">
              {step === 1 ? 'Thông tin cơ bản' : step === 2 ? 'Thiết kế lịch trình chi tiết' : step === 3 ? 'Hình ảnh & Media' : 'Lịch khởi hành'}
            </span>
            {(isAutoSaving || lastAutoSaved) && (
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-8 normal-case font-sans">
                {isAutoSaving ? (
                  <>
                    <Loader className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                    Đang tự động lưu nháp...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Đã lưu nháp lúc {lastAutoSaved}
                  </>
                )}
              </span>
            )}
          </DialogTitle>
          <StepIndicator step={step} />
        </DialogHeader>

        <div className="px-8 py-6">
          {/* Alerts */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-emerald-700 font-semibold text-sm">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-rose-700 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* ═══ STEP 1: BASIC INFO ═══════════════════════════════════════ */}
          {step === 1 && (
            <div className="grid grid-cols-12 gap-x-5 gap-y-4">
              {/* Row 1: Tên tour (12) */}
              <div className="col-span-12">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên Tour *</label>
                <Input placeholder="e.g. Tour Du Lịch Đà Nẵng – Hội An 4 Ngày 3 Đêm" value={basicInfo.name}
                  onChange={e => handleBasicChange('name', e.target.value)}
                  className={customInputClass}
                />
              </div>

              {/* Row 2: Loại tour (6) + Mã tour (6) */}
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loại Tour *</label>
                <select value={basicInfo.tourType} onChange={e => handleBasicChange('tourType', e.target.value)} className={customSelectClass} title="Loại tour">
                  <option value="JOIN_IN">GHÉP ĐOÀN</option>
                  <option value="PRIVATE">TOUR RIÊNG</option>
                </select>
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mã Tour (Tự động)</label>
                <Input value={basicInfo.tourCode} disabled className={`${customInputClass} bg-slate-50 border-slate-200 text-slate-400 font-mono cursor-not-allowed`} />
              </div>

              {/* Row 3: Điểm khởi hành (6) + Điểm đến chính (6) */}
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-plane-departure text-slate-400"></i> Điểm khởi hành *
                  <span className="ml-1 font-normal normal-case text-slate-400">(Nơi khách tập trung)</span>
                </label>
                <select value={basicInfo.startDestinationId} onChange={e => handleBasicChange('startDestinationId', e.target.value)} className={customSelectClass} title="Điểm khởi hành">
                  <option value="">— Chọn điểm khởi hành —</option>
                  {locations.filter(l => l.type === 'CITY_PROVINCE' || l.type === 'COUNTRY').map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.type === 'CITY_PROVINCE' ? 'Thành phố/Tỉnh' : 'Quốc gia'})</option>
                  ))}
                </select>
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-map-pin text-slate-400"></i> Điểm đến chính *
                  <span className="ml-1 font-normal normal-case text-slate-400">(Trung tâm — dùng cho SEO, danh mục)</span>
                </label>
                <select value={basicInfo.endDestinationId} onChange={e => handleBasicChange('endDestinationId', e.target.value)} className={customSelectClass} title="Điểm đến chính">
                  <option value="">— Chọn điểm đến chính —</option>
                  {locations.filter(l => l.type === 'CITY_PROVINCE' || l.type === 'COUNTRY').map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.type === 'CITY_PROVINCE' ? 'Thành phố/Tỉnh' : 'Quốc gia'})</option>
                  ))}
                </select>
              </div>

              {/* Route Builder: Tuyến hành trình */}
              <div className="col-span-12">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-route text-slate-400"></i> Tuyến hành trình (Tất cả các chặng xe đi qua)
                  <span className="ml-1 font-normal normal-case text-slate-400">— Dùng để tìm kiếm nâng cao và hiển thị lộ trình</span>
                </label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  {tourStops.map((stopId, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        {/* Icon cầu nối tuyến dọc */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-5">
                          <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${isFirst ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-400'
                            }`} />
                          {idx < tourStops.length - 1 && (
                            <div className="w-0.5 h-3 bg-slate-300" />
                          )}
                        </div>

                        <select
                          value={stopId}
                          onChange={e => setTourStops(prev => prev.map((s, i) => i === idx ? e.target.value : s))}
                          className={`flex-1 h-11 px-3.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all ${stopId ? 'border-emerald-300 bg-emerald-50/30 text-slate-800' : 'border-slate-300 bg-white text-slate-500'
                            }`}
                          title={`Chặng ${idx + 1}`}
                        >
                          <option value="">— Chặng {idx + 1}: Chọn tỉnh/thành —</option>
                          {locations
                            .filter(l => l.type === 'CITY_PROVINCE' || l.type === 'COUNTRY')
                            .map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))
                          }
                        </select>

                        <button
                          type="button"
                          onClick={() => setTourStops(prev => prev.filter((_, i) => i !== idx))}
                          disabled={tourStops.length <= 1}
                          className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all disabled:opacity-20 flex-shrink-0"
                          title="Xóa chặng"
                        >
                          <i className="fa-solid fa-trash-can text-sm" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Nút thêm chặng */}
                  <button
                    type="button"
                    onClick={() => setTourStops(prev => [...prev, ''])}
                    className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-1.5 mt-1 bg-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm chặng tiếp theo
                  </button>
                </div>
              </div>

              {/* Row 4: Số ngày (3) + Số đêm (3) + Phương tiện (6) */}
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số ngày *</label>
                <Input type="number" min={1} value={basicInfo.durationDays}
                  onChange={e => handleBasicChange('durationDays', parseInt(e.target.value) || 1)}
                  className={`${customInputClass} text-center`}
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số đêm</label>
                <Input type="number" min={0} value={basicInfo.durationNights}
                  onChange={e => handleBasicChange('durationNights', parseInt(e.target.value) || 0)}
                  className={`${customInputClass} text-center`}
                />
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phương tiện *</label>
                <select value={basicInfo.vehicleId} onChange={e => handleBasicChange('vehicleId', e.target.value)} className={customSelectClass} title="Phương tiện">
                  <option value="">— Chọn phương tiện —</option>
                  {Object.keys(groupedVehicleOptions).length === 0 ? (
                    <option disabled>— Không tìm thấy xe đối tác tại Điểm khởi hành này —</option>
                  ) : (
                    Object.entries(groupedVehicleOptions as Record<string, Vehicle[]>).map(([companyName, list]) => (
                      <optgroup key={companyName} label={companyName} className="font-bold text-slate-900 bg-slate-100">
                        {list.map((v: Vehicle) => (
                          <option key={v.id} value={v.id} className="font-medium text-slate-700 bg-white">
                            {formatVehicleLabel(v)}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>

              {/* Row 5: Sức chứa (4) + Tối thiểu (4) */}
              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sức chứa tối đa *</label>
                <Input type="number" min={1} value={basicInfo.maximumSlots}
                  onChange={e => handleBasicChange('maximumSlots', parseInt(e.target.value) || 1)}
                  className={customInputClass}
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Khách tối thiểu</label>
                <Input type="number" min={1} value={basicInfo.minPeople}
                  onChange={e => handleBasicChange('minPeople', parseInt(e.target.value) || 1)}
                  className={customInputClass}
                />
              </div>

              {/* Row 6: Mô tả (12) */}
              <div className="col-span-12">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mô tả tour</label>
                <Textarea placeholder="Viết mô tả hấp dẫn về tour du lịch này..." value={basicInfo.description}
                  onChange={e => handleBasicChange('description', e.target.value)}
                  className={customTextareaClass}
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 2: ITINERARY ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Cost panel */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng chi phí DV</p>
                  <p className="text-lg font-black text-white mt-0.5">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalServiceCost)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Σ(Hotel + Nhà hàng + Vé)</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Percent className="w-3 h-3" /> Biên lợi nhuận</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="range" min={5} max={80} value={profitMargin}
                      onChange={e => setProfitMargin(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-emerald-400 font-black text-base w-12 text-right">{profitMargin}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Giá đề xuất</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(suggestedPrice)}
                  </p>
                  <button onClick={() => handleBasicChange('price', suggestedPrice)}
                    className="mt-1 text-[10px] font-bold text-slate-300 hover:text-emerald-300 underline transition-colors">
                    Áp dụng giá này →
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Loại hoạt động:</span>
                {(Object.keys(ACT_CFG) as ActivityType[]).map(t => {
                  const cfg = ACT_CFG[t];
                  return (
                    <span key={t} className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
                      <i className={`${cfg.iconClass} text-[10px]`} /> {cfg.label}
                    </span>
                  );
                })}
              </div>

              {/* Days */}
              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1 scrollbar-thin">
                {days.map((day, di) => (
                  <div key={di} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Day header – collapse toggle */}
                    <button
                      onClick={() => toggleCollapse(di)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors text-left"
                    >
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs flex-shrink-0">
                        {day.dayNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <input
                          value={day.title}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setDays(prev => prev.map((d, i) => i === di ? { ...d, title: e.target.value } : d))}
                          className="w-full bg-transparent font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-1"
                          placeholder={`Tiêu đề ngày ${day.dayNumber}`}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {day.activities.length} hoạt động •{' '}
                          {day.activities.filter(a => a.hotelId || a.restaurantId || a.serviceId).length} gán DV
                        </span>
                        {day.collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Collapsed content */}
                    {!day.collapsed && (
                      <div className="p-3 bg-white space-y-2 border-t border-slate-100">
                        {/* Description */}
                        <input
                          value={day.description}
                          onChange={e => setDays(prev => prev.map((d, i) => i === di ? { ...d, description: e.target.value } : d))}
                          placeholder="Mô tả tổng quan ngày này..."
                          className="w-full text-xs text-slate-500 bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-4 focus:border-emerald-500 focus:ring-emerald-500/15 transition-all"
                        />

                        {/* Activities */}
                        <div className="space-y-2">
                          {day.activities.map((act, ai) => (
                            <ActivityRow
                              key={act.id || ai}
                              act={act} index={ai} total={day.activities.length}
                              hotels={hotels} restaurants={restaurants} services={services} locations={locations}
                              allowedParentIds={[
                                ...tourStops.filter(Boolean),
                                basicInfo.endDestinationId,
                              ].filter((id, idx, arr) => !!id && arr.indexOf(id) === idx)}
                              onChange={(field, value) => updateActivity(di, ai, field, value)}
                              onRemove={() => removeActivity(di, ai)}
                              onMoveUp={() => moveActivity(di, ai, 'up')}
                              onMoveDown={() => moveActivity(di, ai, 'down')}
                            />
                          ))}
                        </div>

                        {/* Add activity button */}
                        <button
                          onClick={() => addActivity(di)}
                          className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-1.5 bg-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm hoạt động
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: IMAGES ══════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 font-medium">
                ☁️ Tải lên tối đa 3 ảnh đẹp nhất của tour. Ảnh đầu tiên sẽ làm ảnh đại diện.
              </div>
              <div className="grid grid-cols-3 gap-5">
                {[0, 1, 2].map(idx => (
                  <div key={idx} className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden group hover:border-emerald-400 transition-colors" style={{ minHeight: 220 }}>
                    {tourImageUrls[idx] ? (
                      <div className="relative h-full">
                        <img src={tourImageUrls[idx]} alt={`Tour ${idx + 1}`} className="w-full h-52 object-cover" />
                        {idx === 0 && <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Ảnh bìa</span>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <Button onClick={() => { const n = [...tourImageUrls]; n[idx] = ''; setTourImageUrls(n); }} size="sm" variant="outline" className="bg-white text-rose-600 border-rose-200 text-xs rounded-lg"><Trash2 className="w-3 h-3 mr-1" /> Xóa</Button>
                        </div>
                      </div>
                    ) : uploadingIdx === idx ? (
                      <div className="h-52 flex flex-col items-center justify-center gap-2">
                        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
                        <p className="text-xs text-emerald-600 font-semibold">Đang tải lên...</p>
                      </div>
                    ) : (
                      <label className="h-52 flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <Upload className="w-10 h-10 text-slate-300" />
                        <span className="text-sm font-bold text-slate-400">Ảnh {idx + 1}</span>
                        <span className="text-[10px] text-slate-300">Click để chọn ảnh</span>
                        <input type="file" accept="image/*" onChange={e => handleImageSelect(e, idx)} className="hidden" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 4: SCHEDULE ════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Info banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Thêm Lịch Khởi Hành</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Thiết lập ngày khởi hành, phân công Hướng dẫn viên và đặt giá cho từng chuyến đi. Bạn có thể bổ sung thêm sau khi tạo tour.</p>
                </div>
              </div>

              {/* Schedule form */}
              <div className="p-5 bg-white border border-slate-300 rounded-lg space-y-4 shadow-xs">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">➕ Thêm lịch mới</p>

                {/* Row 1: Dates + Vehicle + Price */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ngày khởi hành *</label>
                    <Input type="date" value={scheduleForm.startDate}
                      onChange={e => setScheduleForm(s => ({ ...s, startDate: e.target.value }))}
                      className={customInputClass}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ngày kết thúc *</label>
                    <Input type="date" value={scheduleForm.endDate}
                      onChange={e => setScheduleForm(s => ({ ...s, endDate: e.target.value }))}
                      className={customInputClass}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phương tiện *</label>
                    <select value={scheduleForm.vehicleId}
                      onChange={e => setScheduleForm(s => ({ ...s, vehicleId: e.target.value }))}
                      className={customSelectClass} title="Phương tiện"
                    >
                      <option value="">— Chọn xe —</option>
                      {Object.keys(groupedVehicleOptions).length === 0 ? (
                        <option disabled>— Không tìm thấy xe đối tác tại Điểm khởi hành này —</option>
                      ) : (
                        Object.entries(groupedVehicleOptions as Record<string, Vehicle[]>).map(([companyName, list]) => (
                          <optgroup key={companyName} label={companyName} className="font-bold text-slate-900 bg-slate-100">
                            {list.map((v: Vehicle) => (
                              <option key={v.id} value={v.id} className="font-medium text-slate-700 bg-white">
                                🚌 {formatVehicleLabel(v)}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Giá tour (VNĐ)</label>
                    <Input type="number" min={0} value={scheduleForm.price}
                      onChange={e => setScheduleForm(s => ({ ...s, price: parseFloat(e.target.value) || 0 }))}
                      className={`${customInputClass} font-bold text-emerald-600`}
                    />
                  </div>
                </div>

                {/* Row 2: Tour Guide Assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                    <span>👤</span> Phân công Hướng dẫn viên
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={scheduleGuideDropdown}
                      onChange={e => setScheduleGuideDropdown(e.target.value)}
                      className={`${customSelectClass} flex-1`}
                      title="Hướng dẫn viên"
                    >
                      <option value="">— Chọn Hướng dẫn viên —</option>
                      {tourGuides
                        .filter(g => !scheduleForm.guideIds.includes(g.id))
                        .map(g => (
                          <option key={g.id} value={g.id}>
                            {g.fullName} {g.phone ? `(${g.phone})` : ''}
                          </option>
                        ))
                      }
                    </select>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!scheduleGuideDropdown) return;
                        setScheduleForm(s => ({ ...s, guideIds: [...s.guideIds, scheduleGuideDropdown] }));
                        setScheduleGuideDropdown('');
                      }}
                      disabled={!scheduleGuideDropdown}
                      className="bg-teal-600 hover:bg-teal-700 rounded-lg h-11 px-4 flex-shrink-0 gap-1 text-white font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm
                    </Button>
                  </div>
                  {/* Selected guides pills */}
                  {scheduleForm.guideIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {scheduleForm.guideIds.map(gid => {
                        const guide = tourGuides.find(g => g.id === gid);
                        return guide ? (
                          <span key={gid} className="inline-flex items-center gap-1.5 bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold px-3 py-1 rounded-full">
                            👤 {guide.fullName}
                            <button
                              type="button"
                              onClick={() => setScheduleForm(s => ({ ...s, guideIds: s.guideIds.filter(id => id !== gid) }))}
                              className="w-3.5 h-3.5 rounded-full bg-teal-300 hover:bg-teal-500 text-white flex items-center justify-center ml-0.5 transition-colors cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Row 3: Note + Add button */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ghi chú</label>
                    <Input value={scheduleForm.note}
                      onChange={e => setScheduleForm(s => ({ ...s, note: e.target.value }))}
                      placeholder="VD: Ưu tiên khách VIP, phòng tầng cao..."
                      className={customInputClass}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!scheduleForm.startDate || !scheduleForm.endDate || !scheduleForm.vehicleId) {
                        setError('Vui lòng nhập đủ: Ngày khởi hành, Ngày kết thúc, Phương tiện');
                        return;
                      }
                      setSchedules(s => [...s, { ...scheduleForm }]);
                      setScheduleForm({ startDate: '', endDate: '', vehicleId: '', price: suggestedPrice, bookedPeople: 0, note: '', guideIds: [] });
                      setScheduleGuideDropdown('');
                      setError(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-lg h-11 px-6 gap-1.5 flex-shrink-0 font-bold text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm lịch
                  </Button>
                </div>
              </div>

              {/* Schedule list */}
              {schedules.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">{schedules.length}</span>
                    Lịch đã thêm
                  </h3>
                  {schedules.map((s, i) => {
                    const vehicle = vehicles.find(v => v.id === s.vehicleId);
                    const guideNames = s.guideIds.map(gid => tourGuides.find(g => g.id === gid)?.fullName).filter(Boolean);
                    return (
                      <div key={i} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs hover:shadow-sm transition-all">
                        {/* Header row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <div>
                              <p className="font-bold text-sm text-slate-900">
                                📅 {s.startDate} → {s.endDate}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                🚌 {vehicle ? `${vehicle.type} (${vehicle.seatCount} chỗ)` : 'Chưa chọn xe'}
                                {s.price > 0 && <span className="ml-2 font-bold text-emerald-600">• {new Intl.NumberFormat('vi-VN').format(s.price)}đ</span>}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSchedules(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                            title="Xóa lịch này"
                          >
                            <i className="fa-solid fa-trash-can text-sm" />
                          </button>
                        </div>
                        {/* Details row */}
                        <div className="px-4 py-2.5 flex items-center gap-4 flex-wrap">
                          {/* Guides */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase text-slate-400">HDV:</span>
                            {guideNames.length > 0
                              ? guideNames.map((name, gi) => (
                                <span key={gi} className="text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">👤 {name}</span>
                              ))
                              : <span className="text-[10px] text-slate-400 italic">Chưa phân công</span>
                            }
                          </div>
                          {/* Note */}
                          {s.note && (
                            <span className="text-[10px] text-slate-400 italic">📝 {s.note}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-300 rounded-lg bg-white">
                  <span className="text-4xl mb-3">🗓️</span>
                  <p className="text-sm font-bold text-slate-400">Chưa có lịch khởi hành nào</p>
                  <p className="text-xs text-slate-300 mt-1">Điền form bên trên và nhấn "Thêm lịch" để bắt đầu</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 pb-7 pt-4 border-t border-slate-100 flex justify-between gap-3 sticky bottom-0 bg-white z-20 rounded-b-2xl">
          <div className="flex-1 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ⚡ Bước {step} / 4 — {step === 1 ? 'Thông tin cơ bản' : step === 2 ? 'Lịch trình chi tiết' : step === 3 ? 'Hình ảnh' : 'Lịch khởi hành'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button onClick={handlePrev} variant="outline" disabled={isSubmitting} className="rounded-lg font-bold gap-1 cursor-pointer">
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </Button>
            )}
            <Button onClick={handleClose} variant="outline" disabled={isSubmitting} className="rounded-lg text-slate-500 cursor-pointer">Hủy</Button>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={isSubmitting || loadingData} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold gap-1 px-6 text-white cursor-pointer">
                Tiếp theo <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold px-8 gap-2 text-white cursor-pointer">
                {isSubmitting ? <><Loader className="w-4 h-4 animate-spin" /> Đang tạo...</> : <><Check className="w-4 h-4" /> Hoàn thành & Lưu Tour</>}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
