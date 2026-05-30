'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Select, Button, Drawer, Form, Card, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EnvironmentOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { locationService } from '@/services/locationService';

interface LocationOption {
  id: string;
  name: string;
  type: string;
}

interface Vehicle {
  id?: string;
  type: string;
  seatCount: number;
  description?: string;
}

interface TransportCompany {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  location?: { id: string; name?: string };
  vehicles: Vehicle[];
}

export default function TransportsPartnerPage() {
  const [form] = Form.useForm();
  const apiEndpoint = '/transport-companies';

  // States
  const [data, setData] = useState<TransportCompany[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TransportCompany | null>(null);

  // Fetch transport companies and locations
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<TransportCompany[]>(apiEndpoint);
      if (res.success && Array.isArray(res.data)) {
        setData(res.data);
      } else {
        message.error(`Không thể lấy danh sách nhà xe: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tải danh sách nhà xe');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await locationService.getLocations();
      if (res.success && Array.isArray(res.data)) {
        setLocations(
          res.data
            .filter((l: any) => l.type === 'CITY_PROVINCE' || l.type === 'COUNTRY')
            .map((l: any) => ({
              id: l.id,
              name: l.name,
              type: l.type,
            }))
        );
      }
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLocations();
  }, []);

  // Filtered data for Table
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.address && item.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchLocation =
        !selectedLocation ||
        item.location?.id === selectedLocation;

      return matchSearch && matchLocation;
    });
  }, [data, searchQuery, selectedLocation]);

  // Actions
  const handleOpenAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ vehicles: [] });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: TransportCompany) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      address: item.address,
      phone: item.phone,
      email: item.email,
      status: item.status || 'ACTIVE',
      locationId: item.location?.id || null,
      vehicles: item.vehicles || [],
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiClient.delete(`${apiEndpoint}/${id}`);
      if (res.success) {
        message.success('Đã xóa nhà xe thành công!');
        fetchData();
      } else {
        message.error(`Không thể xóa nhà xe: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi xóa nhà xe');
    }
  };

  const handleSave = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: values.name,
        address: values.address || '',
        phone: values.phone || '',
        email: values.email || '',
        status: values.status || 'ACTIVE',
        location: values.locationId ? { id: values.locationId } : null,
        vehicles: values.vehicles || [],
      };

      const isNew = !editingItem;
      const itemId = isNew ? `TC-${Math.floor(100000 + Math.random() * 900000)}` : editingItem.id;
      payload.id = itemId;

      // Make sure each vehicle has a reference if it's already there (handled at backend but let's be clean)
      payload.vehicles = payload.vehicles.map((v: any) => ({
        id: v.id || undefined,
        type: v.type,
        seatCount: parseInt(v.seatCount) || 16,
        description: v.description || '',
      }));

      let res;
      if (isNew) {
        res = await apiClient.post(apiEndpoint, payload);
      } else {
        res = await apiClient.put(`${apiEndpoint}/${itemId}`, payload);
      }

      if (res.success) {
        message.success(`Đã ${isNew ? 'thêm' : 'cập nhật'} nhà xe thành công!`);
        setIsDrawerOpen(false);
        fetchData();
      } else {
        message.error(`Không thể lưu nhà xe: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi lưu thông tin nhà xe');
    } finally {
      setSubmitting(false);
    }
  };

  // Columns Configuration for Master Table (Transport Company)
  const masterColumns = [
    {
      title: 'Tên Nhà xe',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TransportCompany) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm">{text}</span>
          {record.address && (
            <span className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">{record.address}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: ['location', 'name'],
      key: 'location',
      render: (locName: string) => (
        <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
          <EnvironmentOutlined className="text-rose-500" />
          {locName || 'Chưa liên kết'}
        </span>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string) => <span className="text-slate-600 font-mono text-xs">{val || '—'}</span>,
    },
    {
      title: 'Email liên hệ',
      dataIndex: 'email',
      key: 'email',
      render: (val: string) => <span className="text-slate-600 text-xs">{val || '—'}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'emerald' : 'red'} className="font-bold rounded-md px-2 py-0.5 text-[10px]">
          {status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM NGỪNG'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: TransportCompany) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            className="text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center justify-center p-2"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhà xe này? Các xe thuộc nhà xe này cũng sẽ bị xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              className="hover:bg-rose-50 rounded-lg flex items-center justify-center p-2"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Expandable Row Renderer (Detail Table - Vehicles)
  const expandedRowRender = (company: TransportCompany) => {
    const detailColumns = [
      {
        title: 'Mã số đầu xe',
        dataIndex: 'id',
        key: 'id',
        render: (text: string) => <span className="font-mono text-slate-500 text-xs">{text}</span>,
      },
      {
        title: 'Loại xe / Thương hiệu',
        dataIndex: 'type',
        key: 'type',
        render: (text: string) => <span className="font-bold text-slate-700 text-xs">{text}</span>,
      },
      {
        title: 'Số ghế ngồi',
        dataIndex: 'seatCount',
        key: 'seatCount',
        render: (val: number) => <span className="font-semibold text-slate-600 text-xs">{val} chỗ</span>,
      },
      {
        title: 'Mô tả đầu xe',
        dataIndex: 'description',
        key: 'description',
        render: (text: string) => <span className="text-slate-500 italic text-xs">{text || '—'}</span>,
      },
    ];

    return (
      <Table
        columns={detailColumns}
        dataSource={company.vehicles || []}
        pagination={false}
        rowKey="id"
        className="ml-8 mr-4 bg-slate-50/50 border border-slate-100 rounded-lg shadow-inner overflow-hidden"
      />
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Đối Tác Nhà Xe & Vận Tải</h1>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý danh sách nhà xe liên kết, thông tin liên hệ và quản trị chi tiết đội ngũ đầu xe (fleet) phục vụ chạy tour.
        </p>
      </div>

      {/* Zone 1: Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            placeholder="Tìm kiếm tên nhà xe, SĐT, email..."
            prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-300 rounded-lg text-sm max-w-sm"
            allowClear
          />
          <Select
            placeholder="— Lọc theo Địa điểm —"
            value={selectedLocation}
            onChange={(val) => setSelectedLocation(val)}
            className="h-10 text-sm min-w-[200px]"
            allowClear
            dropdownStyle={{ borderRadius: '8px' }}
          >
            {locations.map((loc) => (
              <Select.Option key={loc.id} value={loc.id}>
                {loc.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
          className="h-10 bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 border-emerald-600 rounded-lg text-sm font-bold text-white flex items-center gap-1.5 px-4 shadow-sm"
        >
          Thêm Nhà xe
        </Button>
      </div>

      {/* Zone 2: Master-Detail Table */}
      <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden mb-8" bodyStyle={{ padding: 0 }}>
        <Table
          columns={masterColumns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.vehicles && record.vehicles.length > 0,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-6 py-4 border-t border-slate-100",
          }}
          className="w-full text-left"
        />
      </Card>

      {/* Zone 3: Drawer */}
      <Drawer
        title={editingItem ? 'Chỉnh sửa nhà xe & Đội xe' : 'Thêm Nhà xe mới'}
        width={640}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div className="flex justify-end gap-3 py-2.5 px-4 bg-slate-50 border-t border-slate-200">
            <Button
              onClick={() => setIsDrawerOpen(false)}
              disabled={submitting}
              className="rounded-lg h-9 font-medium"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 rounded-lg h-9 font-bold text-white"
            >
              Lưu dữ liệu
            </Button>
          </div>
        }
        footerStyle={{ padding: 0 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          requiredMark={false}
          className="space-y-6"
        >
          {/* Part 1: Company Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-slate-100 pb-1.5">
              Phần 1: Thông tin Nhà xe (Company Info)
            </h3>
            
            <Form.Item
              name="name"
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Nhà xe *</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên nhà xe' }]}
            >
              <Input placeholder="e.g. Công ty Vận Tải Phương Trang" className="h-10 border-slate-300 rounded-lg text-sm" />
            </Form.Item>

            <Form.Item
              name="locationId"
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa bàn hoạt động (Địa điểm) *</span>}
              rules={[{ required: true, message: 'Vui lòng chọn địa điểm hoạt động' }]}
            >
              <Select placeholder="Chọn địa điểm..." className="h-10 text-sm" dropdownStyle={{ borderRadius: '8px' }}>
                {locations.map((loc) => (
                  <Select.Option key={loc.id} value={loc.id}>
                    {loc.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="phone"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại *</span>}
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại liên hệ' }]}
              >
                <Input placeholder="e.g. 19006067" className="h-10 border-slate-300 rounded-lg text-sm" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email liên hệ</span>}
                rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
              >
                <Input placeholder="e.g. transport@phuongtrang.com" className="h-10 border-slate-300 rounded-lg text-sm" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="address"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ trụ sở</span>}
              >
                <Input placeholder="e.g. 80 Trần Hưng Đạo, Quận 1" className="h-10 border-slate-300 rounded-lg text-sm" />
              </Form.Item>

              <Form.Item
                name="status"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái đối tác</span>}
                initialValue="ACTIVE"
              >
                <Select className="h-10 text-sm" dropdownStyle={{ borderRadius: '8px' }}>
                  <Select.Option value="ACTIVE">HOẠT ĐỘNG</Select.Option>
                  <Select.Option value="INACTIVE">TẠM NGỪNG</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* Part 2: Vehicle Fleet using Form.List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>Phần 2: Quản lý Đội xe (Vehicle Fleet)</span>
            </h3>

            <Form.List name="vehicles">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.key} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200/60 shadow-xs relative group">
                      {/* Hidden ID field */}
                      <Form.Item {...field} name={[field.name, 'id']} noStyle>
                        <Input type="hidden" />
                      </Form.Item>

                      {/* Loại xe */}
                      <Form.Item
                        {...field}
                        name={[field.name, 'type']}
                        label={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại xe *</span>}
                        rules={[{ required: true, message: 'Nhập loại xe' }]}
                        className="flex-1 mb-0"
                      >
                        <Input placeholder="VD: Ford Transit, Thaco..." className="h-9 border-slate-300 rounded-lg text-xs" />
                      </Form.Item>

                      {/* Số chỗ */}
                      <Form.Item
                        {...field}
                        name={[field.name, 'seatCount']}
                        label={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số ghế *</span>}
                        rules={[{ required: true, message: 'Nhập số chỗ' }]}
                        className="w-20 mb-0"
                      >
                        <Input type="number" min={4} max={80} placeholder="16" className="h-9 border-slate-300 rounded-lg text-xs text-center" />
                      </Form.Item>

                      {/* Mô tả xe */}
                      <Form.Item
                        {...field}
                        name={[field.name, 'description']}
                        label={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả</span>}
                        className="flex-1 mb-0"
                      >
                        <Input placeholder="VD: Xe đời mới, wifi..." className="h-9 border-slate-300 rounded-lg text-xs" />
                      </Form.Item>

                      {/* Remove Button */}
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center p-2 rounded-lg mt-5"
                      />
                    </div>
                  ))}

                  {/* Add Row Button */}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusCircleOutlined />}
                    className="h-10 border-dashed border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 bg-white cursor-pointer"
                  >
                    Thêm đầu xe mới
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </Form>
      </Drawer>
    </DashboardLayout>
  );
}
