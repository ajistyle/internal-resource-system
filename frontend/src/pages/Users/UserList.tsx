import { useEffect, useState } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select, Descriptions, App } from 'antd';
import { getUsers, createUser, updateUser, deleteUser, getRolesOptions } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';

export default function UserList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [roles, setRoles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [realNameFilter, setRealNameFilter] = useState('');
  const [form] = Form.useForm();
  const { isAdmin } = useAuth();
  const { modal } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([getUsers(), getRolesOptions()]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setRoles(Array.isArray(r2.data) ? r2.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) load();
  }, [isAdmin]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const roleList = (record.roles as Record<string, unknown>[] | undefined) ?? [];
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      email: record.email,
      mobile: record.mobile,
      enabled: record.enabled ?? 1,
      roleIds: roleList.map((r) => r.id),
      password: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload: Record<string, unknown> = {
        username: v.username,
        realName: v.realName,
        email: v.email,
        mobile: v.mobile,
        enabled: v.enabled,
        roleIds: v.roleIds,
      };
      if (v.password) payload.password = v.password;
      if (editingId != null) {
        await updateUser(editingId, payload);
        message.success('更新成功');
      } else {
        if (!v.password) {
          message.error('请填写密码');
          return;
        }
        payload.password = v.password;
        await createUser(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteUser(id);
        message.success('已删除');
        load();
      },
    });
  };

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'realName' },
    { title: '角色', dataIndex: 'roles', render: (r: Record<string, unknown>[]) => (r ?? []).map((x) => (x as Record<string, string>).name).join(', ') },
    { title: '状态', dataIndex: 'enabled', width: 70, render: (n: number) => (n === 1 ? '启用' : '禁用') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setViewingRecord(record); setViewOpen(true); }}>查看</Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id as number)}>删除</Button>
        </Space>
      ),
    },
  ];

  const filteredList = list.filter((r) => {
    const u = String(r.username ?? '');
    const n = String(r.realName ?? '');
    const uq = usernameFilter.trim();
    const nq = realNameFilter.trim();
    if (uq && !u.includes(uq)) return false;
    if (nq && !n.includes(nq)) return false;
    return true;
  });

  if (!isAdmin()) return <div>仅管理员可访问</div>;

  return (
    <div>
      <div className="page-header">
        <h2>用户管理</h2>
        <Button type="primary" onClick={openCreate}>新增用户</Button>
      </div>
      <div className="page-query">
        <span>用户名：</span>
        <Input
          placeholder="请输入"
          allowClear
          style={{ width: 160 }}
          value={usernameFilter}
          onChange={(e) => setUsernameFilter(e.target.value)}
        />
        <span>姓名：</span>
        <Input
          placeholder="请输入"
          allowClear
          style={{ width: 160 }}
          value={realNameFilter}
          onChange={(e) => setRealNameFilter(e.target.value)}
        />
        <Button type="primary" onClick={() => load()}>查询</Button>
        <Button onClick={() => { setUsernameFilter(''); setRealNameFilter(''); }}>重置</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={filteredList} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal
        title={editingId != null ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={editingId ? [] : [{ required: true, min: 6 }]}>
            <Input.Password placeholder={editingId ? '不填则不修改' : '至少6位'} />
          </Form.Item>
          <Form.Item name="realName" label="姓名"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="mobile" label="手机"><Input /></Form.Item>
          <Form.Item name="enabled" label="状态" initialValue={1}>
            <Select options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" options={roles.map((r) => ({ label: r.name as string, value: r.id as number }))} placeholder="请选择" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="查看用户" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={560} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="用户名">{String(viewingRecord.username ?? '')}</Descriptions.Item>
            <Descriptions.Item label="姓名">{String(viewingRecord.realName ?? '')}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{String(viewingRecord.email ?? '')}</Descriptions.Item>
            <Descriptions.Item label="手机">{String(viewingRecord.mobile ?? '')}</Descriptions.Item>
            <Descriptions.Item label="角色">{(viewingRecord.roles as Record<string, string>[] ?? []).map((r) => r.name).join(', ')}</Descriptions.Item>
            <Descriptions.Item label="状态">{(viewingRecord.enabled as number) === 1 ? '启用' : '禁用'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
