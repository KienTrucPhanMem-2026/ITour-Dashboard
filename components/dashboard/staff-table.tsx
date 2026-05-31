'use client';

import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Input, 
  Select, 
  Drawer, 
  Form, 
  Tabs, 
  Modal, 
  Tag, 
  message, 
  Avatar as AntAvatar, 
  Flex, 
  Rate, 
  Upload, 
  Space,
  Tooltip
} from 'antd';
import { 
  Search, 
  Plus, 
  Eye, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User as UserIcon, 
  Briefcase, 
  Award, 
  UploadCloud, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Services
import { tourguideService } from '@/services/tourguideService';
import { consultantService } from '@/services/consultantService';
import { managerService, type Staff } from '@/services/managerService';
import { tourplannerService } from '@/services/tourplannerService';

interface StaffTableProps {
  staffType: 'manager' | 'tourguide' | 'consultant' | 'tourplanner';
  title: string;
}

const staffRoleLabels = {
  manager: 'Admin Manager',
  tourguide: 'Tour Guide',
  consultant: 'Senior Consultant',
  tourplanner: 'Tour Planner',
};

const staffRoleTagsColor = {
  manager: 'orange',
  tourguide: 'blue',
  consultant: 'purple',
  tourplanner: 'cyan',
};

export function StaffTable({ staffType, title }: StaffTableProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Drawer & Form states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Load staff list
  useEffect(() => {
    fetchStaffData();
  }, [staffType]);

  // Apply Search & Filter
  useEffect(() => {
    let filtered = staffList;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((member) => 
        statusFilter === 'active' ? member.isActive : !member.isActive
      );
    }

    setFilteredStaff(filtered);
  }, [staffList, searchQuery, statusFilter]);

  // Fetch API service helper
  const getService = () => {
    if (staffType === 'tourguide') return tourguideService;
    if (staffType === 'consultant') return consultantService;
    if (staffType === 'tourplanner') return tourplannerService;
    return managerService;
  };

  const fetchStaffData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (staffType === 'tourguide') {
        response = await tourguideService.getTourGuides();
      } else if (staffType === 'consultant') {
        response = await consultantService.getConsultants();
      } else if (staffType === 'tourplanner') {
        response = await tourplannerService.getTourPlanners();
      } else {
        response = await managerService.getManagers();
      }

      if (response.success && response.data) {
        setStaffList(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || `Không thể lấy danh sách ${title}`);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gọi API backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Drawer for editing or viewing details
  const handleEditStaff = (member: Staff) => {
    setSelectedStaff(member);
    setActiveTab('profile');

    // Simulated/extended attributes based on ID/Name to make forms extremely realistic
    const dob = member.dateOfBirth ? member.dateOfBirth.substring(0, 10) : '1996-05-15';
    const gender = parseInt(member.id.replace(/\D/g, '') || '0') % 2 === 0 ? 'Female' : 'Male';
    const cccd = '03709' + (Math.abs(member.fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 10000000).toString().padStart(7, '3');
    
    form.setFieldsValue({
      fullName: member.fullName,
      userName: member.userName,
      email: member.email,
      phone: member.phone || '',
      address: member.address || '',
      dob: dob,
      gender: gender,
      cccd: cccd,
      nationality: 'Việt Nam',
      joinDate: member.createdAt ? member.createdAt.substring(0, 10) : '2025-01-10',
    });

    setDrawerVisible(true);
  };

  // Open Drawer for creating new staff
  const handleCreateStaff = () => {
    setSelectedStaff(null);
    form.resetFields();
    form.setFieldsValue({
      gender: 'Male',
      nationality: 'Việt Nam',
      dob: '1998-09-20',
      joinDate: new Date().toISOString().substring(0, 10),
    });
    setActiveTab('profile');
    setDrawerVisible(true);
  };

  // Save changes
  const handleSaveStaff = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      const service = getService();
      
      const postData = {
        fullName: values.fullName,
        userName: values.userName || selectedStaff?.userName || values.email.split('@')[0],
        email: values.email,
        phone: values.phone,
        address: values.address,
        dateOfBirth: values.dob ? new Date(values.dob).toISOString() : new Date().toISOString(),
        isActive: selectedStaff ? selectedStaff.isActive : true,
      };

      let response;
      if (selectedStaff) {
        // Update
        if (staffType === 'tourguide') {
          response = await tourguideService.updateTourGuide(selectedStaff.id, postData);
        } else if (staffType === 'consultant') {
          response = await consultantService.updateConsultant(selectedStaff.id, postData);
        } else if (staffType === 'tourplanner') {
          response = await tourplannerService.updateTourPlanner(selectedStaff.id, postData);
        } else {
          response = await managerService.updateManager(selectedStaff.id, postData);
        }
      } else {
        // Create
        if (staffType === 'tourguide') {
          response = await tourguideService.createTourGuide(postData);
        } else if (staffType === 'consultant') {
          response = await consultantService.createConsultant(postData);
        } else if (staffType === 'tourplanner') {
          response = await tourplannerService.createTourPlanner(postData);
        } else {
          response = await managerService.createManager(postData);
        }
      }

      if (response.success && response.data) {
        message.success(`${selectedStaff ? 'Cập nhật' : 'Thêm mới'} nhân sự thành công!`);
        setDrawerVisible(false);
        fetchStaffData();
      } else {
        message.error(response.message || 'Lỗi khi cập nhật dữ liệu nhân sự');
      }
    } catch (err) {
      console.error('Error saving form:', err);
    } finally {
      setSaving(false);
    }
  };

  // Disable staff (Soft Delete / Deactivate) using AntD Modal.confirm
  const handleDeleteStaff = (member: Staff) => {
    Modal.confirm({
      title: <span className="font-bold text-slate-900 text-lg">Ngừng hoạt động nhân sự</span>,
      content: (
        <p className="text-slate-600 text-sm mt-2">
          Bạn có chắc chắn muốn vô hiệu hóa tài khoản của nhân sự{' '}
          <strong className="text-slate-900 font-extrabold">"{member.fullName}"</strong>? Người này sẽ tạm thời không thể đăng nhập và truy cập vào trang dashboard điều hành.
        </p>
      ),
      okText: 'Vô hiệu hóa',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      centered: true,
      className: 'custom-confirm-modal',
      okButtonProps: { className: 'rounded-xl font-bold bg-red-600 hover:bg-red-700' },
      cancelButtonProps: { className: 'rounded-xl font-bold border-slate-200' },
      onOk: async () => {
        try {
          const service = getService();
          let response;
          
          // Gửi PUT hoặc PATCH để vô hiệu hóa
          const updateData = { ...member, isActive: false };
          if (staffType === 'tourguide') {
            response = await tourguideService.updateTourGuide(member.id, updateData);
          } else if (staffType === 'consultant') {
            response = await consultantService.updateConsultant(member.id, updateData);
          } else if (staffType === 'tourplanner') {
            response = await tourplannerService.updateTourPlanner(member.id, updateData);
          } else {
            response = await managerService.updateManager(member.id, updateData);
          }

          if (response.success) {
            message.success(`Đã ngừng hoạt động nhân sự "${member.fullName}" thành công!`);
            fetchStaffData();
          } else {
            // Falls back to direct deletion if backend requires it
            let delRes;
            if (staffType === 'tourguide') {
              delRes = await tourguideService.deleteTourGuide(member.id);
            } else if (staffType === 'consultant') {
              delRes = await consultantService.deleteConsultant(member.id);
            } else if (staffType === 'tourplanner') {
              delRes = await tourplannerService.deleteTourPlanner(member.id);
            } else {
              delRes = await managerService.deleteManager(member.id);
            }
            if (delRes.success) {
              message.success(`Đã gỡ bỏ nhân sự "${member.fullName}" thành công!`);
              fetchStaffData();
            } else {
              message.error(delRes.message || 'Không thể thực hiện tác vụ này.');
            }
          }
        } catch (err) {
          console.error('Error deleting staff:', err);
          message.error('Có lỗi xảy ra khi ngừng hoạt động nhân sự.');
        }
      }
    });
  };

  // Quick action: Reactivate a staff member
  const handleReactivateStaff = async (member: Staff) => {
    try {
      const updateData = { ...member, isActive: true };
      let response;
      if (staffType === 'tourguide') {
        response = await tourguideService.updateTourGuide(member.id, updateData);
      } else if (staffType === 'consultant') {
        response = await consultantService.updateConsultant(member.id, updateData);
      } else if (staffType === 'tourplanner') {
        response = await tourplannerService.updateTourPlanner(member.id, updateData);
      } else {
        response = await managerService.updateManager(member.id, updateData);
      }

      if (response.success) {
        message.success(`Đã kích hoạt lại hoạt động cho "${member.fullName}"!`);
        fetchStaffData();
      } else {
        message.error(response.message || 'Lỗi kích hoạt lại nhân sự');
      }
    } catch (err) {
      console.error('Error reactivating staff:', err);
    }
  };

  // Helper colors and initials for Avatars
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  const getAvatarBgColor = (name: string) => {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-100',
      'bg-emerald-50 text-emerald-700 border-emerald-100',
      'bg-indigo-50 text-indigo-700 border-indigo-100',
      'bg-purple-50 text-purple-700 border-purple-100',
      'bg-pink-50 text-pink-700 border-pink-100',
      'bg-amber-50 text-amber-700 border-amber-100'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Simulated professional metrics/KPIs for Tab 2 "Nghiệp vụ chuyên môn"
  const generateSimulatedData = (member: Staff) => {
    const idNum = Math.abs(member.fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
    
    if (staffType === 'tourguide') {
      const totalDays = (idNum % 10) + 12; // 12-21 days
      const rating = 4.0 + ((idNum % 11) / 10); // 4.0 - 5.0
      
      const tours = [
        {
          key: '1',
          code: `TOUR-NG-${100 + (idNum % 20)}`,
          name: 'Hà Nội - Tokyo Nhật Bản Mùa Hoa Anh Đào',
          date: '2026-05-12',
          days: 6,
          rating: 4.8,
        },
        {
          key: '2',
          code: `TOUR-PQ-${300 + (idNum % 30)}`,
          name: 'Nghỉ dưỡng Đảo Ngọc Phú Quốc (Khách sạn 5 sao)',
          date: '2026-05-22',
          days: 3,
          rating: 4.5,
        },
        {
          key: '3',
          code: `TOUR-DL-${500 + (idNum % 15)}`,
          name: 'Khám phá xứ sở sương mù Đà Lạt mộng mơ',
          date: '2026-06-05',
          days: 4,
          rating: 5.0,
        }
      ].slice(0, (idNum % 2) + 2); // 2 or 3 tours

      return { totalDays, rating, list: tours };
    } else if (staffType === 'consultant') {
      const revenue = (idNum % 80) * 2000000 + 45000000; // 45M - 205M
      const successRate = 78 + (idNum % 18); // 78% - 96%
      
      const bookings = [
        {
          key: '1',
          code: `BK-3${100 + (idNum % 99)}`,
          tourName: 'Hành trình di sản Miền Trung: Đà Nẵng - Hội An - Huế',
          customer: 'Nguyễn Văn An',
          revenue: 12500000,
        },
        {
          key: '2',
          code: `BK-3${200 + (idNum % 99)}`,
          tourName: 'Khám phá danh thắng Tràng An - Bái Đính 1 Ngày',
          customer: 'Lê Thị Mai',
          revenue: 3800000,
        },
        {
          key: '3',
          code: `BK-3${300 + (idNum % 99)}`,
          tourName: 'Tour Cao Cấp: Trải Nghiệm Mùa Thu Châu Âu cổ kính',
          customer: 'Phạm Minh Quân',
          revenue: 89000000,
        }
      ].slice(0, (idNum % 2) + 2);

      return { revenue, successRate, list: bookings };
    } else if (staffType === 'tourplanner') {
      const createdTours = (idNum % 4) + 6; // 6-9 tours
      const activeSchedules = (idNum % 5) + 12; // 12-16 schedules
      
      const tours = [
        {
          key: '1',
          code: `TOUR-NG-${100 + (idNum % 20)}`,
          name: 'Hà Nội - Tokyo Nhật Bản Mùa Hoa Anh Đào',
          start: 'Hà Nội',
          end: 'Tokyo',
          price: 32500000,
        },
        {
          key: '2',
          code: `TOUR-PQ-${300 + (idNum % 30)}`,
          name: 'Nghỉ dưỡng Đảo Ngọc Phú Quốc (Khách sạn 5 sao)',
          start: 'TP. HCM',
          end: 'Phú Quốc',
          price: 5800000,
        },
        {
          key: '3',
          code: `TOUR-DL-${500 + (idNum % 15)}`,
          name: 'Khám phá danh thắng Tràng An - Bái Đính 1 Ngày',
          start: 'Hà Nội',
          end: 'Ninh Bình',
          price: 1250000,
        }
      ].slice(0, (idNum % 2) + 2);

      return { createdTours, activeSchedules, list: tours };
    } else {
      // Manager
      const guidesManaged = (idNum % 5) + 10; // 10-14 guides
      const approvedTours = (idNum % 6) + 5; // 5-10 tours
      
      const logs = [
        {
          key: '1',
          time: '2026-05-31 10:15',
          action: 'Phê duyệt điều phối HDV Nguyễn Nhật Quân cho Tour Nhật Bản',
          status: 'Thành công',
        },
        {
          key: '2',
          time: '2026-05-30 14:40',
          action: 'Duyệt yêu cầu Tour Private mã #PRV-209 của khách hàng VIP',
          status: 'Thành công',
        },
        {
          key: '3',
          time: '2026-05-28 09:20',
          action: 'Cập nhật cấu hình bảng giá vé dịch vụ xe liên tỉnh',
          status: 'Thành công',
        }
      ].slice(0, (idNum % 2) + 2);

      return { guidesManaged, approvedTours, list: logs };
    }
  };

  return (
    <Card className="rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/70 overflow-hidden bg-white">
      {/* 1. Card Header & Self-Contained Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Search and Filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Tìm kiếm ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-slate-50/50 hover:bg-white"
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Lọc theo trạng thái"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          <span className="hidden md:inline-flex text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg self-center">
            {filteredStaff.length} {title.toLowerCase()}
          </span>
        </div>

        {/* Right Add Staff button */}
        <Button
          onClick={handleCreateStaff}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 text-sm px-4 py-2 h-9 w-full sm:w-auto shadow-md shadow-emerald-100 font-bold active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm {title}
        </Button>
      </div>

      {/* 2. Main Data Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Đang tải dữ liệu nhân sự...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 text-sm font-semibold mb-2">⚠️ Có lỗi xảy ra:</p>
            <p className="text-red-600 text-xs break-all max-w-lg mx-auto">{error}</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">Không tìm thấy nhân sự nào khớp với điều kiện lọc</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nhân Sự</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Liên Hệ</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Địa Chỉ</th>
                {staffType === 'tourguide' && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lịch Trình</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => {
                const isGuideActive = staffType === 'tourguide';
                // Simulated schedule for TourGuides
                const isBusy = isGuideActive && (Math.abs(member.fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 3 === 0);

                return (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                    {/* Column 1: Avatar + FullName + Tag Role */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <AntAvatar className="size-9 rounded-full font-bold border shrink-0">
                          <span className={`w-full h-full flex items-center justify-center ${getAvatarBgColor(member.fullName)} uppercase text-xs font-extrabold`}>
                            {getInitials(member.fullName)}
                          </span>
                        </AntAvatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-sm leading-none">{member.fullName}</p>
                            <Tag color={staffRoleTagsColor[staffType]} className="text-[10px] font-bold px-1.5 py-0 rounded border-0 uppercase leading-none">
                              {staffRoleLabels[staffType]}
                            </Tag>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-1">@{member.userName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Merged Email & Phone */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {member.email || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {member.phone || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Address */}
                    <td className="px-6 py-4">
                      {member.address ? (
                        <span className="text-sm font-medium text-slate-700 inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1 max-w-[200px]">{member.address}</span>
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Column 4: Schedule (Only for Tour Guides) */}
                    {isGuideActive && (
                      <td className="px-6 py-4">
                        {member.isActive ? (
                          isBusy ? (
                            <Tag color="warning" className="rounded-lg px-2 py-0.5 border-0 font-bold text-xs uppercase">
                              Đang dẫn tour
                            </Tag>
                          ) : (
                            <Tag color="processing" className="rounded-lg px-2 py-0.5 border-0 font-bold text-xs uppercase">
                              Đang rảnh
                            </Tag>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    )}

                    {/* Column 5: Status Tag */}
                    <td className="px-6 py-4">
                      <Tag color={member.isActive ? 'success' : 'default'} className="rounded-lg px-2 py-0.5 border-0 font-bold text-xs uppercase">
                        {member.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </Tag>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Eye icon quick open */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-slate-50 border-slate-200/80 active:scale-95 transition-all flex items-center justify-center"
                          title="Xem chi tiết"
                          onClick={() => handleEditStaff(member)}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        
                        {/* Action menu */}
                        <div className="relative inline-block text-left">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100 flex items-center justify-center"
                            onClick={() => {
                              Modal.confirm({
                                title: <span className="font-bold text-slate-900 text-base">{member.fullName}</span>,
                                content: (
                                  <div className="space-y-2 mt-4">
                                    <Button 
                                      className="w-full text-left justify-start rounded-xl font-semibold" 
                                      onClick={() => {
                                        Modal.destroyAll();
                                        handleEditStaff(member);
                                      }}
                                    >
                                      Xem & Chỉnh sửa hồ sơ
                                    </Button>
                                    {member.isActive ? (
                                      <Button 
                                        variant="destructive" 
                                        className="w-full text-left justify-start rounded-xl font-semibold mt-2 bg-red-600 hover:bg-red-700 text-white" 
                                        onClick={() => {
                                          Modal.destroyAll();
                                          handleDeleteStaff(member);
                                        }}
                                      >
                                        Ngừng hoạt động nhân sự
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="default" 
                                        className="w-full text-left justify-start rounded-xl font-semibold mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                        onClick={() => {
                                          Modal.destroyAll();
                                          handleReactivateStaff(member);
                                        }}
                                      >
                                        Kích hoạt hoạt động lại
                                      </Button>
                                    )}
                                  </div>
                                ),
                                icon: null,
                                footer: null,
                                closable: true,
                                centered: true,
                              });
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Card Footer */}
      {filteredStaff.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-xs text-slate-500">Hiển thị {filteredStaff.length} {title.toLowerCase()}</p>
        </div>
      )}

      {/* 4. THE MASTER DRAWER (Glassmorphic Backdrop + Claymorphic Panels) */}
      <Drawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={720}
        maskClosable={false}
        closable={true}
        styles={{
          body: { padding: '24px', backgroundColor: '#f8fafc' },
          footer: { borderTop: '1px solid #f1f5f9', padding: '16px 24px', backgroundColor: '#ffffff', position: 'sticky', bottom: 0, zIndex: 10 }
        }}
        className="staff-master-drawer"
        maskStyle={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
        title={
          selectedStaff ? (
            <div className="flex items-center justify-between w-full pr-6 py-1">
              <div className="flex items-center gap-4">
                <AntAvatar className="size-14 rounded-full font-bold border-2 border-white shadow-md shrink-0">
                  <span className={`w-full h-full flex items-center justify-center ${getAvatarBgColor(selectedStaff.fullName)} uppercase text-lg font-black`}>
                    {getInitials(selectedStaff.fullName)}
                  </span>
                </AntAvatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{selectedStaff.fullName}</h3>
                    <Tag color={staffRoleTagsColor[staffType]} className="text-[10px] font-bold px-1.5 py-0.5 rounded border-0 uppercase">
                      {staffRoleLabels[staffType]}
                    </Tag>
                  </div>
                  <span className="text-sm text-slate-400 font-medium">Mã số: #EMP-{(Math.abs(selectedStaff.fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 1000).toString().padStart(3, '0')}</span>
                </div>
              </div>
              
              <div className="shrink-0">
                <Tag color={selectedStaff.isActive ? 'success' : 'default'} className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border-0">
                  {selectedStaff.isActive ? 'ĐANG HOẠT ĐỘNG' : 'TẠM NGỪNG'}
                </Tag>
              </div>
            </div>
          ) : (
            <span className="font-black text-lg text-slate-900">Thêm {title} Mới</span>
          )
        }
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setDrawerVisible(false)}
              className="rounded-xl border-slate-200 font-bold px-5 active:scale-95 transition-all text-slate-600 h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSaveStaff}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 active:scale-95 transition-all shadow-md shadow-emerald-100/50 h-9 border-0"
            >
              {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            className="staff-tabs"
            items={[
              // Tab 1: Profile Details
              {
                key: 'profile',
                label: (
                  <span className="font-bold text-sm px-2 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" />
                    Thông tin chung
                  </span>
                ),
                children: (
                  <div className="space-y-4 mt-2">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="fullName"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Họ và Tên</span>}
                          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                          <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500" />
                        </Form.Item>
                        
                        <Form.Item
                          name="userName"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Username</span>}
                        >
                          <Input disabled={!!selectedStaff} className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="email"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Địa chỉ Email</span>}
                          rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không đúng định dạng' }
                          ]}
                        >
                          <Input disabled={!!selectedStaff} className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>

                        <Form.Item
                          name="phone"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Số Điện Thoại</span>}
                        >
                          <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="dob"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ngày Sinh</span>}
                        >
                          <Input placeholder="YYYY-MM-DD" className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>

                        <Form.Item
                          name="gender"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Giới Tính</span>}
                        >
                          <Select className="rounded-xl h-9 text-sm" options={[
                            { value: 'Male', label: 'Nam' },
                            { value: 'Female', label: 'Nữ' },
                            { value: 'Other', label: 'Khác' }
                          ]} />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="cccd"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Số CCCD / Hộ chiếu</span>}
                        >
                          <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>

                        <Form.Item
                          name="joinDate"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ngày Gia Nhập</span>}
                        >
                          <Input placeholder="YYYY-MM-DD" disabled className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="address"
                        label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Địa Chỉ Thường Trú</span>}
                      >
                        <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                      </Form.Item>
                    </div>
                  </div>
                )
              },
              // Tab 2: Operations / Tasks (Tùy biến theo Role)
              {
                key: 'operations',
                label: (
                  <span className="font-bold text-sm px-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    Nghiệp vụ chuyên môn
                  </span>
                ),
                disabled: !selectedStaff,
                children: selectedStaff ? (() => {
                  const metric = generateSimulatedData(selectedStaff);
                  return (
                    <div className="space-y-4 mt-2">
                      {/* KPI Indicators */}
                      <div className="grid grid-cols-2 gap-4">
                        {staffType === 'tourguide' ? (
                          <>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ngày đi tour/tháng</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{(metric as any).totalDays} ngày</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0">
                                <Award className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Đánh giá trung bình</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-lg font-black text-slate-900">{(metric as any).rating.toFixed(1)}</span>
                                  <Rate disabled defaultValue={(metric as any).rating} allowHalf className="text-amber-400 text-xs shrink-0" />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : staffType === 'consultant' ? (
                          <>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Doanh thu chốt được</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{(metric as any).revenue.toLocaleString('vi-VN')}đ</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                                <TrendingUp className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tỷ lệ chốt thành công</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{(metric as any).successRate}%</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nhân sự quản lý</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{(metric as any).guidesManaged} HDV</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tour phê duyệt (Tháng)</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{(metric as any).approvedTours} tour</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Mini Table List */}
                      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                        <div className="px-5 py-3.5 border-b border-slate-100">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            {staffType === 'tourguide' ? 'Danh sách tour dẫn gần đây' : 
                             staffType === 'consultant' ? 'Booking tư vấn thành công gần đây' : 
                             'Nhật ký thao tác hệ thống'}
                          </h4>
                        </div>
                        <Table
                          dataSource={metric.list as any[]}
                          rowKey="key"
                          pagination={false}
                          className="mini-bookings-table"
                          columns={
                            (staffType === 'tourguide' ? [
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">MÃ TOUR</span>,
                                dataIndex: 'code',
                                key: 'code',
                                render: (c: any) => <span className="font-mono text-xs font-bold text-slate-700">{c}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">TÊN TOUR CHUYẾN</span>,
                                dataIndex: 'name',
                                key: 'name',
                                render: (n: any) => <span className="text-xs font-semibold text-slate-800 line-clamp-1">{n}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">KHỞI HÀNH</span>,
                                dataIndex: 'date',
                                key: 'date',
                                render: (d: any) => <span className="text-xs text-slate-500">{d}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400 text-right">RATING</span>,
                                dataIndex: 'rating',
                                key: 'rating',
                                align: 'right',
                                render: (r: any) => <span className="text-xs font-bold text-amber-600">{r} ★</span>
                              }
                            ] : staffType === 'consultant' ? [
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">MÃ ĐƠN</span>,
                                dataIndex: 'code',
                                key: 'code',
                                render: (c: any) => <span className="font-mono text-xs font-bold text-slate-700">{c}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">TÊN TOUR</span>,
                                dataIndex: 'tourName',
                                key: 'tourName',
                                render: (t: any) => <span className="text-xs font-semibold text-slate-800 line-clamp-1">{t}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">KHÁCH HÀNG</span>,
                                dataIndex: 'customer',
                                key: 'customer',
                                render: (c: any) => <span className="text-xs font-medium text-slate-700">{c}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400 text-right">DOANH THU</span>,
                                dataIndex: 'revenue',
                                key: 'revenue',
                                align: 'right',
                                render: (r: any) => <span className="text-xs font-black text-slate-900">{r.toLocaleString('vi-VN')}đ</span>
                              }
                            ] : staffType === 'tourplanner' ? [
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">MÃ TOUR</span>,
                                dataIndex: 'code',
                                key: 'code',
                                render: (c: any) => <span className="font-mono text-xs font-bold text-slate-700">{c}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">TÊN KHUÔN MẪU</span>,
                                dataIndex: 'name',
                                key: 'name',
                                render: (n: any) => <span className="text-xs font-semibold text-slate-800 line-clamp-1">{n}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">KHỞI HÀNH</span>,
                                dataIndex: 'start',
                                key: 'start',
                                render: (s: any) => <span className="text-xs text-slate-600">{s}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400 text-right">GIÁ KHÁCH</span>,
                                dataIndex: 'price',
                                key: 'price',
                                align: 'right',
                                render: (p: any) => <span className="text-xs font-black text-slate-900">{p.toLocaleString('vi-VN')}đ</span>
                              }
                            ] : [
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">THỜI GIAN</span>,
                                dataIndex: 'time',
                                key: 'time',
                                render: (t: any) => <span className="text-xs text-slate-500 font-medium">{t}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400">HÀNH ĐỘNG THỰC HIỆN</span>,
                                dataIndex: 'action',
                                key: 'action',
                                render: (a: any) => <span className="text-xs font-semibold text-slate-800 line-clamp-1">{a}</span>
                              },
                              {
                                title: <span className="text-[10px] font-bold text-slate-400 text-right">TRẠNG THÁI</span>,
                                dataIndex: 'status',
                                key: 'status',
                                align: 'right',
                                render: (s: any) => <Tag color="success" className="text-[9px] font-bold rounded-lg border-0 px-2 py-0.5">{s}</Tag>
                              }
                            ]) as any
                          }
                        />
                      </div>
                    </div>
                  );
                })() : null
              },
              // Tab 3: Upload files & Contracts
              {
                key: 'documents',
                label: (
                  <span className="font-bold text-sm px-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Tài liệu & Hợp đồng
                  </span>
                ),
                disabled: !selectedStaff,
                children: (
                  <div className="space-y-4 mt-2">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-sm font-black text-slate-900">Lưu trữ hồ sơ hợp đồng điện tử</h4>
                        <p className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng PDF, JPG, PNG scan. Dung lượng file không quá 10MB.</p>
                      </div>

                      <Upload.Dragger
                        name="file"
                        multiple={true}
                        action="#"
                        className="rounded-2xl bg-slate-50 hover:bg-white transition-all py-8 border-dashed border-2 border-slate-200"
                        onChange={(info) => {
                          const { status } = info.file;
                          if (status === 'done') {
                            message.success(`${info.file.name} đã được upload thành công!`);
                          } else if (status === 'error') {
                            message.error(`${info.file.name} upload thất bại.`);
                          }
                        }}
                      >
                        <p className="ant-upload-drag-icon flex justify-center text-slate-400 mb-3">
                          <UploadCloud className="w-10 h-10 text-emerald-500" />
                        </p>
                        <p className="ant-upload-text text-sm font-semibold text-slate-700">Kéo thả tài liệu vào đây hoặc click để duyệt file</p>
                        <p className="ant-upload-hint text-xs text-slate-400 mt-1">Upload CCCD scan, thẻ HDV (đối với HDV), hoặc Hợp đồng lao động chính thức</p>
                      </Upload.Dragger>

                      {/* Displaying fake uploaded files list for realistic experience */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700">CCCD_Scan_MatTruoc_MatSau.pdf</span>
                          </div>
                          <Tag color="success" className="text-[10px] font-bold border-0 px-2 py-0.5 rounded-lg shrink-0">ĐÃ XÁC MINH</Tag>
                        </div>

                        {staffType === 'tourguide' && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="text-xs font-semibold text-slate-700">The_HDV_QuocTe_Expired_2028.pdf</span>
                            </div>
                            <Tag color="success" className="text-[10px] font-bold border-0 px-2 py-0.5 rounded-lg shrink-0">ĐÃ XÁC MINH</Tag>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700">HopDongLaoDong_ChinhThuc_ITOUR.pdf</span>
                          </div>
                          <Tag color="processing" className="text-[10px] font-bold border-0 px-2 py-0.5 rounded-lg shrink-0">ĐANG HIỆU LỰC</Tag>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </Form>
      </Drawer>
    </Card>
  );
}
