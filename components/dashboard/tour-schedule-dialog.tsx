'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Schedule } from '@/types';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { tourService } from '@/services/tourService';

interface TourScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourName: string;
  schedules?: Schedule[];
  onSchedulesUpdate?: (schedules: Schedule[]) => void;
}

export function TourScheduleDialog({
  isOpen,
  onClose,
  tourId,
  tourName,
  schedules = [],
  onSchedulesUpdate,
}: TourScheduleDialogProps) {
  
  const [items, setItems] = useState<Schedule[]>(schedules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Schedule>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditingData({ ...schedule });
  };

  const handleSaveEdit = async (id: string) => {
    // Update local state first
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...editingData } : item
    );
    setItems(updated);
    
    // Get the updated schedule
    const updatedSchedule = updated.find(item => item.id === id);
    if (!updatedSchedule) return;
    
    // Immediately save to backend
    try {
      const editableFields = ['startDate', 'endDate', 'price', 'bookedPeople', 'availableSlot', 'note', 'active', 'isActive'];
      const cleanedSchedule: any = { id: updatedSchedule.id };
      
      // Include tourId to prevent backend from setting it to NULL
      if ((updatedSchedule as any).tourId) {
        cleanedSchedule.tourId = (updatedSchedule as any).tourId;
      }
      
      editableFields.forEach(field => {
        if (field in updatedSchedule) {
          const value = (updatedSchedule as any)[field];
          if (value !== null && value !== undefined) {
            cleanedSchedule[field] = value;
          }
        }
      });

      console.log('💾 Saving single schedule:', cleanedSchedule);
      const response = await tourService.updateTourSchedule(id, cleanedSchedule);
      
      if (response.success) {
        console.log('✅ Schedule saved successfully');
      } else {
        console.error('❌ Failed to save schedule:', response.message);
        alert(`Lỗi: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Error saving schedule:', err);
      alert('Lỗi: Không thể cập nhật lịch trình. Vui lòng thử lại.');
    }
    
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleClose = () => {
    onSchedulesUpdate?.(items);
    onClose();
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Only send editable fields, exclude id and tourId
      const editableFields = ['startDate', 'endDate', 'price', 'bookedPeople', 'availableSlot', 'note', 'active', 'isActive'];
      const cleanedSchedules = items.map(schedule => {
        const cleaned: any = { id: schedule.id }; // Keep id to identify which schedule to update
        editableFields.forEach(field => {
          if (field in schedule) {
            const value = (schedule as any)[field];
            if (value !== null && value !== undefined) {
              cleaned[field] = value;
            }
          }
        });
        return cleaned;
      });

      console.log('💾 Saving cleaned schedules (only editable fields):', cleanedSchedules);
      const response = await tourService.updateTourSchedules(cleanedSchedules);
      
      if (response.success) {
        console.log('✅ Schedules saved successfully');
        alert('Lịch trình đã được cập nhật thành công!');
        onSchedulesUpdate?.(items);
        onClose();
      } else {
        console.error('❌ Failed to save schedules:', response.message);
        alert(`Lỗi: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Error saving schedules:', err);
      alert('Lỗi: Không thể cập nhật lịch trình. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh Sửa Lịch Trình</DialogTitle>
          <DialogDescription>
            Quản lý các lịch trình cho tour: {tourName}
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Không có lịch trình nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((schedule) => (
              <Card key={schedule.id} className="p-4">
                {editingId === schedule.id ? (
                  // Editing mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Ngày bắt đầu
                        </label>
                        <Input
                          type="date"
                          value={editingData.startDate || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              startDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Ngày kết thúc
                        </label>
                        <Input
                          type="date"
                          value={editingData.endDate || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              endDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Giá
                        </label>
                        <Input
                          type="number"
                          value={editingData.price || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              price: parseFloat(e.target.value),
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Chỗ trống
                        </label>
                        <Input
                          type="number"
                          value={editingData.availableSlot || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              availableSlot: parseInt(e.target.value),
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">
                        Ghi chú
                      </label>
                      <Input
                        value={editingData.note || ''}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            note: e.target.value,
                          })
                        }
                        className="mt-1"
                        placeholder="Ghi chú thêm..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditingData({});
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleSaveEdit(schedule.id)}
                      >
                        Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 font-medium">Từ ngày</p>
                        <p className="text-slate-900">{schedule.startDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Đến ngày</p>
                        <p className="text-slate-900">{schedule.endDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Giá</p>
                        <p className="text-slate-900 font-semibold">
                          {schedule.price.toLocaleString()}đ
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Chỗ trống</p>
                        <p className="text-slate-900">
                          {schedule.availableSlot}/{schedule.availableSlot + schedule.bookedPeople}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(schedule)}
                        className="gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-700 gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
