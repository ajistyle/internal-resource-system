import { useEffect, useMemo, useState } from 'react';
import { App, Button, Col, Descriptions, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
import { getProjects } from '../../api/projects';
import { getServers } from '../../api/servers';
import { createNetworkPolicy, deleteNetworkPolicy, getNetworkPolicies, updateNetworkPolicy } from '../../api/networkPolicies';
import { useAuth } from '../../contexts/AuthContext';

const policyTypeBaseOptions = [
  { label: '出访', value: 'egress' },
  { label: '入访', value: 'ingress' },
];

const policyTypeLabel = (v: string) =>
  policyTypeBaseOptions.find((x) => x.value === v)?.label ?? (v === 'crossnet' ? '跨网(旧)' : v);
const protocolOptions = [
  { label: 'TCP', value: 'TCP' },
  { label: 'UDP', value: 'UDP' },
];
const statusLabel = (v: unknown) => (String(v) === 'enabled' ? '开' : '关');

function inferPeerIpFromLegacy(r: Record<string, unknown>): string {
  const peer = r.peerIp as string | null | undefined;
  if (peer != null && String(peer).trim() !== '') return String(peer).trim();
  const t = r.policyType as string;
  if (t === 'egress') return String(r.targetZone ?? '').trim();
  if (t === 'ingress') return String(r.sourceZone ?? '').trim();
  return String(r.targetZone ?? r.sourceZone ?? '').trim();
}

export default function NetworkPolicyList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [modalServers, setModalServers] = useState<Record<string, unknown>[]>([]);
  const [modalServersLoading, setModalServersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [policyTypeFilter, setPolicyTypeFilter] = useState<string | undefined>();
  const [localIpDraft, setLocalIpDraft] = useState('');
  const [peerIpDraft, setPeerIpDraft] = useState('');
  const [localIpFilter, setLocalIpFilter] = useState('');
  const [peerIpFilter, setPeerIpFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLegacyCrossnet, setEditingLegacyCrossnet] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const formProjectId = Form.useWatch('projectId', form);
  const formPolicyType = Form.useWatch('policyType', form);

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        getNetworkPolicies({
          projectId: projectIdFilter,
          policyType: policyTypeFilter,
          localIp: localIpFilter || undefined,
          peerIp: peerIpFilter || undefined,
        }),
        getProjects(),
      ]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setProjects(Array.isArray(r2.data) ? r2.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const h = setTimeout(() => {
      setLocalIpFilter(localIpDraft.trim());
      setPeerIpFilter(peerIpDraft.trim());
    }, 400);
    return () => clearTimeout(h);
  }, [localIpDraft, peerIpDraft]);

  useEffect(() => {
    load();
  }, [projectIdFilter, policyTypeFilter, localIpFilter, peerIpFilter]);

  /** 弹窗打开时同步拉取最新「项目信息」表数据，保证下拉与项目列表一致 */
  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    getProjects().then((res) => {
      if (!cancelled) setProjects(Array.isArray(res.data) ? res.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [modalOpen]);

  /** 选中项目后加载该项目下「计算资源」中的服务器 IP 清单 */
  useEffect(() => {
    if (!modalOpen) {
      setModalServers([]);
      setModalServersLoading(false);
      return;
    }
    if (formProjectId == null) {
      setModalServers([]);
      setModalServersLoading(false);
      return;
    }
    let cancelled = false;
    setModalServersLoading(true);
    getServers(formProjectId)
      .then((res) => {
        if (!cancelled) setModalServers(Array.isArray(res.data) ? res.data : []);
      })
      .finally(() => {
        if (!cancelled) setModalServersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modalOpen, formProjectId]);

  const modalServerOptions = useMemo(
    () =>
      modalServers.map((s) => {
        const ip = String(s.ip ?? '').trim();
        const name = String(s.name ?? '-').trim();
        const label = ip ? `${ip}（${name}）` : `（未填 IP）${name}`;
        return { label, value: s.id as number };
      }),
    [modalServers],
  );

  const policyTypeOptions = useMemo(() => {
    if (editingLegacyCrossnet) return [...policyTypeBaseOptions, { label: '跨网(旧)', value: 'crossnet' }];
    return policyTypeBaseOptions;
  }, [editingLegacyCrossnet]);

  const openCreate = () => {
    setEditingId(null);
    setEditingLegacyCrossnet(false);
    form.resetFields();
    if (projectIdFilter) form.setFieldsValue({ projectId: projectIdFilter });
    form.setFieldsValue({ policyType: 'egress', protocol: 'TCP', statusEnabled: true });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    const isCrossnet = record.policyType === 'crossnet';
    setEditingLegacyCrossnet(isCrossnet);
    setEditingId(record.id as number);
    form.setFieldsValue({
      projectId: record.projectId,
      serverId: record.serverId ?? undefined,
      policyType: record.policyType,
      peerIp: inferPeerIpFromLegacy(record),
      mappingIp: record.mappingIp ?? undefined,
      mappingPort: record.mappingPort ?? undefined,
      purpose: String(record.purpose ?? ''),
      remark: String(record.remark ?? ''),
      protocol: String(record.protocol ?? 'TCP').toUpperCase() === 'UDP' ? 'UDP' : 'TCP',
      sourcePort: record.sourcePort ?? undefined,
      targetPort: record.targetPort ?? undefined,
      statusEnabled: String(record.status ?? 'enabled') === 'enabled',
    });
    setModalOpen(true);
  };

  const openCopy = (record: Record<string, unknown>) => {
    const isCrossnet = record.policyType === 'crossnet';
    setEditingLegacyCrossnet(isCrossnet);
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      projectId: record.projectId,
      serverId: record.serverId ?? undefined,
      policyType: record.policyType,
      peerIp: inferPeerIpFromLegacy(record),
      mappingIp: record.mappingIp ?? undefined,
      mappingPort: record.mappingPort ?? undefined,
      purpose: String(record.purpose ?? ''),
      remark: String(record.remark ?? ''),
      protocol: String(record.protocol ?? 'TCP').toUpperCase() === 'UDP' ? 'UDP' : 'TCP',
      sourcePort: record.sourcePort ?? undefined,
      targetPort: record.targetPort ?? undefined,
      statusEnabled: String(record.status ?? 'enabled') === 'enabled',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const v = await form.validateFields();
    if (v.policyType === 'crossnet') {
      message.error('不支持保存为「跨网(旧)」，请改为出访或入访');
      return;
    }
    const remarkTrim = v.remark != null ? String(v.remark).trim() : '';
    const payload: Record<string, unknown> = {
      projectId: v.projectId,
      serverId: v.serverId,
      policyType: v.policyType,
      peerIp: String(v.peerIp).trim(),
      purpose: String(v.purpose).trim(),
      protocol: v.protocol ?? 'TCP',
      sourcePort: v.policyType === 'egress' ? v.sourcePort : undefined,
      targetPort: v.policyType === 'ingress' ? v.targetPort : undefined,
      mappingIp: v.policyType === 'ingress' ? String(v.mappingIp ?? '').trim() : undefined,
      mappingPort: v.policyType === 'ingress' ? v.mappingPort : undefined,
      status: v.statusEnabled ? 'enabled' : 'disabled',
    };
    if (remarkTrim !== '') {
      payload.remark = remarkTrim;
    }
    if (editingId != null) {
      payload.remark = remarkTrim;
    }
    if (v.policyType === 'egress') {
      payload.targetPort = v.targetPort;
    }
    if (editingId != null) {
      await updateNetworkPolicy(editingId, payload);
      message.success('更新成功');
    } else {
      if (v.policyType === 'egress' && Array.isArray(v.serverId)) {
        await Promise.all(
          v.serverId.map((sid: number) =>
            createNetworkPolicy({
              ...payload,
              serverId: sid,
            }),
          ),
        );
        message.success(`创建成功（共 ${v.serverId.length} 条）`);
      } else {
        await createNetworkPolicy(payload);
        message.success('创建成功');
      }
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteNetworkPolicy(id);
        message.success('已删除');
        load();
      },
    });
  };

  const openView = (record: Record<string, unknown>) => {
    setViewing(record);
    setViewOpen(true);
  };

  const displayPeer = (r: Record<string, unknown>) => {
    const p = r.peerIp as string | null | undefined;
    if (p != null && String(p).trim() !== '') return String(p).trim();
    if (r.policyType === 'egress' && r.targetZone) return String(r.targetZone);
    if (r.policyType === 'ingress' && r.sourceZone) return String(r.sourceZone);
    if (r.sourceZone || r.targetZone) return [r.sourceZone, r.targetZone].filter(Boolean).join(' / ');
    return '-';
  };

  const displayPurpose = (r: Record<string, unknown>) => {
    const p = r.purpose as string | null | undefined;
    if (p != null && String(p).trim() !== '') return String(p).trim();
    return (r.remark as string) || '-';
  };

  const columns = [
    {
      title: '本端机器',
      render: (_: unknown, r: Record<string, unknown>) => {
        const s = r.server as { ip?: string; name?: string } | null | undefined;
        if (!s?.ip && !s?.name) return '-';
        return `${s?.ip ?? ''}${s?.name ? ` (${s.name})` : ''}`;
      },
    },
    { title: '对端 IP', render: (_: unknown, r: Record<string, unknown>) => displayPeer(r) },
    { title: '通讯协议', render: (_: unknown, r: Record<string, unknown>) => (String(r.protocol ?? 'TCP').toUpperCase() === 'UDP' ? 'UDP' : 'TCP') },
    {
      title: '目标端口',
      render: (_: unknown, r: Record<string, unknown>) =>
        r.policyType === 'ingress' || r.policyType === 'egress' ? (r.targetPort ?? '-') : '-',
    },
    { title: '映射IP', render: (_: unknown, r: Record<string, unknown>) => (r.policyType === 'ingress' ? (r.mappingIp ?? '-') : '-') },
    { title: '映射端口', render: (_: unknown, r: Record<string, unknown>) => (r.policyType === 'ingress' ? (r.mappingPort ?? '-') : '-') },
    { title: '作用', render: (_: unknown, r: Record<string, unknown>) => displayPurpose(r) },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'default'}>{statusLabel(v)}</Tag> },
    {
      title: '操作',
      width: 280,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" onClick={() => openView(record)}>
            查看
          </Button>
          {canEdit() && (
            <>
              <Button type="link" size="small" onClick={() => openEdit(record)}>
                编辑
              </Button>
              <Button type="link" size="small" onClick={() => openCopy(record)}>
                复制
              </Button>
              <Button type="link" size="small" danger onClick={() => handleDelete(record.id as number)}>
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>网络策略</h2>
        {canEdit() && (
          <Button type="primary" onClick={openCreate}>
            新增策略
          </Button>
        )}
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
        <span>策略类型：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 160 }}
          value={policyTypeFilter}
          onChange={setPolicyTypeFilter}
          options={[...policyTypeBaseOptions, { label: '跨网(旧)', value: 'crossnet' }]}
        />
        <span>本端 IP：</span>
        <Input
          allowClear
          placeholder="模糊匹配本端机器 IP"
          style={{ width: 180 }}
          value={localIpDraft}
          onChange={(e) => setLocalIpDraft(e.target.value)}
        />
        <span>对端 IP：</span>
        <Input
          allowClear
          placeholder="模糊匹配对端 IP"
          style={{ width: 180 }}
          value={peerIpDraft}
          onChange={(e) => setPeerIpDraft(e.target.value)}
        />
        <Button
          onClick={() => {
            setProjectIdFilter(undefined);
            setPolicyTypeFilter(undefined);
            setLocalIpDraft('');
            setPeerIpDraft('');
            setLocalIpFilter('');
            setPeerIpFilter('');
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
        title={editingId != null ? '编辑策略' : '新增策略'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        maskClosable={false}
        keyboard={false}
        destroyOnHidden
        width={760}
      >
        <Form form={form} layout="vertical">
          {formPolicyType === 'egress' ? (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="projectId"
                  label="所属项目"
                  extra="选项来自「项目信息」维护的数据。"
                  rules={[{ required: true, message: '请选择项目' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="请选择项目（项目信息表）"
                    options={projects.map((p) => ({
                      label: String(p.name ?? ''),
                      value: p.id as number,
                    }))}
                    onChange={() => form.setFieldsValue({ serverId: undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="policyType" label="策略类型" rules={[{ required: true }]}>
                  <Select
                    options={policyTypeOptions}
                    onChange={(v) => {
                      if (v !== 'crossnet') setEditingLegacyCrossnet(false);
                      if (v !== 'ingress') form.setFieldsValue({ mappingIp: undefined, mappingPort: undefined });
                      if (v !== 'egress') form.setFieldsValue({ sourcePort: undefined });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="projectId"
                  label="所属项目"
                  extra="选项来自「项目信息」维护的数据；切换项目会清空下方已选机器。"
                  rules={[{ required: true, message: '请选择项目' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="请选择项目（项目信息表）"
                    options={projects.map((p) => ({
                      label: String(p.name ?? ''),
                      value: p.id as number,
                    }))}
                    onChange={() => form.setFieldsValue({ serverId: undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="policyType" label="策略类型" rules={[{ required: true }]}>
                  <Select
                    options={policyTypeOptions}
                    onChange={(v) => {
                      if (v !== 'crossnet') setEditingLegacyCrossnet(false);
                      if (v !== 'ingress') form.setFieldsValue({ mappingIp: undefined, mappingPort: undefined });
                      if (v !== 'egress') form.setFieldsValue({ sourcePort: undefined });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          {formPolicyType === 'egress' ? (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="serverId"
                    label="源IP"
                    rules={[{ required: true, message: '请选择源IP' }]}
                    extra={
                      formProjectId != null
                        ? '来源于当前项目「计算资源」服务器。'
                        : '请先选择所属项目。'
                    }
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      mode={editingId == null ? 'multiple' : undefined}
                      disabled={formProjectId == null}
                      loading={modalServersLoading}
                      placeholder={formProjectId == null ? '请先选择所属项目' : '请选择源IP'}
                      notFoundContent={modalServersLoading ? '加载中…' : '该项目下暂无服务器'}
                      options={modalServerOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="sourcePort" label="源端口">
                    <InputNumber style={{ width: '100%' }} min={1} max={65535} placeholder="例如 1024" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="peerIp" label="目标IP" rules={[{ required: true, message: '请填写目标IP' }]}>
                    <Input placeholder="例如 10.0.0.5 或 10.0.0.0/24" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="targetPort" label="目标端口" rules={[{ required: true, message: '请输入目标端口' }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={65535} placeholder="例如 443" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="protocol" label="通讯协议" initialValue="TCP" rules={[{ required: true, message: '请选择通讯协议' }]}>
                    <Select options={protocolOptions} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="purpose" label="作用" rules={[{ required: true, message: '请填写作用说明' }]}>
                    <Input placeholder="例如：访问外部 API" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="remark" label="备注" extra="选填">
                <Input.TextArea rows={3} placeholder="可填写补充说明" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="statusEnabled" label="状态" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="peerIp"
                    label="源IP"
                    rules={[{ required: true, message: '请填写源IP' }]}
                  >
                    <Input placeholder="例如 10.0.0.5 或 10.0.0.0/24" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="protocol" label="通讯协议" initialValue="TCP" rules={[{ required: true, message: '请选择通讯协议' }]}>
                    <Select options={protocolOptions} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="serverId"
                    label="目标IP"
                    extra={
                      formProjectId != null
                        ? '列表为当前项目下「计算资源」中的服务器 IP，可多字搜索 IP 或主机名。'
                        : '请先选择所属项目后，将加载该项目下的服务器 IP 列表。'
                    }
                    rules={[{ required: true, message: '请选择目标IP' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      disabled={formProjectId == null}
                      loading={modalServersLoading}
                      placeholder={
                        formProjectId == null ? '请先选择所属项目' : modalServersLoading ? '加载中…' : '请选择服务器 IP'
                      }
                      notFoundContent={modalServersLoading ? '加载中…' : '该项目下暂无计算资源，请先在「计算资源」中维护服务器'}
                      options={modalServerOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="targetPort" label="目标端口" rules={[{ required: true, message: '请输入目标端口' }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={65535} placeholder="例如 22 / 443 / 3306" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="mappingIp" label="映射IP" rules={[{ required: true, message: '请输入映射IP' }]}>
                    <Input placeholder="例如 172.16.10.20" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="mappingPort" label="映射端口" rules={[{ required: true, message: '请输入映射端口' }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={65535} placeholder="例如 8080 / 3306" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="purpose" label="作用" rules={[{ required: true, message: '请填写作用说明' }]}>
                <Input.TextArea rows={3} placeholder="例如：同步数据、监控采集、跳板 SSH 等" />
              </Form.Item>
              <Form.Item name="remark" label="备注" extra="选填">
                <Input.TextArea rows={3} placeholder="可填写补充说明" />
              </Form.Item>
              <Form.Item name="statusEnabled" label="状态" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="开" unCheckedChildren="关" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
      <Modal title="网络策略详情" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={760}>
        {viewing ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="策略类型">{policyTypeLabel(String(viewing.policyType ?? '-'))}</Descriptions.Item>
            <Descriptions.Item label="所属项目">{String((viewing.project as Record<string, unknown> | undefined)?.name ?? '-')}</Descriptions.Item>
            {String(viewing.policyType) === 'egress' ? (
              <>
                <Descriptions.Item label="源IP">{String((viewing.server as Record<string, unknown> | undefined)?.ip ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="源端口">{String(viewing.sourcePort ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="目标IP">{displayPeer(viewing)}</Descriptions.Item>
                <Descriptions.Item label="目标端口">{String(viewing.targetPort ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="通讯协议">{String(viewing.protocol ?? 'TCP').toUpperCase()}</Descriptions.Item>
                <Descriptions.Item label="作用">{displayPurpose(viewing)}</Descriptions.Item>
                <Descriptions.Item label="状态" span={2}>
                  <Tag color={String(viewing.status) === 'enabled' ? 'green' : 'default'}>
                    {statusLabel(viewing.status)}
                  </Tag>
                </Descriptions.Item>
              </>
            ) : (
              <>
                <Descriptions.Item label="源IP">{displayPeer(viewing)}</Descriptions.Item>
                <Descriptions.Item label="目标IP">{String((viewing.server as Record<string, unknown> | undefined)?.ip ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="目标端口">{String(viewing.targetPort ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="通讯协议">{String(viewing.protocol ?? 'TCP').toUpperCase()}</Descriptions.Item>
                <Descriptions.Item label="映射IP">{String(viewing.mappingIp ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="映射端口">{String(viewing.mappingPort ?? '-')}</Descriptions.Item>
                <Descriptions.Item label="作用">{displayPurpose(viewing)}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={String(viewing.status) === 'enabled' ? 'green' : 'default'}>
                    {statusLabel(viewing.status)}
                  </Tag>
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="备注" span={2}>
              {viewing.remark != null && String(viewing.remark) !== '' ? (
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(viewing.remark)}</span>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
}
