'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { CustomerTable } from '@/components/dashboard/customer-table';
import { userService } from '@/services/userService';
import { customerService } from '@/services/customerService';
import { bookingService } from '@/services/bookingService';
import { User, Booking } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// Ant Design Components
import { Drawer, Tabs, Form, Input, Select, Modal, Table, Badge as AntBadge, message } from 'antd';
import { Star, Clock } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Drawer States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  
  // Persistent internal notes simulation (stored locally)
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>({
    'user-006': 'Khách VIP, thích đi tour Châu Âu, dị ứng nhẹ hải sản.',
    'user-008': 'Thường đi tour gia đình, yêu cầu xe đời mới rộng rãi.'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = customers;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((customer) => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await customerService.getCustomers();
      if (response.success && response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || 'Không thể lấy dữ liệu customers');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch bookings for the active customer
  const fetchCustomerBookings = async (customerId: string) => {
    setBookingsLoading(true);
    try {
      const response = await bookingService.getCustomerBookings(customerId);
      if (response.success && response.data) {
        setCustomerBookings(response.data);
      } else {
        setCustomerBookings([]);
      }
    } catch (err) {
      console.error('Lỗi lấy lịch sử đặt chỗ:', err);
      setCustomerBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Open Drawer in profile tab (Edit / View detail)
  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    setSelectedCustomer(customer);
    setActiveTab('profile');
    
    // Fill custom extended fields or simulated attributes
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      dob: (customer as any).dob || '1995-08-15',
      gender: (customer as any).gender || 'Male',
      nationality: (customer as any).nationality || 'Việt Nam',
      cccd: (customer as any).cccd || '037095012849',
      internalNote: internalNotes[customer.id] || '',
    });

    fetchCustomerBookings(customer.id);
    setDrawerVisible(true);
  };

  // Open Drawer directly active on Bookings history tab
  const handleViewBookings = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    setSelectedCustomer(customer);
    setActiveTab('bookings');

    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      dob: (customer as any).dob || '1995-08-15',
      gender: (customer as any).gender || 'Male',
      nationality: (customer as any).nationality || 'Việt Nam',
      cccd: (customer as any).cccd || '037095012849',
      internalNote: internalNotes[customer.id] || '',
    });

    fetchCustomerBookings(customer.id);
    setDrawerVisible(true);
  };

  // Disable account with a confirmation Dialog Modal
  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    Modal.confirm({
      title: <span className="font-bold text-slate-900 text-lg">Vô hiệu hóa tài khoản</span>,
      content: (
        <p className="text-slate-600 text-sm mt-2">
          Bạn có chắc chắn muốn vô hiệu hóa tài khoản của khách hàng{' '}
          <strong className="text-slate-900 font-extrabold">"{customer.name}"</strong>? Khách hàng sẽ không thể đăng nhập hay đặt tour mới cho đến khi tài khoản được kích hoạt trở lại.
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
          await customerService.updateCustomerStatus(customerId, 'Inactive');
          setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: 'Inactive' } : c));
          message.success(`Đã vô hiệu hóa tài khoản của "${customer.name}" thành công!`);
        } catch (err) {
          console.error('Không thể vô hiệu hóa khách hàng:', err);
          message.error('Có lỗi xảy ra khi vô hiệu hóa tài khoản khách hàng.');
        }
      }
    });
  };

  // Save changes from Profile Form & Internal Notes
  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // Update database customer entity
      const updateData = {
        name: values.name,
        phone: values.phone,
        address: values.address,
      };
      
      const res = await customerService.updateCustomer(selectedCustomer.id, updateData);
      
      if (res.success) {
        // Save simulated extended attributes
        setInternalNotes(prev => ({
          ...prev,
          [selectedCustomer.id]: values.internalNote || ''
        }));

        // Update local state list
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id 
          ? { ...c, name: values.name, phone: values.phone, address: values.address } 
          : c
        ));

        message.success('Cập nhật hồ sơ khách hàng thành công!');
        setDrawerVisible(false);
      } else {
        message.error(res.message || 'Lỗi cập nhật hồ sơ khách hàng');
      }
    } catch (err) {
      console.error('Lỗi lưu form:', err);
    } finally {
      setSaving(false);
    }
  };

  // Add customer callback (Opens a blank form drawer for creation)
  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    form.resetFields();
    form.setFieldsValue({
      gender: 'Male',
      nationality: 'Việt Nam',
      internalNote: ''
    });
    setActiveTab('profile');
    setDrawerVisible(true);
  };

  const handleCreateCustomerSubmit = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      const newCustData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        point: 0,
        totalBookings: 0,
        totalSpent: 0,
        joinDate: new Date().toISOString(),
        status: 'Active' as const,
      };
      
      const res = await customerService.createCustomer(newCustData);
      if (res.success && res.data) {
        setCustomers(prev => [res.data!, ...prev]);
        message.success('Thêm khách hàng mới thành công!');
        setDrawerVisible(false);
      } else {
        message.error(res.message || 'Lỗi thêm khách hàng mới');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Helper colors and initials for Drawer avatar
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Customers</h1>
        <p className="text-slate-500 text-sm mt-1">Xem và quản lý thông tin tất cả khách hàng đăng ký trên hệ thống</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700 font-semibold mb-2">⚠️ Lỗi:</p>
          <p className="text-sm text-red-600 break-words">{error}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-red-500">Chi tiết</summary>
            <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto max-h-40">
              Kiểm tra DevTools Console (F12) để xem lỗi chi tiết
            </pre>
          </details>
        </div>
      )}

      {/* Customers Table */}
      <div>
        <CustomerTable
          customers={filteredCustomers}
          onEdit={handleEditCustomer}
          onViewBookings={handleViewBookings}
          onDelete={handleDeleteCustomer}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onAddCustomer={handleCreateCustomer}
        />
      </div>

      {/* CUSTOMER MASTER DRAWER */}
      <Drawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={720}
        maskClosable={false}
        closable={true}
        className="customer-master-drawer"
        styles={{
          body: { padding: '24px', backgroundColor: '#f8fafc' },
          footer: { borderTop: '1px solid #f1f5f9', padding: '16px 24px', backgroundColor: '#ffffff' }
        }}
        // Khu vực 1: Header Hồ sơ (Khu vực tĩnh)
        title={
          selectedCustomer ? (
            <div className="flex items-center justify-between w-full pr-6 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="size-14 rounded-full font-bold border-2 border-white shadow-md">
                  <AvatarImage src={selectedCustomer.profileImage} alt={selectedCustomer.name} />
                  <AvatarFallback className={`${getAvatarBgColor(selectedCustomer.name)} uppercase text-lg font-black`}>
                    {getInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{selectedCustomer.name}</h3>
                  <span className="text-sm text-slate-400 font-medium">{selectedCustomer.email}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                  selectedCustomer.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  selectedCustomer.status === 'Inactive' ? 'bg-slate-50 text-slate-600 border border-slate-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {selectedCustomer.status === 'Active' ? 'Hoạt động' : selectedCustomer.status === 'Inactive' ? 'Vô hiệu hóa' : 'Tạm khóa'}
                </span>
                
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full text-xs font-black shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedCustomer.point || 0} pts</span>
                </span>
              </div>
            </div>
          ) : (
            <span className="font-black text-lg text-slate-900">Thêm Khách Hàng Mới</span>
          )
        }
        // Khu vực 3: Footer (Sticky Action Bar)
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setDrawerVisible(false)}
              className="rounded-xl border-slate-200 font-bold px-5 active:scale-95 transition-all text-slate-600"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={selectedCustomer ? handleSaveCustomer : handleCreateCustomerSubmit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 active:scale-95 transition-all shadow-md shadow-emerald-100/50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            className="customer-tabs"
            items={[
              // Tab 1: Thông tin chung (Profile)
              {
                key: 'profile',
                label: <span className="font-bold text-sm px-2">Thông tin chung</span>,
                children: (
                  <div className="space-y-4 mt-2">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="name"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Họ và Tên</span>}
                          rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                        >
                          <Input className="rounded-xl py-2 px-3 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm" />
                        </Form.Item>
                        
                        <Form.Item
                          name="email"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Địa chỉ Email</span>}
                          rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không đúng định dạng' }
                          ]}
                        >
                          <Input disabled={!!selectedCustomer} className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="phone"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Số Điện Thoại</span>}
                        >
                          <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>

                        <Form.Item
                          name="dob"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ngày Sinh</span>}
                        >
                          <Input placeholder="YYYY-MM-DD" className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <Form.Item
                          name="nationality"
                          label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Quốc Tịch</span>}
                        >
                          <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="cccd"
                        label={<span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Số CCCD / Hộ chiếu</span>}
                      >
                        <Input className="rounded-xl py-2 px-3 border-slate-200 text-sm" />
                      </Form.Item>

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
              // Tab 2: Lịch sử Đặt chỗ (Bookings)
              {
                key: 'bookings',
                label: <span className="font-bold text-sm px-2">Lịch sử đặt chỗ</span>,
                disabled: !selectedCustomer,
                children: (
                  <div className="space-y-4 mt-2">
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <Table
                        loading={bookingsLoading}
                        dataSource={customerBookings}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        className="mini-bookings-table"
                        columns={[
                          {
                            title: <span className="text-xs font-bold text-slate-400">MÃ ĐƠN</span>,
                            dataIndex: 'id',
                            key: 'id',
                            render: (id: string) => <span className="font-mono font-bold text-slate-700 text-xs">{id}</span>
                          },
                          {
                            title: <span className="text-xs font-bold text-slate-400">TÊN TOUR</span>,
                            dataIndex: 'tourName',
                            key: 'tourName',
                            render: (name: string) => <span className="font-semibold text-slate-900 text-xs line-clamp-1">{name}</span>
                          },
                          {
                            title: <span className="text-xs font-bold text-slate-400">NGÀY ĐI</span>,
                            dataIndex: 'bookingDate',
                            key: 'bookingDate',
                            render: (date: string) => (
                              <span className="text-slate-500 text-xs inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {date ? date.substring(0, 10) : 'N/A'}
                              </span>
                            )
                          },
                          {
                            title: <span className="text-xs font-bold text-slate-400 text-right">TỔNG TIỀN</span>,
                            dataIndex: 'finalPrice',
                            key: 'finalPrice',
                            align: 'right',
                            render: (price: number) => (
                              <span className="font-bold text-slate-900 text-xs">
                                {price ? price.toLocaleString('vi-VN') + 'đ' : '0đ'}
                              </span>
                            )
                          },
                          {
                            title: <span className="text-xs font-bold text-slate-400">TRẠNG THÁI</span>,
                            dataIndex: 'status',
                            key: 'status',
                            render: (status: string) => {
                              const badgeStyle = 
                                status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-amber-50 text-amber-700 border-amber-100';
                              return (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                                  {status === 'Confirmed' ? 'Đã xác nhận' : status === 'Cancelled' ? 'Đã hủy' : status === 'Completed' ? 'Hoàn thành' : 'Chờ xử lý'}
                                </span>
                              );
                            }
                          }
                        ]}
                      />
                    </div>
                  </div>
                )
              },
              // Tab 3: Ghi chú nội bộ (Internal Notes)
              {
                key: 'notes',
                label: <span className="font-bold text-sm px-2">Ghi chú nội bộ</span>,
                disabled: !selectedCustomer,
                children: (
                  <div className="space-y-4 mt-2">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-sm font-black text-slate-900">Ghi chú chăm sóc khách hàng</h4>
                        <span className="text-xs text-slate-400 italic">Chỉ hiển thị với Planner & Sales</span>
                      </div>
                      
                      <Form.Item name="internalNote">
                        <Input.TextArea
                          placeholder="Ghi chú sở thích, thói quen ăn uống, lưu ý sức khoẻ hoặc ghi chú khách hàng VIP của khách..."
                          rows={6}
                          className="rounded-xl border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </Form.Item>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </Form>
      </Drawer>
    </DashboardLayout>
  );
}