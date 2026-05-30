'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Account } from '@/types';
import { apiClient } from '@/lib/api-client';

interface Branch {
  id: string;
  name: string;
  location?: string;
  address?: string;
}

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => Promise<void>;
  account?: Account | null;
  isLoading?: boolean;
}

export function AccountDialog({
  isOpen,
  onClose,
  onSubmit,
  account,
  isLoading,
}: AccountDialogProps) {
  const [formData, setFormData] = useState({
    userName: '',
    fullName: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    dateOfBirth: '',
    role: 'CUSTOMER',
    user_type: 'CUSTOMER',
    branchId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<Branch[]>([]);

  // Update form data when account changes
  useEffect(() => {
    if (account) {
      setFormData({
        userName: account.userName || '',
        fullName: account.fullName || '',
        phone: account.phone || '',
        email: account.email || '',
        password: '',
        address: account.address || '',
        dateOfBirth: account.dateOfBirth || '',
        role: account.role || 'CUSTOMER',
        user_type: account.role || 'CUSTOMER',
        branchId: account.branch?.id || '',
      });
    } else {
      setFormData({
        userName: '',
        fullName: '',
        phone: '',
        email: '',
        password: '',
        address: '',
        dateOfBirth: '',
        role: 'CUSTOMER',
        user_type: 'CUSTOMER',
        branchId: '',
      });
    }
    setErrors({});
  }, [account, isOpen]);

  // Fetch branches from /branches when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchBranches = async () => {
        try {
          const response = await apiClient.get<Branch[]>('/branches');
          if (response.success && response.data) {
            setBranches(response.data);
          } else {
            console.error('Failed to fetch branches:', response.message);
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
        }
      };
      void fetchBranches();
    }
  }, [isOpen]);

  const roles = [
    { value: 'ADMIN', label: 'Quản trị viên' },
    { value: 'MANAGER', label: 'Quản lý' },
    { value: 'TOURGUIDE', label: 'Hướng dẫn viên' },
    { value: 'CONSULTANT', label: 'Tư vấn viên' },
    { value: 'TOURPLANNER', label: 'Lịch trình viên' },
    { value: 'USER', label: 'Người dùng' },
    { value: 'CUSTOMER', label: 'Khách hàng' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Tên người dùng không được để trống';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!account && !formData.password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống khi tạo tài khoản';
    }
    if ((formData.role === 'TOURPLANNER' || formData.role === 'TOURGUIDE') && !formData.branchId) {
      newErrors.branchId = 'Vui lòng chọn chi nhánh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const isPlannerOrGuide = formData.role === 'TOURPLANNER' || formData.role === 'TOURGUIDE';
      const submitData = {
        ...formData,
        branch: isPlannerOrGuide && formData.branchId ? { id: formData.branchId } : null,
      };

      await onSubmit(submitData);
      setFormData({
        userName: '',
        fullName: '',
        phone: '',
        email: '',
        password: '',
        address: '',
        dateOfBirth: '',
        role: 'CUSTOMER',
        user_type: 'CUSTOMER',
        branchId: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{account ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</DialogTitle>
          <DialogDescription>
            {account
              ? 'Cập nhật thông tin tài khoản'
              : 'Điền thông tin để tạo tài khoản mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="userName">Tên người dùng *</Label>
            <Input
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Nhập tên người dùng"
              className={`rounded-2xl ${errors.userName ? 'border-red-500' : ''}`}
            />
            {errors.userName && (
              <p className="text-xs text-red-600">{errors.userName}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nhập họ tên"
              className={`rounded-2xl ${errors.fullName ? 'border-red-500' : ''}`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              className={`rounded-2xl ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Mật khẩu {!account && '*'}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={account ? 'Để trống nếu không thay đổi' : 'Nhập mật khẩu'}
              className={`rounded-2xl ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Điện thoại</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
              className="rounded-2xl"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ"
              className="rounded-2xl"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="rounded-2xl"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <select
              id="role"
              name="role"
              title="Chọn vai trò"
              value={formData.role}
              onChange={(e) => {
                handleChange(e);
                setFormData(prev => ({ ...prev, user_type: e.target.value }));
              }}
              className="w-full px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {roles.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Selector (Only for TOURPLANNER and TOURGUIDE) */}
          {(formData.role === 'TOURPLANNER' || formData.role === 'TOURGUIDE') && (
            <div className="space-y-2">
              <Label htmlFor="branchId">Chi nhánh *</Label>
              <select
                id="branchId"
                name="branchId"
                title="Chọn chi nhánh"
                value={formData.branchId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, branchId: e.target.value }));
                  if (errors.branchId) {
                    setErrors(prev => ({ ...prev, branchId: '' }));
                  }
                }}
                className={`w-full px-4 py-2 rounded-2xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.branchId ? 'border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="">Chọn chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-xs text-red-600">{errors.branchId}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : account ? 'Cập nhật' : 'Thêm tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
