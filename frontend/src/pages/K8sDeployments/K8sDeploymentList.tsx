import { useEffect, useState } from 'react';
import { Table, Button, Space, Select, message, Modal, Form, Input, Descriptions, Tag, Switch, Tabs } from 'antd';
import { getProjects } from '../../api/projects';
import { createK8sDeployment, deleteK8sDeployment, getK8sDeployment, getK8sDeployments, updateK8sDeployment } from '../../api/k8sDeployments';
import { getDeployItems } from '../../api/deployItems';
import { getServers } from '../../api/servers';
import { useAuth } from '../../contexts/AuthContext';

const clusterEnvOptions = [
  { label: '生产', value: 'prod' },
  { label: '测试', value: 'test' },
  { label: '开发', value: 'dev' },
];

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

const envLabel = (v: string) => clusterEnvOptions.find((o) => o.value === v)?.label ?? v;
const statusLabel = (v: string) => statusOptions.find((o) => o.value === v)?.label ?? v;

  const nodeRoleOptions: Array<{ label: string; value: 'master' | 'node' | 'etcd' }> = [
  { label: 'master', value: 'master' },
  { label: 'node', value: 'node' },
  { label: 'etcd', value: 'etcd' },
];

const renderNodeRoles = (roles: unknown) => {
  const arr = Array.isArray(roles) ? (roles as Array<string>) : [];
  if (!arr.length) return <span style={{ color: '#999' }}>-</span>;
  return (
    <Space wrap size={[4, 4]}>
      {arr.map((r) => (
        <Tag key={r}>{r}</Tag>
      ))}
    </Space>
  );
};

function formatOptionalString(v: unknown) {
  const s = v == null ? '' : String(v);
  const t = s.trim();
  return t === '' ? null : t;
}

