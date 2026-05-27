'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, AlertCircle, Download } from 'lucide-react';

interface TourImage {
  id: string;
  imageUrl: string;
  createdAt?: string;
}

interface TourImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourName?: string;
  onImageAdded?: () => void;
  onImageDeleted?: () => void;
}

export function TourImageDialog({
  isOpen,
  onClose,
  tourId,
  tourName,
  onImageAdded,
  onImageDeleted,
}: TourImageDialogProps) {
  const [images, setImages] = useState<TourImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTourImages();
    }
  }, [isOpen, tourId]);

  const fetchTourImages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching images for tour:', tourId);
      const response = await fetch(`http://localhost:8080/api/tour-images/tour/${tourId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Images fetched:', data);
        setImages(Array.isArray(data) ? data : data.data || []);
      } else {
        console.error('Failed to fetch images. Status:', response.status);
        setError('Không thể tải ảnh của tour');
        setImages([]);
      }
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setError('Có lỗi khi tải ảnh: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setIsUploading(true);
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            // Create TourImage object
            const tourImageData = {
              id: '',
              imageUrl: `temp_${Date.now()}_${i}`,
              tour: { id: tourId }
            };

            const response = await fetch('http://localhost:8080/api/tour-images', {
              method: 'POST',
              body: formData,
              headers: {
                'X-Tour-ID': tourId,
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to upload image: ${file.name}`);
            }
          }

          alert(`Thêm ${files.length} ảnh thành công!`);
          fetchTourImages();
          onImageAdded?.();
        } catch (err) {
          console.error('Failed to add images:', err);
          alert('Lỗi: Không thể thêm ảnh. Vui lòng thử lại.');
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
  };

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/tour-images/${imageId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setImages(images.filter((img) => img.id !== imageId));
          alert('Xóa ảnh thành công!');
          onImageDeleted?.();
          fetchTourImages();
        } else {
          alert('Lỗi: Không thể xóa ảnh.');
        }
      } catch (err) {
        console.error('Failed to delete image:', err);
        alert('Lỗi: Không thể xóa ảnh.');
      }
    }
  };

  const handleDownloadImage = (imageUrl: string, imageName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || 'tour-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản Lý Ảnh Tour</DialogTitle>
          <DialogDescription>
            {tourName && <span>Tour: <strong>{tourName}</strong></span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Image Button */}
          <div>
            <Button
              onClick={handleAddImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
              disabled={isLoading || isUploading}
            >
              <Plus className="w-4 h-4" />
              {isUploading ? 'Đang tải lên...' : 'Thêm Ảnh Mới'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Lỗi</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <p className="text-slate-500">Đang tải ảnh...</p>
            </div>
          )}

          {/* Images List */}
          {!isLoading && images.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Không có ảnh nào. Hãy thêm ảnh mới!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                  <div className="p-4">
                    {/* Image Preview */}
                    <div className="mb-3 rounded-xl overflow-hidden bg-slate-100 h-48 flex items-center justify-center">
                      <img
                        src={image.imageUrl}
                        alt="Tour"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/300x200?text=Image+Not+Found';
                        }}
                      />
                    </div>

                    {/* Image Info */}
                    <div className="space-y-2 mb-4">
                      {image.createdAt && (
                        <div>
                          <p className="text-xs text-slate-500">Ngày tạo</p>
                          <p className="text-xs text-slate-700">
                            {new Date(image.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadImage(image.imageUrl, `tour-image-${image.id}.jpg`)}
                        className="flex-1 rounded-xl"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Tải Về
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteImage(image.id)}
                        className="rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Close Button */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-2xl"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
