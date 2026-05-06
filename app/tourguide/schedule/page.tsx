"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const assignedTours = [
  {
    id: "schedule-001",
    name: "Phu Quoc 4N3D - All Inclusive",
    date: "2025-04-10",
    location: "Phu Quoc",
    groupSize: 12,
  },
  {
    id: "schedule-002",
    name: "Da Lat Mua Hoa 3N2D",
    date: "2025-05-05",
    location: "Da Lat",
    groupSize: 8,
  },
  {
    id: "schedule-003",
    name: "Hoi An - Pho Co 2N1D",
    date: "2025-04-20",
    location: "Hoi An",
    groupSize: 4,
  },
];

export default function TourGuideSchedule() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-600">
          Tour Guide Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Lich tour duoc phan cong
        </h1>
        <p className="mt-2 text-slate-500">
          Theo doi thong tin lich trinh va nhom khach ma ban dang phu trach.
        </p>
      </div>

      <div className="grid gap-4">
        {assignedTours.map((tour) => (
          <div
            key={tour.id}
            className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {tour.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-cyan-600" />
                    {tour.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-600" />
                    {tour.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-600" />
                    {tour.groupSize} khach
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                Dang phu trach
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
