import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Button, Space, Select, message, Modal, Form, Input, InputNumber, Descriptions, App } from 'antd';
import { getProjects } from '../../api/projects';
import { getServers } from '../../api/servers';
import { createDataBackup, deleteDataBackup, getDataBackups, updateDataBackup } from '../../api/dataBackups';
import { useAuth } from '../../contexts/AuthContext';

const backupTypeOptions = [
  { label: '文件', value: 'file' },
  { label: '数据库', value: 'database' },
];

const backupPolicyOptions = [
  { label: '增量', value: 'incremental' },
  { label: '全量', value: 'full' },
];

const labelOf = (opts: { label: string; value: string }[], v: unknown) =>
  opts.find((o) => o.value === String(v))?.label ?? String(v ?? '-');

export default function DataBackupList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [servers, setServers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [serverIdFilter, setServerIdFilter] = useState<number | undefined>();
  const [backupTypeFilter, setBackupTypeFilter] = useState<string | undefined>();
  const [backupPolicyFilter, setBackupPolicyFilter] = useState<string | undefined>();

  const [form] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const [searchParams] = useSearchParams();

  const formProjectId = Form.useWatch('projectId', form);

  const serverOptionsByProject = useMemo(() => {
    const pid = formProjectId ?? projectIdFilter;
    const filtered = pid != null ? servers.filter((s) => String(s.projectId ?? '') === String(pid)) : servers;
    return filtered.map((s) => ({ label: String(s.ip ?? '-'), value: s.id as number }));
  }, [servers, formProjectId, projectIdFilter]);

  const load = async (params?: {
    projectId?: number;
    serverId?: number;
    backupType?: string;
    backupPolicy?: string;
  }) => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        getProjects(),
        getServers(params?.projectId ?? projectIdFilter),
      ]);
      setProjects(Array.isArray(r1.data) ? r1.data : []);
      setServers(Array.isArray(r2.data) ? r2.data : []);

      const { data } = await getDataBackups({
        projectId: params?.projectId ?? projectIdFilter,
        serverId: params?.serverId ?? serverIdFilter,
        backupType: params?.backupType ?? backupTypeFilter,
        backupPolicy: params?.backupPolicy ?? backupPolicyFilter,
      });
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdFilter, serverIdFilter, backupTypeFilter, backupPolicyFilter]);

  useEffect(() => {
    const pid = searchParams.get('projectId');
    const sid = searchParams.get('serverId');
    if (pid) setProjectIdFilter(Number(pid));
    if (sid) setServerIdFilter(Number(sid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formProjectId != null) {
      // 新增时：切换所属项目后，需要清空已选服务器
      // 编辑时：projectId 是只读的（Select disabled），不要把既有 serverId 清空
      if (editingId == null) form.setFieldValue('serverId', undefined);

      // 仅当编辑弹窗选了项目，拉取该项目下服务器
      getServers(formProjectId)
        .then((res) => setServers(Array.isArray(res.data) ? res.data : []))
        .catch(() => setServers([]));
    }
  }, [formProjectId, editingId]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    if (projectIdFilter) form.setFieldsValue({ projectId: projectIdFilter });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const proj = record.project as Record<string, unknown> | undefined;
    const srv = record.server as Record<string, unknown> | undefined;
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      serverId: record.serverId ?? srv?.id,
      backupType: record.backupType,
      backupPolicy: record.backupPolicy,
      scope: record.scope,
      cron: record.cron,
      retentionDays: record.retentionDays,
      localBackupPath: record.localBackupPath,
      remoteBackupPath: record.remoteBackupPath,
      localScriptPath: record.localScriptPath,
      gitScriptPath: record.gitScriptPath,
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
        backupType: v.backupType,
        backupPolicy: v.backupPolicy,
        scope: v.scope,
        cron: v.cron,
        retentionDays: v.retentionDays,
        localBackupPath: v.localBackupPath,
        remoteBackupPath: v.remoteBackupPath,
        localScriptPath: v.localScriptPath,
        gitScriptPath: v.gitScriptPath,
        remark: v.remark,
      };
      if (editingId != null) {
        await updateDataBackup(editingId, payload);
        message.success('更新成功');
      } else {
        await createDataBackup(payload);
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
        await deleteDataBackup(id);
        message.success('已删除');
        load();
      },
    });
  };

  const columns = [
    { title: '所属项目', dataIndex: ['project', 'name'], width: 140, ellipsis: true },
    { title: '所属服务器', dataIndex: ['server', 'ip'], width: 140, ellipsis: true },
    { title: '备份类型', dataIndex: 'backupType', width: 100, render: (v: string) => labelOf(backupTypeOptions, v) },
    { title: '备份策略', dataIndex: 'backupPolicy', width: 100, render: (v: string) => labelOf(backupPolicyOptions, v) },
    { title: '备份范围', dataIndex: 'scope', ellipsis: true },
    { title: '备份频率', dataIndex: 'cron', width: 140, ellipsis: true },
    { title: '保留天数', dataIndex: 'retentionDays', width: 90 },
    { title: '本地备份', dataIndex: 'localBackupPath', ellipsis: true },
    { title: '异地备份', dataIndex: 'remoteBackupPath', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setViewingRecord(record); setViewOpen(true); }}>
            查看
          </Button>
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
        <h2>数据备份管理</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增备份</Button>}
      </div>
      <div className="page-query">
        <span>所属项目：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 200 }}
          value={projectIdFilter}
          onChange={(v) => {
            setProjectIdFilter(v);
            setServerIdFilter(undefined);
          }}
          options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
        />
        <span>所属服务器：</span>
        <Select
          allowClear
          placeholder={projectIdFilter ? '请选择服务器IP' : '请先选择项目（可选）'}
          style={{ width: 200 }}
          value={serverIdFilter}
          onChange={setServerIdFilter}
          options={(projectIdFilter != null ? servers.filter((s) => String(s.projectId ?? '') === String(projectIdFilter)) : servers).map((s) => ({ label: String(s.ip ?? '-'), value: s.id as number }))}
        />
        <span>备份类型：</span>
        <Select allowClear placeholder="请选择" style={{ width: 140 }} value={backupTypeFilter} onChange={setBackupTypeFilter} options={backupTypeOptions} />
        <span>备份策略：</span>
        <Select allowClear placeholder="请选择" style={{ width: 140 }} value={backupPolicyFilter} onChange={setBackupPolicyFilter} options={backupPolicyOptions} />
        <Button type="primary" onClick={() => load()}>查询</Button>
        <Button
          onClick={() => {
            setProjectIdFilter(undefined);
            setServerIdFilter(undefined);
            setBackupTypeFilter(undefined);
            setBackupPolicyFilter(undefined);
          }}
        >
          重置
        </Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />

      <Modal
        title={editingId != null ? '编辑备份配置' : '新增备份配置'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={760}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select
              options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
              placeholder="请选择"
              disabled={editingId != null}
            />
          </Form.Item>
          <Form.Item name="serverId" label="所属服务器" rules={[{ required: true, message: '请选择服务器IP' }]}>
            <Select options={serverOptionsByProject} placeholder="请选择服务器IP" disabled={!formProjectId} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item name="backupType" label="备份类型" rules={[{ required: true }]}>
                <Select allowClear placeholder="请选择" options={backupTypeOptions} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item name="backupPolicy" label="备份策略" rules={[{ required: true }]}>
                <Select allowClear placeholder="请选择" options={backupPolicyOptions} />
              </Form.Item>
            </div>
          </div>
          <Form.Item name="scope" label="备份范围" rules={[{ required: true, message: '请输入备份范围描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item name="cron" label="备份频率（cron表达式）" rules={[{ required: true, message: '请输入cron表达式' }]}>
                <Input maxLength={64} placeholder="例如：0 2 * * *" />
              </Form.Item>
            </div>
            <div style={{ width: 180 }}>
              <Form.Item name="retentionDays" label="保留天数" rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>
          <Form.Item name="localBackupPath" label="本地备份（存储路径）">
            <Input maxLength={512} />
          </Form.Item>
          <Form.Item name="remoteBackupPath" label="异地备份（存储路径）">
            <Input maxLength={512} />
          </Form.Item>
          <Form.Item name="localScriptPath" label="本机备份脚本（路径）">
            <Input maxLength={512} />
          </Form.Item>
          <Form.Item name="gitScriptPath" label="Git备份脚本（路径）">
            <Input maxLength={512} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="查看备份配置" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={680} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="所属项目">{String((viewingRecord.project as Record<string, unknown> | undefined)?.name ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="所属服务器">{String((viewingRecord.server as Record<string, unknown> | undefined)?.ip ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="备份类型">{labelOf(backupTypeOptions, viewingRecord.backupType)}</Descriptions.Item>
            <Descriptions.Item label="备份策略">{labelOf(backupPolicyOptions, viewingRecord.backupPolicy)}</Descriptions.Item>
            <Descriptions.Item label="备份范围">
              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(viewingRecord.scope ?? '-')}</span>
            </Descriptions.Item>
            <Descriptions.Item label="备份频率（cron）">{String(viewingRecord.cron ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="保留天数">{String(viewingRecord.retentionDays ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="本地备份">{String(viewingRecord.localBackupPath ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="异地备份">{String(viewingRecord.remoteBackupPath ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="本机备份脚本">{String(viewingRecord.localScriptPath ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Git备份脚本">{String(viewingRecord.gitScriptPath ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="备注">
              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(viewingRecord.remark ?? '-')}</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

