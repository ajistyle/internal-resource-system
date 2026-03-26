import { useEffect, useState } from 'react';
import { Table, Button, Space, Select, message, Modal, Form, Input, Descriptions, App } from 'antd';
import { getStakeholders, createStakeholder, updateStakeholder, deleteStakeholder } from '../../api/stakeholders';
import { getProjects } from '../../api/projects';
import { useAuth } from '../../contexts/AuthContext';

export default function StakeholderList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState<{ projectId?: number; name?: string }>({});
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const load = async (params?: { projectId?: number; name?: string }) => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        getStakeholders(params),
        getProjects(),
      ]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setProjects(Array.isArray(r2.data) ? r2.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(query);
  }, [query]);

  const onQuery = () => {
    const v = queryForm.getFieldsValue();
    setQuery({
      projectId: v.projectId,
      name: v.name?.trim() || undefined,
    });
  };

  const onResetQuery = () => {
    queryForm.resetFields();
    setQuery({});
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    if (query.projectId) form.setFieldsValue({ projectId: query.projectId });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const proj = record.project as Record<string, unknown> | undefined;
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      name: record.name,
      contact: record.contact,
      role: record.role,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editingId != null) {
        await updateStakeholder(editingId, { name: v.name, contact: v.contact, role: v.role, remark: v.remark });
        message.success('更新成功');
      } else {
        await createStakeholder(v);
        message.success('创建成功');
      }
      setModalOpen(false);
      load(query);
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteStakeholder(id);
        message.success('已删除');
        load(query);
      },
    });
  };

  const columns = [
    { title: '所属项目', dataIndex: ['project', 'name'], key: 'projectName' },
    { title: '姓名', dataIndex: 'name' },
    { title: '干系人角色', dataIndex: 'role', width: 100 },
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
    <div>
      <div className="page-header">
        <h2>干系人</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增干系人</Button>}
      </div>
      <Form form={queryForm} layout="inline" className="page-query" onFinish={onQuery}>
        <Form.Item name="projectId" label="所属项目">
          <Select placeholder="请选择项目" allowClear style={{ width: 200 }} options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))} />
        </Form.Item>
        <Form.Item name="name" label="姓名">
          <Input placeholder="姓名" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button onClick={onResetQuery}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal
        title={editingId != null ? '编辑干系人' : '新增干系人'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))} placeholder="请选择" disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="干系人角色"><Input placeholder="如：项目经理、开发负责人等" /></Form.Item>
          <Form.Item name="contact" label="联系方式"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title="查看干系人" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={560} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="所属项目">{(viewingRecord.project as Record<string, unknown>)?.name as string ?? ''}</Descriptions.Item>
            <Descriptions.Item label="姓名">{String(viewingRecord.name ?? '')}</Descriptions.Item>
            <Descriptions.Item label="干系人角色">{String(viewingRecord.role ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{String(viewingRecord.contact ?? '')}</Descriptions.Item>
            <Descriptions.Item label="备注">{String(viewingRecord.remark ?? '')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
