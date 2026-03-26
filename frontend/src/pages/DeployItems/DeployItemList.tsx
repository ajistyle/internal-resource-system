import { useEffect, useState } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select, DatePicker, Descriptions, App } from 'antd';
import { getDeployItems, createDeployItem, updateDeployItem, deleteDeployItem } from '../../api/deployItems';
import { getDictionaries } from '../../api/dictionaries';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

export default function DeployItemList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [softwareTypeOptions, setSoftwareTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [softwareTypeFilter, setSoftwareTypeFilter] = useState<string | undefined>();
  const [nameFilter, setNameFilter] = useState<string>('');
  const [form] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const load = async (softwareType?: string, name?: string) => {
    setLoading(true);
    try {
      const params: { softwareType?: string; name?: string } = {};
      if (softwareType != null && softwareType !== '') params.softwareType = softwareType;
      if (name != null && name !== '') params.name = name;
      const { data } = await getDeployItems(params);
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const onQuery = () => {
    load(softwareTypeFilter, nameFilter || undefined);
  };

  const onResetQuery = () => {
    setSoftwareTypeFilter(undefined);
    setNameFilter('');
    load();
  };

  const loadSoftwareTypeOptions = async () => {
    try {
      const { data } = await getDictionaries({ type: '软件类型名称', parentCode: '000200', status: 1 });
      const arr = Array.isArray(data) ? data : [];
      setSoftwareTypeOptions(arr.map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.name ?? '') })));
    } catch {
      setSoftwareTypeOptions([]);
    }
  };

  useEffect(() => {
    load();
    loadSoftwareTypeOptions();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    form.setFieldsValue({
      name: record.name,
      version: record.version,
      softwareType: record.softwareType,
      defaultAccess: record.defaultAccess,
      selectedAt: record.selectedAt ? dayjs(record.selectedAt as string) : null,
      enabled: record.enabled ?? 1,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        ...v,
        selectedAt: v.selectedAt ? v.selectedAt.format('YYYY-MM-DD') : undefined,
      };
      if (editingId != null) {
        await updateDeployItem(editingId, payload);
        message.success('更新成功');
      } else {
        await createDeployItem(payload);
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
        await deleteDeployItem(id);
        message.success('已删除');
        load();
      },
    });
  };

  const columns = [
    { title: '软件名称', dataIndex: 'name' },
    { title: '版本', dataIndex: 'version' },
    { title: '软件类型', dataIndex: 'softwareType', width: 100 },
    { title: '默认访问方式', dataIndex: 'defaultAccess', ellipsis: true },
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
        <h2>软件清单</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增部署软件</Button>}
      </div>
      <div className="page-query">
        <span>软件类型：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 160 }}
          value={softwareTypeFilter}
          onChange={setSoftwareTypeFilter}
          options={softwareTypeOptions}
        />
        <span>软件名称：</span>
        <Input
          placeholder="请输入"
          allowClear
          style={{ width: 160 }}
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <Button type="primary" onClick={onQuery}>查询</Button>
        <Button onClick={onResetQuery}>重置</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal
        title={editingId != null ? '编辑部署软件' : '新增部署软件'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="软件名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="version" label="版本"><Input /></Form.Item>
          <Form.Item name="softwareType" label="软件类型">
            <Select allowClear placeholder="请选择" options={softwareTypeOptions} />
          </Form.Item>
          <Form.Item name="defaultAccess" label="默认访问方式"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="selectedAt" label="入选时间"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="enabled" label="启用" initialValue={1}>
            <Input type="number" min={0} max={1} />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title="查看部署软件" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={560} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="软件名称">{String(viewingRecord.name ?? '')}</Descriptions.Item>
            <Descriptions.Item label="版本">{String(viewingRecord.version ?? '')}</Descriptions.Item>
            <Descriptions.Item label="软件类型">{String(viewingRecord.softwareType ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="默认访问方式">{String(viewingRecord.defaultAccess ?? '')}</Descriptions.Item>
            <Descriptions.Item label="入选时间">{String(viewingRecord.selectedAt ?? '')}</Descriptions.Item>
            <Descriptions.Item label="启用">{(viewingRecord.enabled as number) === 1 ? '是' : '否'}</Descriptions.Item>
            <Descriptions.Item label="备注">{String(viewingRecord.remark ?? '')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
