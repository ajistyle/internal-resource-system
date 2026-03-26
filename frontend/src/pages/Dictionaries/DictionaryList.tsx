import { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Select, message, Modal, Form, Input, Descriptions, App, Tree, Layout } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { getDictionaries, createDictionary, updateDictionary, deleteDictionary } from '../../api/dictionaries';
import { useAuth } from '../../contexts/AuthContext';

const { Sider, Content } = Layout;

export default function DictionaryList() {
  const [allList, setAllList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const ROOT_PARENT_CODE = '000001';
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [query, setQuery] = useState<{ code?: string; name?: string; status?: number }>({});
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getDictionaries(query);
      setAllList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  const MAX_TREE_LEVEL = 3;

  const buildChildren = (parentCode: string, level: number): DataNode[] => {
    if (level >= MAX_TREE_LEVEL) return [];
    return allList
      .filter((d) => (d.parentCode ?? '') === parentCode)
      .sort((a, b) => String(a.code ?? '').localeCompare(String(b.code ?? '')))
      .map((d) => {
        const code = String(d.code ?? '');
        const nodeKey = code;
        const children = buildChildren(code, level + 1);
        return {
          key: nodeKey,
          title: `${d.name ?? code} (${code})`,
          isLeaf: children.length === 0,
          children: children.length > 0 ? children : undefined,
        } as DataNode;
      });
  };

  const treeData = useMemo<DataNode[]>(() => {
    return buildChildren(ROOT_PARENT_CODE, 1);
  }, [allList]);

  const selectedParentCode = selectedKey === '' ? ROOT_PARENT_CODE : selectedKey;

  const list = useMemo(() => {
    return allList.filter((d) => (d.parentCode ?? '') === selectedParentCode);
  }, [allList, selectedParentCode]);

  const onQuery = () => {
    const v = queryForm.getFieldsValue();
    setQuery({
      code: v.code?.trim() || undefined,
      name: v.name?.trim() || undefined,
      status: v.status,
    });
  };

  const onResetQuery = () => {
    queryForm.resetFields();
    setQuery({});
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      ...(selectedParentCode !== ROOT_PARENT_CODE ? { parentCode: selectedParentCode } : {}),
    });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      parentCode: record.parentCode ?? undefined,
      status: record.status ?? 1,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editingId != null) {
        await updateDictionary(editingId, v);
        message.success('更新成功');
      } else {
        await createDictionary(v);
        message.success('创建成功');
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message ?? (e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteDictionary(id);
        message.success('已删除');
        load();
      },
    });
  };

  const columns = [
    { title: '字典代码', dataIndex: 'code', width: 120 },
    { title: '字典名称', dataIndex: 'name' },
    { title: '父编码', dataIndex: 'parentCode', width: 100 },
    { title: '字典状态', dataIndex: 'status', width: 90, render: (n: number) => (n === 1 ? '启用' : '禁用') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setViewingRecord(record); setViewOpen(true); }}>查看</Button>
          {canEdit() && (
            <>
              <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
              <Button type="link" size="small" danger onClick={() => handleDelete(record.id as number)}>删除</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ background: '#fff', minHeight: 400 }}>
      <Sider width={220} style={{ background: '#fafafa', borderRight: '1px solid #f0f0f0', padding: '16px 0' }}>
        <div style={{ padding: '0 12px 12px', fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>字典类型</div>
        <Tree
          blockNode
          defaultExpandAll
          selectedKeys={[selectedKey]}
          onSelect={(keys) => {
            const k = keys[0] as string | undefined;
            if (k != null) setSelectedKey(k);
          }}
          treeData={treeData}
          style={{ background: 'transparent' }}
        />
      </Sider>
      <Content style={{ padding: 24, minWidth: 0 }}>
        <div className="page-header">
          <h2>字典清单</h2>
          {canEdit() && <Button type="primary" onClick={openCreate}>新增字典</Button>}
        </div>
        <Form form={queryForm} layout="inline" className="page-query" onFinish={onQuery}>
          <Form.Item name="code" label="字典编码">
            <Input placeholder="字典编码" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="name" label="字典名称">
            <Input placeholder="字典名称" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="status" label="字典状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={onResetQuery}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
        <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      </Content>
      <Modal
        title={editingId != null ? '编辑字典' : '新增字典'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="字典代码" rules={[{ required: true, message: '请输入字典代码' }]}>
            <Input placeholder="如：BJ" maxLength={64} disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="name" label="字典名称" rules={[{ required: true, message: '请输入字典名称' }]}>
            <Input placeholder="如：北京市" maxLength={128} />
          </Form.Item>
          <Form.Item name="parentCode" label="父编码">
            <Input placeholder="上级字典的编码，选填" maxLength={64} allowClear />
          </Form.Item>
          <Form.Item name="status" label="字典状态" rules={[{ required: true }]}>
            <Select options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="查看字典" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={560} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="字典代码">{String(viewingRecord.code ?? '')}</Descriptions.Item>
            <Descriptions.Item label="字典名称">{String(viewingRecord.name ?? '')}</Descriptions.Item>
            <Descriptions.Item label="父编码">{String(viewingRecord.parentCode ?? '')}</Descriptions.Item>
            <Descriptions.Item label="字典状态">{(viewingRecord.status as number) === 1 ? '启用' : '禁用'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Layout>
  );
}
