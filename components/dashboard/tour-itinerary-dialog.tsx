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
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { tourService } from '@/services/tourService';

export interface Itinerary {
  id: string;
  locationName?: string;
  visitOrder?: number;
  days?: number;
  note?: string;
  // For TourItinerary structure
  dayNumber?: number;
  title?: string;
  description?: string;
}

interface TourItineraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourName: string;
  itineraries?: Itinerary[];
  onItinerariesUpdate?: (itineraries: Itinerary[]) => void;
}

export function TourItineraryDialog({
  isOpen,
  onClose,
  tourId,
  tourName,
  itineraries = [],
  onItinerariesUpdate,
}: TourItineraryDialogProps) {
  const [items, setItems] = useState<Itinerary[]>(itineraries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Itinerary>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Itinerary>>({});

  const handleEdit = (itinerary: Itinerary) => {
    setEditingId(itinerary.id);
    setEditingData({ ...itinerary });
  };

  const handleSaveEdit = async (id: string) => {
    // Update local state first
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...editingData } : item
    );
    setItems(updated);

    // Get the updated itinerary
    const updatedItinerary = updated.find(item => item.id === id);
    if (!updatedItinerary) return;

    // Immediately save to backend
    try {
      const cleanedItinerary: any = { id: updatedItinerary.id };
      
      // Support both TourLocation (visitOrder/days) and TourItinerary (dayNumber/title/description) structures
      const editableFields = ['visitOrder', 'days', 'note', 'dayNumber', 'title', 'description'];
      editableFields.forEach(field => {
        if (field in updatedItinerary) {
          const value = (updatedItinerary as any)[field];
          if (value !== null && value !== undefined) {
            cleanedItinerary[field] = value;
          }
        }
      });

      console.log('💾 Saving single itinerary:', cleanedItinerary);
      const response = await tourService.updateTourItinerary(id, cleanedItinerary);

      if (response.success) {
        console.log('✅ Itinerary saved successfully');
      } else {
        console.error('❌ Failed to save itinerary:', response.message);
        alert(`Lỗi: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Error saving itinerary:', err);
      alert('Lỗi: Không thể cập nhật lịch trình. Vui lòng thử lại.');
    }

    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa lịch trình này?')) return;

    try {
      const response = await tourService.deleteTourItinerary(id);
      if (response.success) {
        setItems(items.filter((item) => item.id !== id));
        console.log('✅ Itinerary deleted successfully');
      } else {
        alert(`Lỗi: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Error deleting itinerary:', err);
      alert('Lỗi: Không thể xóa lịch trình. Vui lòng thử lại.');
    }
  };

  const handleAddNew = async () => {
    if (!newItem.locationName || !newItem.visitOrder || !newItem.days) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const payload = {
        tourId,
        locationName: newItem.locationName,
        visitOrder: newItem.visitOrder,
        days: newItem.days,
        note: newItem.note || '',
      };

      console.log('➕ Creating new itinerary:', payload);
      const response = await tourService.createTourItinerary(payload);

      if (response.success && response.data) {
        setItems([...items, response.data]);
        setNewItem({});
        setIsAddingNew(false);
        console.log('✅ Itinerary created successfully');
      } else {
        alert(`Lỗi: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Error creating itinerary:', err);
      alert('Lỗi: Không thể tạo lịch trình. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    onItinerariesUpdate?.(items);
    onClose();
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

        {items.length === 0 && !isAddingNew ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Không có lịch trình nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((itinerary) => (
              <Card key={itinerary.id} className="p-4">
                {editingId === itinerary.id ? (
                  // Editing mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Địa điểm
                        </label>
                        <Input
                          type="text"
                          value={editingData.locationName || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              locationName: e.target.value,
                            })
                          }
                          className="mt-1"
                          placeholder="Tên địa điểm..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Thứ tự
                        </label>
                        <Input
                          type="number"
                          value={editingData.visitOrder || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              visitOrder: parseInt(e.target.value),
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          Số ngày
                        </label>
                        <Input
                          type="number"
                          value={editingData.days || ''}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              days: parseInt(e.target.value),
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
                        onClick={() => handleSaveEdit(itinerary.id)}
                      >
                        Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode - flexible to show either TourLocation or TourItinerary structure
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 font-medium">
                          {itinerary.locationName !== undefined ? 'Địa điểm' : 'Tiêu đề'}
                        </p>
                        <p className="text-slate-900">
                          {itinerary.locationName || itinerary.title || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">
                          {itinerary.visitOrder !== undefined ? 'Thứ tự' : 'Ngày'}
                        </p>
                        <p className="text-slate-900">
                          {itinerary.visitOrder || itinerary.dayNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Số ngày</p>
                        <p className="text-slate-900">{itinerary.days || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Ghi chú</p>
                        <p className="text-slate-900 truncate">
                          {itinerary.note || itinerary.description || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(itinerary)}
                        className="gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(itinerary.id)}
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

            {isAddingNew && (
              <Card className="p-4 border-dashed border-2 border-emerald-300 bg-emerald-50">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700">
                        Địa điểm
                      </label>
                      <Input
                        type="text"
                        value={newItem.locationName || ''}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            locationName: e.target.value,
                          })
                        }
                        className="mt-1"
                        placeholder="Tên địa điểm..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">
                        Thứ tự
                      </label>
                      <Input
                        type="number"
                        value={newItem.visitOrder || ''}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            visitOrder: parseInt(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">
                        Số ngày
                      </label>
                      <Input
                        type="number"
                        value={newItem.days || ''}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            days: parseInt(e.target.value),
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
                      value={newItem.note || ''}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
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
                        setIsAddingNew(false);
                        setNewItem({});
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleAddNew}
                    >
                      Thêm
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Thêm Lịch Trình
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
