'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Select, Button, Drawer, Form, Card, Popconfirm, Tag, message, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EnvironmentOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';

interface LocationNode {
  id: string;
  name: string;
  type: 'COUNTRY' | 'CITY_PROVINCE' | 'ATTRACTION';
  description?: string;
  address?: string;
  parentId?: string | null;
  key: string;
  children?: LocationNode[];
}

interface TreeSelectNode {
  value: string;
  title: string;
  children?: TreeSelectNode[];
  disabled?: boolean;
}

export default function LocationsAdminPage() {
  const [form] = Form.useForm();
  const apiEndpoint = '/locations';

  // States
  const [flatData, setFlatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocationNode | null>(null);

  // Fetch locations
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any[]>(apiEndpoint);
      if (res.success && Array.isArray(res.data)) {
        setFlatData(res.data);
      } else {
        message.error(`Không thể lấy danh sách địa điểm: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Build tree from flat data
  const treeData = useMemo(() => {
    const map: Record<string, LocationNode> = {};
    const roots: LocationNode[] = [];

    // Initialize map
    flatData.forEach((item) => {
      map[item.id] = {
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        address: item.address,
        parentId: item.parentId || null,
        key: item.id,
        children: [],
      };
    });

    // Build parent-child hierarchy
    flatData.forEach((item) => {
      const node = map[item.id];
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Clean empty children
    const cleanEmptyChildren = (nodes: LocationNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length === 0) {
          delete node.children;
        } else if (node.children) {
          cleanEmptyChildren(node.children);
        }
      });
    };
    cleanEmptyChildren(roots);

    return roots;
  }, [flatData]);

  // Handle Search & Filter over the tree
  const filteredTreeData = useMemo(() => {
    if (!searchQuery.trim() && !typeFilter) {
      return treeData;
    }

    const filterNode = (nodes: LocationNode[]): LocationNode[] => {
      return nodes
        .map((node) => {
          const matchSearch =
            !searchQuery.trim() ||
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (node.address && node.address.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchType = !typeFilter || node.type === typeFilter;

          let filteredChildren: LocationNode[] = [];
          if (node.children) {
            filteredChildren = filterNode(node.children);
          }

          const keepNode = (matchSearch && matchType) || filteredChildren.length > 0;

          if (keepNode) {
            return {
              ...node,
              children: filteredChildren.length > 0 ? filteredChildren : undefined,
            };
          }
          return null;
        })
        .filter(Boolean) as LocationNode[];
    };

    return filterNode(treeData);
  }, [treeData, searchQuery, typeFilter]);

  // Auto-expand parents on search query update
  useEffect(() => {
    if (!searchQuery.trim()) {
      setExpandedRowKeys([]);
      return;
    }

    const keys: React.Key[] = [];
    const findMatchingParents = (nodes: LocationNode[], path: React.Key[]) => {
      nodes.forEach((node) => {
        const isMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (isMatch && path.length > 0) {
          keys.push(...path);
        }
        if (node.children) {
          findMatchingParents(node.children, [...path, node.id]);
        }
      });
    };

    findMatchingParents(treeData, []);
    setExpandedRowKeys(Array.from(new Set(keys)));
  }, [searchQuery, treeData]);

  // Convert Tree to TreeSelect Options with circular ref protection
  const treeSelectData = useMemo(() => {
    const isDescendant = (node: LocationNode, targetId: string): boolean => {
      if (node.id === targetId) return true;
      if (node.children) {
        return node.children.some((child) => isDescendant(child, targetId));
      }
      return false;
    };

    const convert = (nodes: LocationNode[]): TreeSelectNode[] => {
      return nodes.map((node) => {
        const isSelfOrDescendant = editingItem ? isDescendant(node, editingItem.id) : false;

        return {
          value: node.id,
          title: `${node.name} (${node.type})`,
          disabled: isSelfOrDescendant,
          children: node.children ? convert(node.children) : undefined,
        };
      });
    };

    return convert(treeData);
  }, [treeData, editingItem]);

  // Actions
  const handleOpenAddRoot = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ type: 'COUNTRY', parentId: null });
    setIsDrawerOpen(true);
  };

  const handleAddChild = (parent: LocationNode) => {
    setEditingItem(null);
    form.resetFields();
    
    // Automatically determine type based on parent's type
    const defaultType = parent.type === 'COUNTRY' ? 'CITY_PROVINCE' : 'ATTRACTION';

    form.setFieldsValue({
      parentId: parent.id,
      type: defaultType,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: LocationNode) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      type: item.type,
      parentId: item.parentId || null,
      description: item.description,
      address: item.address,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiClient.delete(`${apiEndpoint}/${id}`);
      if (res.success) {
        message.success('Đã xóa địa điểm thành công!');
        fetchLocations();
      } else {
        message.error(`Không thể xóa: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi xóa địa điểm');
    }
  };

  const handleSave = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: values.name,
        type: values.type,
        description: values.description || '',
        address: values.address || '',
        parentId: values.parentId || null,
        parentLocation: values.parentId ? { id: values.parentId } : null,
      };

      const isNew = !editingItem;
      const itemId = isNew ? `LOC-${Math.floor(100000 + Math.random() * 900000)}` : editingItem.id;
      payload.id = itemId;

      let res;
      if (isNew) {
        res = await apiClient.post(apiEndpoint, payload);
      } else {
        res = await apiClient.put(`${apiEndpoint}/${itemId}`, payload);
      }

      if (res.success) {
        message.success(`Đã ${isNew ? 'thêm' : 'cập nhật'} địa điểm thành công!`);
        setIsDrawerOpen(false);
        fetchLocations();
      } else {
        message.error(`Không thể lưu địa điểm: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi lưu thông tin địa điểm');
    } finally {
      setSubmitting(false);
    }
  };

  // Columns Configuration
  const columns = [
    {
      title: 'Tên Địa điểm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: LocationNode) => {
        // Highlight query matches
        if (!searchQuery.trim()) {
          return <span className="font-bold text-slate-800 text-sm">{text}</span>;
        }
        const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
        if (index === -1) {
          return <span className="font-bold text-slate-800 text-sm">{text}</span>;
        }
        const before = text.substring(0, index);
        const match = text.substring(index, index + searchQuery.length);
        const after = text.substring(index + searchQuery.length);
        return (
          <span className="font-bold text-slate-800 text-sm">
            {before}
            <mark className="bg-yellow-200 text-slate-900 rounded-xs px-0.5">{match}</mark>
            {after}
          </span>
        );
      },
    },
    {
      title: 'Cấp độ',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: 'COUNTRY' | 'CITY_PROVINCE' | 'ATTRACTION') => {
        let color = 'blue';
        let label = 'Quốc gia';
        if (type === 'CITY_PROVINCE') {
          color = 'emerald';
          label = 'Tỉnh thành';
        } else if (type === 'ATTRACTION') {
          color = 'gray';
          label = 'Địa danh';
        }
        return (
          <Tag color={color} className="font-semibold rounded-md px-2 py-0.5 text-[11px] uppercase tracking-wider">
            {label}
          </Tag>
        );
      },
    },
    {
      title: 'Mô tả ngắn',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <span className="text-slate-500 text-xs font-normal">{text || '—'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'right' as const,
      render: (_: any, record: LocationNode) => {
        const hasChildren = record.children && record.children.length > 0;
        return (
          <div className="flex justify-end gap-1">
            <Button
              type="text"
              icon={<PlusCircleOutlined className="text-emerald-500" />}
              onClick={() => handleAddChild(record)}
              title="Thêm cấp dưới"
              className="hover:bg-emerald-50 rounded-lg flex items-center justify-center p-2"
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
              title="Sửa thông tin"
              className="text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center justify-center p-2"
            />
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa địa điểm này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
              disabled={hasChildren}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                disabled={hasChildren}
                className={`flex items-center justify-center p-2 rounded-lg ${
                  hasChildren ? 'text-slate-300 bg-transparent cursor-not-allowed' : 'hover:bg-rose-50'
                }`}
                title={hasChildren ? 'Bắt buộc xóa các cấp con trước' : 'Xóa địa điểm'}
              />
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Danh Mục Địa Điểm</h1>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý cơ cấu định vị phân cấp theo mô hình Quốc gia → Tỉnh thành → Địa danh phục vụ bộ lọc tìm kiếm và lập lộ trình.
        </p>
      </div>

      {/* Zone 1: Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            placeholder="Tìm kiếm tên địa điểm, mô tả..."
            prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-300 rounded-lg text-sm max-w-sm"
            allowClear
          />
          <Select
            placeholder="— Chọn loại địa điểm —"
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            className="h-10 text-sm min-w-[200px]"
            allowClear
            dropdownStyle={{ borderRadius: '8px' }}
          >
            <Select.Option value="COUNTRY">Quốc gia (Country)</Select.Option>
            <Select.Option value="CITY_PROVINCE">Tỉnh / Thành phố (City / Province)</Select.Option>
            <Select.Option value="ATTRACTION">Điểm tham quan (Attraction)</Select.Option>
          </Select>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAddRoot}
          className="h-10 bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 border-emerald-600 rounded-lg text-sm font-bold text-white flex items-center gap-1.5 px-4 shadow-sm"
        >
          Thêm Địa điểm gốc
        </Button>
      </div>

      {/* Zone 2: Tree Table */}
      <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden mb-8" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredTreeData}
          loading={loading}
          rowKey="id"
          expandedRowKeys={expandedRowKeys}
          onExpandedRowsChange={(keys) => setExpandedRowKeys(keys)}
          pagination={false}
          className="w-full text-left"
        />
      </Card>

      {/* Zone 3: Drawer Form */}
      <Drawer
        title={editingItem ? 'Cập nhật Địa điểm' : 'Thêm Địa điểm mới'}
        width={480}
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
          <Form.Item
            name="name"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Địa điểm *</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên địa điểm' }]}
          >
            <Input placeholder="e.g. Ninh Bình, Việt Nam..." className="h-10 border-slate-300 rounded-lg text-sm" />
          </Form.Item>

          <Form.Item
            name="type"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại Địa điểm *</span>}
            rules={[{ required: true, message: 'Vui lòng chọn loại địa điểm' }]}
          >
            <Select className="h-10 text-sm" dropdownStyle={{ borderRadius: '8px' }}>
              <Select.Option value="COUNTRY">Quốc gia (Country)</Select.Option>
              <Select.Option value="CITY_PROVINCE">Tỉnh / Thành phố (City / Province)</Select.Option>
              <Select.Option value="ATTRACTION">Điểm tham quan (Attraction)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="parentId"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trực thuộc (Địa điểm cha)</span>}
          >
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto', borderRadius: '8px' }}
              placeholder="Chọn địa điểm cấp trên (để trống nếu là gốc)..."
              allowClear
              treeDefaultExpandAll
              treeData={treeSelectData}
              className="text-sm min-h-[40px]"
            />
          </Form.Item>

          <Form.Item
            name="address"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ / Vị trí</span>}
          >
            <Input placeholder="e.g. Huyện Gia Viễn, Tỉnh Ninh Bình" className="h-10 border-slate-300 rounded-lg text-sm" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả tóm tắt</span>}
          >
            <Input.TextArea
              placeholder="Nhập thông tin giới thiệu tóm tắt địa danh..."
              rows={4}
              className="border-slate-300 rounded-lg text-sm"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </DashboardLayout>
  );
}
