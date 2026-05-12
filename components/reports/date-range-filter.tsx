'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeFilterProps) {
  const [localStartDate, setLocalStartDate] = useState<string>(
    startDate ? format(startDate, 'yyyy-MM-dd') : ''
  );
  const [localEndDate, setLocalEndDate] = useState<string>(
    endDate ? format(endDate, 'yyyy-MM-dd') : ''
  );

  const handleApply = () => {
    const start = localStartDate ? new Date(localStartDate) : null;
    const end = localEndDate ? new Date(localEndDate) : null;
    onDateRangeChange(start, end);
  };

  const handleReset = () => {
    const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const defaultEnd = new Date();
    setLocalStartDate(format(defaultStart, 'yyyy-MM-dd'));
    setLocalEndDate(format(defaultEnd, 'yyyy-MM-dd'));
    onDateRangeChange(defaultStart, defaultEnd);
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    setLocalStartDate(format(start, 'yyyy-MM-dd'));
    setLocalEndDate(format(end, 'yyyy-MM-dd'));
    onDateRangeChange(start, end);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Quick Range Buttons */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Lọc nhanh
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickRange(7)}
            >
              7 ngày qua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickRange(30)}
            >
              30 ngày qua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickRange(90)}
            >
              90 ngày qua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Đặt lại
            </Button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
              Từ ngày
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                id="startDate"
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="flex-1 border-0 outline-none text-sm"
              />
            </div>
            {localStartDate && (
              <p className="text-xs text-slate-500">
                {format(new Date(localStartDate), 'EEEE, d MMMM yyyy', { locale: vi })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
              Đến ngày
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                id="endDate"
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="flex-1 border-0 outline-none text-sm"
              />
            </div>
            {localEndDate && (
              <p className="text-xs text-slate-500">
                {format(new Date(localEndDate), 'EEEE, d MMMM yyyy', { locale: vi })}
              </p>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Áp dụng bộ lọc
          </Button>
        </div>
      </div>
    </Card>
  );
}
