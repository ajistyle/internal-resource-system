import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Button, Space, Select, message, Modal, Form, Input, DatePicker, Descriptions, App } from 'antd';
import dayjs from 'dayjs';
import { getProjects } from '../../api/projects';
import { getServers } from '../../api/servers';
import { getDictionaries } from '../../api/dictionaries';
import { getServerMaintenanceRecords, createServerMaintenanceRecord, updateServerMaintenanceRecord, deleteServerMaintenanceRecord } from '../../api/serverMaintenanceRecords';
import { useAuth } from '../../contexts/AuthContext';

export default function ServerMaintenanceRecordList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [servers, setServers] = useState<Record<string, unknown>[]>([]);
  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [serverIdFilter, setServerIdFilter] = useState<number | undefined>();
  const [form] = Form.useForm();
  const { canEdit, user } = useAuth();
  const { modal } = App.useApp();

  const [searchParams] = useSearchParams();

  const load = async (pid?: number, sid?: number) => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        getServerMaintenanceRecords({ projectId: pid, serverId: sid }),
        getProjects(),
        getServers(pid),
        getDictionaries({ parentCode: '000400', status: 1 }),
      ]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setProjects(Array.isArray(r2.data) ? r2.data : []);
      setServers(Array.isArray(r3.data) ? r3.data : []);
      const dict = Array.isArray(r4.data) ? r4.data : [];
      setTypeOptions(dict.map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.code ?? '') })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(projectIdFilter, serverIdFilter);
  }, [projectIdFilter, serverIdFilter]);

  useEffect(() => {
    const pid = searchParams.get('projectId');
    const sid = searchParams.get('serverId');
    if (pid) setProjectIdFilter(Number(pid));
    if (sid) setServerIdFilter(Number(sid));
  }, []);

  const formProjectId = Form.useWatch('projectId', form);
  const serverOptions = useMemo(() => {
    return servers
      .filter((s) => (formProjectId ? s.projectId === formProjectId : true))
      .map((s) => ({ label: String(s.ip ?? ''), value: s.id as number }));
  }, [servers, formProjectId]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      projectId: projectIdFilter,
      operator: user?.realName || user?.username,
      operatedAt: dayjs(),
    });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const proj = record.project as Record<string, unknown> | undefined;
    const srv = record.server as Record<string, unknown> | undefined;
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      serverId: record.serverId ?? srv?.id,
      maintenanceType: record.maintenanceType,
      content: record.content,
      operator: record.operator,
      operatedAt: record.operatedAt ? dayjs(String(record.operatedAt)) : undefined,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        projectId: v.projectId,
        serverId: v.serverId,
        maintenanceType: v.maintenanceType,
        content: v.content,
        operator: v.operator,
        operatedAt: v.operatedAt?.toISOString(),
        remark: v.remark,
      };
      if (editingId != null) {
        await updateServerMaintenanceRecord(editingId, payload);
        message.success('更新成功');
      } else {
        await createServerMaintenanceRecord(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      load(projectIdFilter, serverIdFilter);
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteServerMaintenanceRecord(id);
        message.success('已删除');
        load(projectIdFilter, serverIdFilter);
      },
    });
  };

  const columns = [
    { title: '所属项目', dataIndex: ['project', 'name'], key: 'projectName' },
    { title: 'IP', dataIndex: ['server', 'ip'], width: 140 },
    { title: '维护类型', dataIndex: 'maintenanceType', width: 140, render: (v: string) => typeOptions.find((o) => o.value === v)?.label ?? v },
    { title: '操作内容', dataIndex: 'content', ellipsis: true },
    { title: '操作人', dataIndex: 'operator', width: 110 },
    { title: '操作时间', dataIndex: 'operatedAt', width: 170, render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-') },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
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
        <h2>服务器维护记录</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增记录</Button>}
      </div>
      <div className="page-query">
        <span>所属项目：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 220 }}
          value={projectIdFilter}
          onChange={setProjectIdFilter}
          options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
        />
        <span>服务器：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 220 }}
          value={serverIdFilter}
          onChange={setServerIdFilter}
          options={servers
            .filter((s) => (projectIdFilter ? s.projectId === projectIdFilter : true))
            .map((s) => ({ label: `${String(s.ip ?? '')} (${String(s.name ?? '-')})`, value: s.id as number }))}
        />
        <Button type="primary" onClick={() => load(projectIdFilter, serverIdFilter)}>查询</Button>
        <Button onClick={() => { setProjectIdFilter(undefined); setServerIdFilter(undefined); }}>重置</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal
        title={editingId != null ? '编辑记录' : '新增记录'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select
              options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
              placeholder="请选择"
              onChange={() => form.setFieldValue('serverId', undefined)}
            />
          </Form.Item>
          <Form.Item name="serverId" label="IP（服务器）" rules={[{ required: true }]}>
            <Select placeholder={formProjectId ? '请选择' : '请先选择所属项目'} options={serverOptions} disabled={!formProjectId} />
          </Form.Item>
          <Form.Item name="maintenanceType" label="服务器维护类型" rules={[{ required: true }]}>
            <Select allowClear placeholder="请选择" options={typeOptions} />
          </Form.Item>
          <Form.Item name="content" label="操作内容" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="operator" label="操作人" rules={[{ required: true }]}>
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item name="operatedAt" label="操作时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="查看记录" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={560} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="所属项目">{(viewingRecord.project as Record<string, unknown>)?.name as string ?? ''}</Descriptions.Item>
            <Descriptions.Item label="IP">{String(((viewingRecord.server as Record<string, unknown>)?.ip) ?? '')}</Descriptions.Item>
            <Descriptions.Item label="服务器维护类型">{typeOptions.find((o) => o.value === viewingRecord.maintenanceType)?.label ?? String(viewingRecord.maintenanceType ?? '')}</Descriptions.Item>
            <Descriptions.Item label="操作内容">{String(viewingRecord.content ?? '')}</Descriptions.Item>
            <Descriptions.Item label="操作人">{String(viewingRecord.operator ?? '')}</Descriptions.Item>
            <Descriptions.Item label="操作时间">{viewingRecord.operatedAt ? dayjs(String(viewingRecord.operatedAt)).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{String(viewingRecord.remark ?? '')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

