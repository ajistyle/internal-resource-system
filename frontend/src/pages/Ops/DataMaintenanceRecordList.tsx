import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Button, Space, Select, message, Modal, Form, Input, InputNumber, DatePicker, Descriptions, App } from 'antd';
import dayjs from 'dayjs';
import { getProjects } from '../../api/projects';
import { getDatabases } from '../../api/databases';
import { getDictionaries } from '../../api/dictionaries';
import { getDataMaintenanceRecords, createDataMaintenanceRecord, updateDataMaintenanceRecord, deleteDataMaintenanceRecord } from '../../api/dataMaintenanceRecords';
import { useAuth } from '../../contexts/AuthContext';

export default function DataMaintenanceRecordList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [databases, setDatabases] = useState<Record<string, unknown>[]>([]);
  const [sourceOptions, setSourceOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [databaseIdFilter, setDatabaseIdFilter] = useState<number | undefined>();
  const [form] = Form.useForm();
  const { canEdit, user } = useAuth();
  const { modal } = App.useApp();

  const [searchParams] = useSearchParams();

  const load = async (pid?: number, did?: number) => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        getDataMaintenanceRecords({ projectId: pid, databaseId: did }),
        getProjects(),
        getDatabases(pid),
        getDictionaries({ parentCode: '000600', status: 1 }),
      ]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setProjects(Array.isArray(r2.data) ? r2.data : []);
      setDatabases(Array.isArray(r3.data) ? r3.data : []);
      const dict = Array.isArray(r4.data) ? r4.data : [];
      setSourceOptions(dict.map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.code ?? '') })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(projectIdFilter, databaseIdFilter);
  }, [projectIdFilter, databaseIdFilter]);

  useEffect(() => {
    const pid = searchParams.get('projectId');
    const did = searchParams.get('databaseId');
    if (pid) setProjectIdFilter(Number(pid));
    if (did) setDatabaseIdFilter(Number(did));
  }, []);

  const formProjectId = Form.useWatch('projectId', form);
  const dbOptions = useMemo(() => {
    return databases
      .filter((d) => (formProjectId ? d.projectId === formProjectId : true))
      .map((d) => ({ label: `${String(d.name ?? '')}${d.dbType ? `（${String(d.dbType)}）` : ''}`, value: d.id as number }));
  }, [databases, formProjectId]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      projectId: projectIdFilter,
      handledAt: dayjs(),
      handler: user?.realName || user?.username,
    });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const proj = record.project as Record<string, unknown> | undefined;
    const db = record.database as Record<string, unknown> | undefined;
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      databaseId: record.databaseId ?? db?.id,
      requestSource: record.requestSource,
      complianceNote: record.complianceNote,
      handlingMeasure: record.handlingMeasure,
      handlingCount: record.handlingCount,
      handledAt: record.handledAt ? dayjs(String(record.handledAt)) : undefined,
      handler: record.handler,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        projectId: v.projectId,
        databaseId: v.databaseId,
        requestSource: v.requestSource,
        complianceNote: v.complianceNote,
        handlingMeasure: v.handlingMeasure,
        handlingCount: v.handlingCount,
        handledAt: v.handledAt?.toISOString(),
        handler: v.handler,
        remark: v.remark,
      };
      if (editingId != null) {
        await updateDataMaintenanceRecord(editingId, payload);
        message.success('更新成功');
      } else {
        await createDataMaintenanceRecord(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      load(projectIdFilter, databaseIdFilter);
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteDataMaintenanceRecord(id);
        message.success('已删除');
        load(projectIdFilter, databaseIdFilter);
      },
    });
  };

  const columns = [
    { title: '所属项目', dataIndex: ['project', 'name'], key: 'projectName' },
    { title: '数据库', dataIndex: ['database', 'name'], width: 160, ellipsis: true },
    { title: '需求来源', dataIndex: 'requestSource', width: 140, render: (v: string) => sourceOptions.find((o) => o.value === v)?.label ?? v },
    { title: '是否合规', dataIndex: 'complianceNote', width: 160, ellipsis: true },
    { title: '处理措施', dataIndex: 'handlingMeasure', ellipsis: true },
    { title: '处理数量', dataIndex: 'handlingCount', width: 90 },
    { title: '处理时间', dataIndex: 'handledAt', width: 170, render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-') },
    { title: '处理人', dataIndex: 'handler', width: 110 },
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
        <h2>数据维护记录</h2>
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
        <span>数据库：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 220 }}
          value={databaseIdFilter}
          onChange={setDatabaseIdFilter}
          options={databases
            .filter((d) => (projectIdFilter ? d.projectId === projectIdFilter : true))
            .map((d) => ({ label: `${String(d.name ?? '')}${d.dbType ? `（${String(d.dbType)}）` : ''}`, value: d.id as number }))}
        />
        <Button type="primary" onClick={() => load(projectIdFilter, databaseIdFilter)}>查询</Button>
        <Button onClick={() => { setProjectIdFilter(undefined); setDatabaseIdFilter(undefined); }}>重置</Button>
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
              onChange={() => form.setFieldValue('databaseId', undefined)}
            />
          </Form.Item>
          <Form.Item name="databaseId" label="数据库" rules={[{ required: true }]}>
            <Select placeholder={formProjectId ? '请选择' : '请先选择所属项目'} options={dbOptions} disabled={!formProjectId} />
          </Form.Item>
          <Form.Item name="requestSource" label="需求来源" rules={[{ required: true }]}>
            <Select allowClear placeholder="请选择" options={sourceOptions} />
          </Form.Item>
          <Form.Item
            name="complianceNote"
            label="是否合规"
            extra="是否有盖章文件，没有则注明需求人姓名"
          >
            <Input maxLength={256} />
          </Form.Item>
          <Form.Item name="handlingMeasure" label="处理措施">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="handlingCount" label="处理数量">
            <InputNumber min={0} step={1} precision={0} style={{ width: '100%' }} placeholder="请输入整数" />
          </Form.Item>
          <Form.Item name="handledAt" label="处理时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="handler" label="处理人" rules={[{ required: true }]}>
            <Input maxLength={64} />
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
            <Descriptions.Item label="数据库">{String(((viewingRecord.database as Record<string, unknown>)?.name) ?? '')}</Descriptions.Item>
            <Descriptions.Item label="需求来源">{sourceOptions.find((o) => o.value === viewingRecord.requestSource)?.label ?? String(viewingRecord.requestSource ?? '')}</Descriptions.Item>
            <Descriptions.Item label="是否合规">{String(viewingRecord.complianceNote ?? '')}</Descriptions.Item>
            <Descriptions.Item label="处理措施">{String(viewingRecord.handlingMeasure ?? '')}</Descriptions.Item>
            <Descriptions.Item label="处理数量">{viewingRecord.handlingCount != null ? String(viewingRecord.handlingCount) : '-'}</Descriptions.Item>
            <Descriptions.Item label="处理时间">{viewingRecord.handledAt ? dayjs(String(viewingRecord.handledAt)).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            <Descriptions.Item label="处理人">{String(viewingRecord.handler ?? '')}</Descriptions.Item>
            <Descriptions.Item label="备注">{String(viewingRecord.remark ?? '')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

