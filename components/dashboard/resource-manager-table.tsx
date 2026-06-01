'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Select, Button, Drawer, Form, Card, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import { locationService } from '@/services/locationService';

// Interfaces
interface LocationOption {
  id: string;
  name: string;
  type: string;
}

interface ResourceManagerTableProps {
  title: 'Khách sạn' | 'Nhà hàng' | 'Dịch vụ';
  apiEndpoint: string;
  type: 'hotel' | 'restaurant' | 'service';
}

export function ResourceManagerTable({ title, apiEndpoint, type }: ResourceManagerTableProps) {
  const [form] = Form.useForm();
  const normalizedEndpoint = useMemo(() => apiEndpoint.replace(/^\/api/, ''), [apiEndpoint]);

  // States
  const [data, setData] = useState<any[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Load resources and locations
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any[]>(normalizedEndpoint);
      if (res.success && Array.isArray(res.data)) {
        setData(res.data);
      } else {
        message.error(`Không thể lấy danh sách ${title.toLowerCase()}: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error(`Lỗi khi tải danh sách ${title.toLowerCase()}`);
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
  }, [normalizedEndpoint]);

  // Filtered data for Table
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      address: item.address,
      phone: item.phone,
      locationId: item.location?.id || null,
      price:
        type === 'hotel'
          ? item.basePricePerNight
          : type === 'restaurant'
          ? item.pricePerPax
          : item.price,
      // For service type (derived or simulated)
      serviceType: item.name?.toLowerCase().includes('xe') || item.name?.toLowerCase().includes('di chuyển') ? 'TRANSPORT' : 'VISIT',
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiClient.delete(`${normalizedEndpoint}/${id}`);
      if (res.success) {
        message.success(`Đã xóa ${title.toLowerCase()} thành công!`);
        fetchData();
      } else {
        message.error(`Không thể xóa: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error(`Có lỗi xảy ra khi xóa ${title.toLowerCase()}`);
    }
  };

  const handleSave = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: values.name,
        description: values.description || '',
        location: values.locationId ? { id: values.locationId } : null,
      };

      // Set pricing based on resource type
      const priceVal = parseFloat(values.price) || 0;
      if (type === 'hotel') {
        payload.basePricePerNight = priceVal;
        payload.address = values.address || '';
        payload.phone = values.phone || '';
      } else if (type === 'restaurant') {
        payload.pricePerPax = priceVal;
        payload.address = values.address || '';
        payload.phone = values.phone || '';
      } else if (type === 'service') {
        payload.price = priceVal;
      }

      // Generate random ID for new items
      const isNew = !editingItem;
      const itemId = isNew ? `${type.substring(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}` : editingItem.id;
      payload.id = itemId;

      let res;
      if (isNew) {
        res = await apiClient.post(normalizedEndpoint, payload);
      } else {
        res = await apiClient.put(`${normalizedEndpoint}/${itemId}`, payload);
      }

      if (res.success) {
        message.success(`Đã ${isNew ? 'thêm' : 'cập nhật'} ${title.toLowerCase()} thành công!`);
        setIsDrawerOpen(false);
        fetchData();
      } else {
        message.error(`Không thể lưu: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error(`Lỗi khi lưu thông tin ${title.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Columns Configuration
  const tableColumns = useMemo(() => {
    const defaultCols: any[] = [
      {
        title: `Tên ${title}`,
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record: any) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-sm">{text}</span>
            {record.description && (
              <span className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">{record.description}</span>
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
    ];

    if (type === 'hotel') {
      defaultCols.push(
        {
          title: 'Giá cơ sở / Đêm',
          dataIndex: 'basePricePerNight',
          key: 'price',
          align: 'right' as const,
          render: (val: number) => (
            <span className="font-bold text-emerald-600 text-sm">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)}
            </span>
          ),
        },
        {
          title: 'Số điện thoại',
          dataIndex: 'phone',
          key: 'phone',
          render: (val: string) => <span className="text-slate-600 font-mono text-xs">{val || '—'}</span>,
        }
      );
    } else if (type === 'restaurant') {
      defaultCols.push(
        {
          title: 'Giá trung bình / Suất (Pax)',
          dataIndex: 'pricePerPax',
          key: 'price',
          align: 'right' as const,
          render: (val: number) => (
            <span className="font-bold text-emerald-600 text-sm">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)}
            </span>
          ),
        },
        {
          title: 'Số điện thoại',
          dataIndex: 'phone',
          key: 'phone',
          render: (val: string) => <span className="text-slate-600 font-mono text-xs">{val || '—'}</span>,
        }
      );
    } else if (type === 'service') {
      defaultCols.push(
        {
          title: 'Giá vé',
          dataIndex: 'price',
          key: 'price',
          align: 'right' as const,
          render: (val: number) => (
            <span className="font-bold text-emerald-600 text-sm">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)}
            </span>
          ),
        },
        {
          title: 'Loại dịch vụ',
          dataIndex: 'name',
          key: 'serviceType',
          render: (name: string) => {
            const isTransport = name?.toLowerCase().includes('xe') || name?.toLowerCase().includes('di chuyển') || name?.toLowerCase().includes('cano');
            return isTransport ? (
              <Tag color="orange" className="font-bold rounded-md px-2 py-0.5 text-[10px]">DI CHUYỂN</Tag>
            ) : (
              <Tag color="cyan" className="font-bold rounded-md px-2 py-0.5 text-[10px]">THAM QUAN</Tag>
            );
          },
        }
      );
    }

    // Append Action columns
    defaultCols.push({
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            className="text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center justify-center p-2"
          />
          <Popconfirm
            title={`Bạn có chắc chắn muốn xóa ${title.toLowerCase()} này không?`}
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
    } as any);

    return defaultCols;
  }, [type, title]);

  return (
    <div className="space-y-6">
      {/* Zone 1: Thanh Công Cụ & Bộ Lọc (Header & Filters) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Filters Group (Left) */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            placeholder={`Tìm kiếm tên hoặc địa chỉ ${title.toLowerCase()}...`}
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

        {/* Action Button (Right) */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
          className="h-10 bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 border-emerald-600 rounded-lg text-sm font-bold text-white flex items-center gap-1.5 px-4 shadow-sm"
        >
          Thêm {title}
        </Button>
      </div>

      {/* Zone 2: Bảng Dữ Liệu Trung Tâm */}
      <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          columns={tableColumns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-6 py-4 border-t border-slate-100",
          }}
          className="w-full text-left"
        />
      </Card>

      {/* Zone 3: Drawer Nhập Liệu */}
      <Drawer
        title={editingItem ? `Chỉnh sửa ${title}` : `Thêm ${title} mới`}
        width={560}
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
          className="space-y-4"
        >
          {/* Tên Resource */}
          <Form.Item
            name="name"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên {title} *</span>}
            rules={[{ required: true, message: `Vui lòng nhập tên ${title.toLowerCase()}` }]}
          >
            <Input placeholder={`e.g. ${title === 'Khách sạn' ? 'Mường Thanh Luxury' : title === 'Nhà hàng' ? 'Nhà Hàng Ngon' : 'Vé Cáp Treo Fansipan'}`} className="h-10 border-slate-300 rounded-lg text-sm" />
          </Form.Item>

          {/* Địa điểm (Dropdown) */}
          <Form.Item
            name="locationId"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa điểm (Tỉnh/Thành) *</span>}
            rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
          >
            <Select placeholder="Chọn địa điểm..." className="h-10 text-sm" dropdownStyle={{ borderRadius: '8px' }}>
              {locations.map((loc) => (
                <Select.Option key={loc.id} value={loc.id}>
                  {loc.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Cấu trúc lưới chia 2 cột cho các trường ngắn */}
          {(type === 'hotel' || type === 'restaurant') && (
            <div className="grid grid-cols-2 gap-4">
              {/* Số điện thoại */}
              <Form.Item
                name="phone"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</span>}
                rules={[
                  { pattern: /^[0-9+()#.\s-]{8,15}$/, message: 'Số điện thoại không hợp lệ' }
                ]}
              >
                <Input placeholder="e.g. 0912345678" className="h-10 border-slate-300 rounded-lg text-sm" />
              </Form.Item>

              {/* Giá tiền */}
              <Form.Item
                name="price"
                label={
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {type === 'hotel' ? 'Giá cơ sở / Đêm (VNĐ) *' : 'Giá / Suất (VNĐ) *'}
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập giá tiền' }]}
              >
                <Input type="number" min={0} placeholder="e.g. 500000" className="h-10 border-slate-300 rounded-lg text-sm font-bold text-emerald-600" />
              </Form.Item>
            </div>
          )}

          {type === 'service' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Giá vé */}
              <Form.Item
                name="price"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giá vé (VNĐ) *</span>}
                rules={[{ required: true, message: 'Vui lòng nhập giá vé' }]}
              >
                <Input type="number" min={0} placeholder="e.g. 150000" className="h-10 border-slate-300 rounded-lg text-sm font-bold text-emerald-600" />
              </Form.Item>

              {/* Loại dịch vụ (Simulated dropdown) */}
              <Form.Item
                name="serviceType"
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại dịch vụ</span>}
                initialValue="VISIT"
              >
                <Select className="h-10 text-sm" dropdownStyle={{ borderRadius: '8px' }}>
                  <Select.Option value="VISIT">THAM QUAN</Select.Option>
                  <Select.Option value="TRANSPORT">DI CHUYỂN</Select.Option>
                </Select>
              </Form.Item>
            </div>
          )}

          {/* Địa chỉ (Chỉ cho hotel và restaurant) */}
          {(type === 'hotel' || type === 'restaurant') && (
            <Form.Item
              name="address"
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ chi tiết *</span>}
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}
            >
              <Input placeholder="e.g. 123 Đường Trần Phú" className="h-10 border-slate-300 rounded-lg text-sm" />
            </Form.Item>
          )}

          {/* Mô tả dài */}
          <Form.Item
            name="description"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả chi tiết</span>}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập thông tin mô tả chi tiết, ưu đãi, quy định hoàn hủy dịch vụ..."
              className="border-slate-300 rounded-lg text-sm resize-none"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