export default function K8sDeploymentList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [deployItemsOptions, setDeployItemsOptions] = useState<Record<string, unknown>[]>([]);
  const [serversOptions, setServersOptions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [clusterEnvFilter, setClusterEnvFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  const [form] = Form.useForm();
  const { canEdit } = useAuth();

  useEffect(() => {
    // 选择部署软件时需要
    (async () => {
      try {
        const { data } = await getDeployItems({ enabled: 1 });
        const all = Array.isArray(data) ? data : [];
        // 只显示软件类型 = k8s基础服务 的部署软件
        setDeployItemsOptions(
          all.filter((di) => String((di as Record<string, unknown>).softwareType ?? '') === 'k8s基础服务'),
        );
      } catch {
        setDeployItemsOptions([]);
      }
    })();
  }, []);

  const loadServersOptions = async (pid: number) => {
    try {
      const { data } = await getServers(pid);
      setServersOptions(Array.isArray(data) ? data : []);
    } catch {
      setServersOptions([]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        getProjects(),
        getK8sDeployments({
          projectId: projectIdFilter,
          clusterEnv: clusterEnvFilter,
          status: statusFilter,
          keyword: keyword.trim() || undefined,
        }),
      ]);
      setProjects(Array.isArray(pRes.data) ? pRes.data : []);
      setList(Array.isArray(dRes.data) ? dRes.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdFilter, clusterEnvFilter, statusFilter]);

  useEffect(() => {
    // keyword 作为“查询输入”，不自动触发，点击查询时 load
  }, [keyword]);

  const openCreate = async () => {
    setEditingId(null);
    form.resetFields();
    if (projectIdFilter) form.setFieldsValue({ projectId: projectIdFilter, status: 'enabled' });
    if (projectIdFilter != null) await loadServersOptions(projectIdFilter);
    form.setFieldsValue({ deployItems: [], nodes: [] });
    setModalOpen(true);
  };

  const openEdit = async (record: Record<string, unknown>) => {
    const id = record.id as number;
    setEditingId(id);
    const { data } = await getK8sDeployment(id);

    const projectId = (data.projectId as number) ?? (data.project as Record<string, unknown> | undefined)?.id;
    if (projectId != null) await loadServersOptions(projectId);

    form.setFieldsValue({
      projectId,
      clusterName: data.clusterName,
      clusterEnv: data.clusterEnv,
      image: data.image ?? '',
      visualManage: data.visualManage ?? '',
      remark: data.remark ?? '',
      status: data.status,
      deployItems: (data.deployItems ?? []).map((ddi: Record<string, unknown>) => ({
        deployItemId:
          ddi.deployItemId ??
          (ddi.deployItem as Record<string, unknown> | undefined)?.id ??
          ddi.deployItemId,
        remark: ddi.remark ?? '',
      })),
      nodes: (data.nodes ?? []).map((n: Record<string, unknown>) => ({
        serverId: n.serverId,
        roles: n.roles ?? [],
        status: String(n.status) === 'enabled',
      })),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        projectId: v.projectId,
        clusterName: v.clusterName,
        clusterEnv: v.clusterEnv,
        image: formatOptionalString(v.image),
        visualManage: formatOptionalString(v.visualManage),
        remark: formatOptionalString(v.remark),
        status: v.status,
        deployItems: (v.deployItems ?? []).map((item: Record<string, unknown>) => ({
          deployItemId: item.deployItemId,
          remark: formatOptionalString(item.remark),
        })),
        nodes: (v.nodes ?? []).map((node: Record<string, unknown>) => ({
          serverId: node.serverId,
          roles: node.roles ?? [],
          status: node.status ? 'enabled' : 'disabled',
        })),
      };
      if (editingId != null) {
        await updateK8sDeployment(editingId, payload);
        message.success('更新成功');
      } else {
        await createK8sDeployment(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditingId(null);
      load();
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除该应用集群？',
      onOk: async () => {
        await deleteK8sDeployment(id);
        message.success('已删除');
        load();
      },
    });
  };

  const openView = async (record: Record<string, unknown>) => {
    const id = record.id as number;
    try {
      const { data } = await getK8sDeployment(id);
      setViewingRecord(data);
      setViewOpen(true);
    } catch {
      message.error('获取详情失败');
    }
  };

  const columns = [
    { title: '集群名称', dataIndex: 'clusterName', ellipsis: true },
    {
      title: '集群环境',
      dataIndex: 'clusterEnv',
      width: 120,
      render: (v: string) => <Tag>{envLabel(v)}</Tag>,
    },
    { title: '镜像地址', dataIndex: 'image', ellipsis: true },
    {
      title: '部署服务',
      dataIndex: 'deployItems',
      ellipsis: true,
      render: (_: unknown, r: Record<string, unknown>) => {
        const items = (r.deployItems as Record<string, unknown>[] | undefined) ?? [];
        const names = items
          .map((ddi) => ((ddi.deployItem as Record<string, unknown> | undefined)?.name as string | undefined) ?? undefined)
          .filter(Boolean) as string[];
        if (!names.length) return '-';
        return (
          <Space wrap size={[4, 4]}>
            {names.map((n) => (
              <Tag key={n}>{n}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'enabled' ? 'green' : 'default'}>{statusLabel(v)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" onClick={() => openView(record)}>查看</Button>
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
        <h2>应用集群</h2>
        {canEdit() && (
          <Button type="primary" onClick={openCreate}>
            新增部署
          </Button>
        )}
      </div>

      <div className="page-query">
        <span>所属项目：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 200 }}
          value={projectIdFilter}
          onChange={setProjectIdFilter}
          options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
        />
        <span>集群环境：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 160 }}
          value={clusterEnvFilter}
          onChange={setClusterEnvFilter}
          options={clusterEnvOptions}
        />
        <span>状态：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
        <span>关键字：</span>
        <Input
          allowClear
          placeholder="支持集群名称/部署服务/镜像地址模糊匹配"
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button type="primary" onClick={load}>
          查询
        </Button>
        <Button
          onClick={() => {
            setProjectIdFilter(undefined);
            setClusterEnvFilter(undefined);
            setStatusFilter(undefined);
            setKeyword('');
          }}
        >
          重置
        </Button>
      </div>

      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title={editingId != null ? '编辑应用集群' : '新增应用集群'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
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

          <Form.Item name="clusterName" label="集群名称" rules={[{ required: true, message: '请输入集群名称' }]}>
            <Input maxLength={128} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item name="clusterEnv" label="集群环境" rules={[{ required: true }]}>
                <Select allowClear placeholder="请选择" options={clusterEnvOptions} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select allowClear placeholder="请选择" options={statusOptions} />
              </Form.Item>
            </div>
          </div>

          <Form.Item name="image" label="镜像地址">
            <Input maxLength={512} />
          </Form.Item>
          <Form.Item name="visualManage" label="可视化管理">
            <Input.TextArea rows={4} maxLength={512} />
          </Form.Item>
          <Form.Item name="deployItems" label="部署服务" style={{ marginBottom: 0 }}>
            <Form.List name="deployItems">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 12 }} align="start">
                      <Form.Item {...rest} name={[name, 'deployItemId']} rules={[{ required: true, message: '请选择软件清单项' }]}>
                        <Select
                          placeholder="选择软件"
                          style={{ width: 240 }}
                          options={deployItemsOptions.map((d) => ({
                            label: `${String(d.name ?? '')} ${d.version ? String(d.version) : ''}`.trim(),
                            value: d.id as number,
                          }))}
                        />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'remark']}>
                        <Input.TextArea placeholder="备注（选填）" rows={3} style={{ width: 300 }} />
                      </Form.Item>
                      <Button type="link" onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + 添加部署服务
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>节点维护</div>
            <Form.List name="nodes">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 12 }} align="start">
                      <Form.Item {...rest} name={[name, 'serverId']} rules={[{ required: true, message: '请选择机器IP' }]}>
                        <Select
                          placeholder="选择机器IP"
                          style={{ width: 220 }}
                          options={serversOptions.map((s) => ({ label: String(s.ip ?? ''), value: s.id as number }))}
                        />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'roles']}
                        rules={[
                          {
                            validator: (_: unknown, value: string[] | undefined) => {
                              const arr = Array.isArray(value) ? value : [];
                              return arr.length ? Promise.resolve() : Promise.reject(new Error('请选择至少一个角色'));
                            },
                          },
                        ]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="选择角色（master/node/etcd）"
                          style={{ width: 220 }}
                          options={nodeRoleOptions}
                        />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'status']}
                        valuePropName="checked"
                        rules={[{ required: true, message: '请选择状态' }]}
                      >
                        <Switch checkedChildren="开" unCheckedChildren="关" />
                      </Form.Item>
                      <Button type="link" onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ status: true })} block>
                    + 添加节点
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="查看应用集群"
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        {viewingRecord && (
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="所属项目">
                      {String((viewingRecord.project as Record<string, unknown> | undefined)?.name ?? '-')}
                    </Descriptions.Item>
                    <Descriptions.Item label="集群名称">{String(viewingRecord.clusterName ?? '-')}</Descriptions.Item>
                    <Descriptions.Item label="集群环境">
                      <Tag>{envLabel(String(viewingRecord.clusterEnv ?? '-'))}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="镜像地址">{String(viewingRecord.image ?? '-')}</Descriptions.Item>
                    <Descriptions.Item label="可视化管理" span={1}>
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {String(viewingRecord.visualManage ?? '-')}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="备注" span={1}>
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {String(viewingRecord.remark ?? '-')}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={String(viewingRecord.status) === 'enabled' ? 'green' : 'default'}>
                        {statusLabel(String(viewingRecord.status ?? ''))}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'deployItems',
                label: '部署软件清单',
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    locale={{ emptyText: '暂无部署软件' }}
                    dataSource={(viewingRecord.deployItems as Record<string, unknown>[] | undefined) ?? []}
                    columns={[
                      {
                        title: '软件名称',
                        render: (_: unknown, r: Record<string, unknown>) =>
                          String((r.deployItem as Record<string, unknown> | undefined)?.name ?? '-'),
                      },
                      {
                        title: '版本',
                        width: 120,
                        render: (_: unknown, r: Record<string, unknown>) =>
                          String((r.deployItem as Record<string, unknown> | undefined)?.version ?? '-'),
                      },
                      {
                        title: '备注',
                        render: (_: unknown, r: Record<string, unknown>) =>
                          r.remark != null && String(r.remark) !== '' ? (
                            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(r.remark)}</span>
                          ) : (
                            '-'
                          ),
                      },
                    ]}
                  />
                ),
              },
              {
                key: 'nodes',
                label: '节点维护',
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    locale={{ emptyText: '暂无节点' }}
                    dataSource={(viewingRecord.nodes as Record<string, unknown>[] | undefined) ?? []}
                    columns={[
                      {
                        title: '机器IP',
                        render: (_: unknown, r: Record<string, unknown>) =>
                          String((r.server as Record<string, unknown> | undefined)?.ip ?? '-'),
                      },
                      {
                        title: '角色',
                        render: (_: unknown, r: Record<string, unknown>) => renderNodeRoles(r.roles),
                      },
                      {
                        title: '状态',
                        width: 110,
                        render: (_: unknown, r: Record<string, unknown>) => (
                          <Tag color={String(r.status) === 'enabled' ? 'green' : 'default'}>
                            {statusLabel(String(r.status ?? ''))}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}

