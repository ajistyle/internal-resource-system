import { useEffect, useState } from 'react';
import { Table, Button, Space, Select, message, Modal, Form, Input, InputNumber, Descriptions, App, Row, Col, Tabs, Tag } from 'antd';
import MarkdownIt from 'markdown-it';
import { getServers, createServer, updateServer, deleteServer } from '../../api/servers';
import { getAssetDetail } from '../../api/assets';
import { getProjects } from '../../api/projects';
import { getDeployItems } from '../../api/deployItems';
import { getRemoteInfos, getRemoteInfo } from '../../api/remoteInfos';
import { getDictionaries } from '../../api/dictionaries';
import { useAuth } from '../../contexts/AuthContext';

const mdParser = new MarkdownIt({ html: true, breaks: true });

const policyStatusLabel = (v: unknown) => (String(v) === 'enabled' ? '开' : '关');

function displayPolicyPeer(r: Record<string, unknown>) {
  const p = r.peerIp as string | null | undefined;
  if (p != null && String(p).trim() !== '') return String(p).trim();
  if (r.policyType === 'egress' && r.targetZone) return String(r.targetZone);
  if (r.policyType === 'ingress' && r.sourceZone) return String(r.sourceZone);
  if (r.sourceZone || r.targetZone) return [r.sourceZone, r.targetZone].filter(Boolean).join(' / ');
  return '-';
}

function displayPolicyPurpose(r: Record<string, unknown>) {
  const p = r.purpose as string | null | undefined;
  if (p != null && String(p).trim() !== '') return String(p).trim();
  return (r.remark as string) || '-';
}

export default function ServerList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [deployItems, setDeployItems] = useState<Record<string, unknown>[]>([]);
  const [remoteInfos, setRemoteInfos] = useState<Record<string, unknown>[]>([]);
  const [networkRegionOptions, setNetworkRegionOptions] = useState<{ label: string; value: string }[]>([]);
  const [osTypeOptions, setOsTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [osOptionsFallback, setOsOptionsFallback] = useState<{ label: string; value: string }[]>([]);
  const [osOptionsByType, setOsOptionsByType] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [viewDetail, setViewDetail] = useState<Record<string, unknown> | null>(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [copyingFromId, setCopyingFromId] = useState<number | null>(null);
  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [ipFilter, setIpFilter] = useState('');
  const [remoteContentModalOpen, setRemoteContentModalOpen] = useState(false);
  const [remoteContentRecord, setRemoteContentRecord] = useState<Record<string, unknown> | null>(null);
  const [remoteContentLoading, setRemoteContentLoading] = useState(false);
  const [form] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();
  const formProjectId = Form.useWatch('projectId', form);
  const formOsType = Form.useWatch('osType', form);

  useEffect(() => {
    if (formOsType) {
      getDictionaries({ parentCode: formOsType, status: 1 })
        .then((res) => {
          const arr = Array.isArray(res.data) ? res.data : [];
          setOsOptionsByType(arr.map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.code ?? '') })));
        })
        .catch(() => setOsOptionsByType([]));
    } else {
      setOsOptionsByType([]);
    }
  }, [formOsType]);

  const osOptions = formOsType ? osOptionsByType : osOptionsFallback;
  const osOptionsForDisplay = [...osOptionsFallback];
  osOptionsByType.forEach((o) => { if (!osOptionsForDisplay.some((x) => x.value === o.value)) osOptionsForDisplay.push(o); });

  const load = async (pid?: number) => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4, r5, r6, r7, r8] = await Promise.all([
        getServers(pid),
        getProjects(),
        getDeployItems(),
        getRemoteInfos(),
        getDictionaries({ parentCode: '000300', status: 1 }),
        getDictionaries({ parentCode: '001001', status: 1 }),
        getDictionaries({ parentCode: '000100', status: 1 }),
        getDictionaries({ parentCode: '000110', status: 1 }),
      ]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setProjects(Array.isArray(r2.data) ? r2.data : []);
      setDeployItems(Array.isArray(r3.data) ? r3.data : []);
      setRemoteInfos(Array.isArray(r4.data) ? r4.data : []);
      const regionList = Array.isArray(r5.data) ? r5.data : [];
      setNetworkRegionOptions(regionList.map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.code ?? '') })));
      const osTypeList = Array.isArray(r6.data) ? r6.data : [];
      setOsTypeOptions(osTypeList.map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.code ?? '') })));
      const osList100 = Array.isArray(r7.data) ? r7.data : [];
      const osList110 = Array.isArray(r8.data) ? r8.data : [];
      setOsOptionsFallback([...osList100, ...osList110].map((d: Record<string, unknown>) => ({ label: String(d.name ?? ''), value: String(d.code ?? '') })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(projectIdFilter);
  }, [projectIdFilter]);

  const openCreate = () => {
    setEditingId(null);
    setCopyingFromId(null);
    form.resetFields();
    if (projectIdFilter) form.setFieldsValue({ projectId: projectIdFilter });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    setCopyingFromId(null);
    const proj = record.project as Record<string, unknown> | undefined;
    const sdis = (record.serverDeployItems as Record<string, unknown>[] | undefined) ?? [];
    const toNum = (v: unknown) => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined);
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      name: record.name,
      ip: record.ip,
      eip: (record as { eip?: unknown }).eip,
      hostname: record.hostname,
      osType: record.osType,
      os: record.os,
      cpuArch: record.cpuArch,
      cpuModel: record.cpuModel,
      cpuCores: toNum(record.cpuCores),
      memory: toNum(record.memory),
      systemDisk: toNum(record.systemDisk),
      dataDisk: toNum(record.dataDisk),
      networkRegion: record.networkRegion,
      sshPort: toNum((record as { sshPort?: unknown }).sshPort),
      sshUser: (record as { sshUser?: string | null }).sshUser ?? undefined,
      remark: record.remark,
      defaultRemoteInfoId: record.defaultRemoteInfoId ?? (record.defaultRemoteInfo as Record<string, unknown>)?.id,
      deployItems: sdis.map((sdi: Record<string, unknown>) => ({
        deployItemId: (sdi.deployItem as Record<string, unknown>)?.id ?? sdi.deployItemId,
        config: sdi.config,
        remark: sdi.remark,
      })),
    });
    setModalOpen(true);
  };

  const openCopy = (record: Record<string, unknown>) => {
    setEditingId(null);
    setCopyingFromId(record.id as number);
    const proj = record.project as Record<string, unknown> | undefined;
    const sdis = (record.serverDeployItems as Record<string, unknown>[] | undefined) ?? [];
    const toNum = (v: unknown) => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined);
    const baseName = String(record.name ?? '');
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      name: baseName ? `${baseName}(副本)` : undefined,
      ip: record.ip,
      eip: (record as { eip?: unknown }).eip,
      hostname: record.hostname,
      osType: record.osType,
      os: record.os,
      cpuArch: record.cpuArch,
      cpuModel: record.cpuModel,
      cpuCores: toNum(record.cpuCores),
      memory: toNum(record.memory),
      systemDisk: toNum(record.systemDisk),
      dataDisk: toNum(record.dataDisk),
      networkRegion: record.networkRegion,
      sshPort: toNum((record as { sshPort?: unknown }).sshPort),
      sshUser: (record as { sshUser?: string | null }).sshUser ?? undefined,
      remark: record.remark,
      defaultRemoteInfoId: record.defaultRemoteInfoId ?? (record.defaultRemoteInfo as Record<string, unknown>)?.id,
      deployItems: sdis.map((sdi: Record<string, unknown>) => ({
        deployItemId: (sdi.deployItem as Record<string, unknown>)?.id ?? sdi.deployItemId,
        config: sdi.config,
        remark: sdi.remark,
      })),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload: Record<string, unknown> = {
        projectId: v.projectId,
        name: v.name,
        ip: v.ip,
        eip: v.eip,
        hostname: v.hostname,
        osType: v.osType,
        os: v.os,
        cpuArch: v.cpuArch,
        cpuModel: v.cpuModel,
        cpuCores: v.cpuCores,
        memory: v.memory,
        systemDisk: v.systemDisk,
        dataDisk: v.dataDisk,
        networkRegion: v.networkRegion,
        sshPort: v.sshPort ?? null,
        sshUser: v.sshUser,
        remark: v.remark,
        defaultRemoteInfoId: v.defaultRemoteInfoId,
        deployItems: (v.deployItems ?? []).map((item: { deployItemId: number; config?: Record<string, unknown>; remark?: string }) => ({
          deployItemId: item.deployItemId,
          config: item.config ?? undefined,
          remark: item.remark,
        })),
      };
      const pwd = v.sshPassword != null ? String(v.sshPassword).trim() : '';
      if (pwd !== '') {
        payload.sshPassword = pwd;
      } else if (editingId == null) {
        payload.sshPassword = null;
      }
      if (editingId != null) {
        await updateServer(editingId, payload);
        message.success('更新成功');
      } else {
        await createServer(payload);
        message.success('创建成功');
      }
      setCopyingFromId(null);
      setModalOpen(false);
      load(projectIdFilter);
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const openView = async (record: Record<string, unknown>) => {
    setViewingRecord(record);
    setViewDetail(null);
    setViewOpen(true);
    setViewDetailLoading(true);
    try {
      const { data } = await getAssetDetail('server', record.id as number);
      setViewDetail(data as Record<string, unknown>);
    } catch {
      message.error('加载详情失败');
    } finally {
      setViewDetailLoading(false);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewingRecord(null);
    setViewDetail(null);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteServer(id);
        message.success('已删除');
        load(projectIdFilter);
      },
    });
  };

  const columns = [
    { title: 'IP', dataIndex: 'ip' },
    {
      title: '操作系统类型',
      dataIndex: 'osType',
      width: 110,
      render: (code: string) => osTypeOptions.find((o) => o.value === code)?.label ?? code ?? '-',
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      render: (code: string) => osOptionsForDisplay.find((o) => o.value === code)?.label ?? code ?? '-',
    },
    { title: 'CPU核数(C)', dataIndex: 'cpuCores', width: 90 },
    { title: '内存(GB)', dataIndex: 'memory', width: 90 },
    { title: '系统盘(GB)', dataIndex: 'systemDisk', width: 90 },
    { title: '数据盘(GB)', dataIndex: 'dataDisk', width: 90 },
    {
      title: '网络区域',
      dataIndex: 'networkRegion',
      width: 90,
      render: (code: string) => networkRegionOptions.find((o) => o.value === code)?.label ?? code ?? '-',
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
              <Button type="link" size="small" onClick={() => openCopy(record)}>复制</Button>
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
        <h2>计算资源</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增计算资源</Button>}
      </div>
      <div className="page-query">
        <span>所属项目：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 140 }}
          value={projectIdFilter}
          onChange={setProjectIdFilter}
          options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
        />
        <span>IP地址：</span>
        <Input
          placeholder="请输入"
          allowClear
          style={{ width: 160 }}
          value={ipFilter}
          onChange={(e) => setIpFilter(e.target.value)}
        />
        <Button type="primary" onClick={() => load(projectIdFilter)}>查询</Button>
        <Button onClick={() => { setProjectIdFilter(undefined); setIpFilter(''); }}>重置</Button>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={ipFilter.trim() ? list.filter((r) => String(r.ip ?? '').includes(ipFilter.trim())) : list}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <Modal
        title={editingId != null ? '编辑计算资源' : (copyingFromId != null ? '复制计算资源' : '新增计算资源')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
                <Select
                  options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
                  placeholder="请选择"
                  disabled={!!editingId}
                  onChange={() => form.setFieldValue('defaultRemoteInfoId', undefined)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="name" label="计算资源名称" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="osType" label="操作系统类型">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={osTypeOptions}
                  onChange={() => form.setFieldValue('os', undefined)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="os" label="操作系统">
                <Select allowClear placeholder={formOsType ? '请先选操作系统类型' : '请选择'} options={osOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="ip" label="IP地址" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="eip" label="EIP"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hostname" label="主机名"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cpuArch" label="CPU架构"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cpuModel" label="CPU型号"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cpuCores" label="CPU核数（单位：C）">
                <InputNumber min={0} step={1} precision={0} style={{ width: '100%' }} placeholder="请输入整数" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="memory" label="内存（单位：GB）">
                <InputNumber min={0} step={1} precision={0} style={{ width: '100%' }} placeholder="请输入整数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="systemDisk" label="系统盘（单位：GB）">
                <InputNumber min={0} step={1} precision={0} style={{ width: '100%' }} placeholder="请输入整数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dataDisk" label="数据盘（单位：GB）">
                <InputNumber min={0} step={1} precision={0} style={{ width: '100%' }} placeholder="请输入整数" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="networkRegion" label="网络区域">
                <Select allowClear placeholder="请选择" options={networkRegionOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="defaultRemoteInfoId" label="远程方式">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder={formProjectId ? '请选择远程管理信息' : '请先选择所属项目'}
                  options={remoteInfos
                    .filter((r) => String(r.projectId ?? '') === String(formProjectId ?? ''))
                    .map((r) => {
                      const projectName = (projects.find((p) => p.id === r.projectId) as Record<string, unknown>)?.name as string ?? '';
                      const remark = (r as { remark?: string }).remark;
                      const label = remark ? `${projectName || `#${r.id}`} - ${String(remark).slice(0, 20)}` : (projectName || `#${r.id}`);
                      return { label, value: r.id as number };
                    })}
                  disabled={!formProjectId}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="sshPort"
                label="SSH端口"
                extra="选填，常见为 22"
                rules={[
                  {
                    validator: (_: unknown, val: number | null | undefined) => {
                      if (val == null || val === undefined) return Promise.resolve();
                      if (!Number.isInteger(val) || val < 1 || val > 65535) {
                        return Promise.reject(new Error('端口范围为 1–65535'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber min={1} max={65535} placeholder="22" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sshUser" label="SSH用户" extra="选填">
                <Input allowClear placeholder="例如 root" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sshPassword" label="SSH密码" extra={editingId != null ? '选填，留空则不修改已保存的密码' : '选填'}>
                <Input.Password allowClear placeholder="请输入" autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="deployItems" label="部署软件" style={{ marginBottom: 0 }}>
            <Form.List name="deployItems">
              {(fields: { key: number; name: number }[], { add, remove }: { add: () => void; remove: (i: number) => void }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 12 }} align="start">
                      <Form.Item {...rest} name={[name, 'deployItemId']} rules={[{ required: true }]}>
                        <Select placeholder="选择软件" style={{ width: 200 }} options={deployItems.map((d) => ({ label: `${d.name} ${d.version || ''}`, value: d.id }))} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'remark']}>
                        <Input.TextArea placeholder="备注" rows={3} style={{ width: 280 }} />
                      </Form.Item>
                      <Button type="link" onClick={() => remove(name)}>删除</Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>+ 添加部署软件</Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="查看计算资源"
        open={viewOpen}
        onCancel={closeView}
        footer={null}
        width={920}
        destroyOnHidden
      >
        {viewingRecord && (() => {
          const asset = (viewDetail?.asset as Record<string, unknown> | undefined) ?? viewingRecord;
          const policies = (Array.isArray(viewDetail?.policies) ? viewDetail.policies : []) as Record<string, unknown>[];
          const egressPolicies = policies.filter((p) => p.policyType === 'egress' || p.policyType === 'crossnet');
          const ingressPolicies = policies.filter((p) => p.policyType === 'ingress');
          const deployRows = ((asset.serverDeployItems as Record<string, unknown>[]) ?? []).slice();

          const deployColumns = [
            {
              title: '软件名称',
              render: (_: unknown, r: Record<string, unknown>) => String((r.deployItem as Record<string, unknown> | undefined)?.name ?? '-'),
            },
            {
              title: '版本',
              width: 120,
              render: (_: unknown, r: Record<string, unknown>) => String((r.deployItem as Record<string, unknown> | undefined)?.version ?? '-'),
            },
            {
              title: '备注',
              ellipsis: true,
              render: (_: unknown, r: Record<string, unknown>) => String(r.remark ?? '-'),
            },
          ];

          const egressColumns = [
            { title: '目标IP', render: (_: unknown, r: Record<string, unknown>) => displayPolicyPeer(r) },
            { title: '源端口', width: 88, render: (_: unknown, r: Record<string, unknown>) => (r.sourcePort ?? '-') },
            { title: '目标端口', width: 96, render: (_: unknown, r: Record<string, unknown>) => (r.targetPort ?? '-') },
            { title: '通讯协议', width: 88, render: (_: unknown, r: Record<string, unknown>) => String(r.protocol ?? 'TCP').toUpperCase() },
            { title: '作用', ellipsis: true, render: (_: unknown, r: Record<string, unknown>) => displayPolicyPurpose(r) },
            {
              title: '状态',
              width: 72,
              render: (_: unknown, r: Record<string, unknown>) => (
                <Tag color={String(r.status) === 'enabled' ? 'green' : 'default'}>{policyStatusLabel(r.status)}</Tag>
              ),
            },
          ];

          const ingressColumns = [
            { title: '源IP', render: (_: unknown, r: Record<string, unknown>) => displayPolicyPeer(r) },
            { title: '目标端口', width: 96, render: (_: unknown, r: Record<string, unknown>) => (r.targetPort ?? '-') },
            { title: '映射IP', width: 120, ellipsis: true, render: (_: unknown, r: Record<string, unknown>) => String(r.mappingIp ?? '-') },
            { title: '映射端口', width: 96, render: (_: unknown, r: Record<string, unknown>) => (r.mappingPort ?? '-') },
            { title: '通讯协议', width: 88, render: (_: unknown, r: Record<string, unknown>) => String(r.protocol ?? 'TCP').toUpperCase() },
            { title: '作用', ellipsis: true, render: (_: unknown, r: Record<string, unknown>) => displayPolicyPurpose(r) },
            {
              title: '状态',
              width: 72,
              render: (_: unknown, r: Record<string, unknown>) => (
                <Tag color={String(r.status) === 'enabled' ? 'green' : 'default'}>{policyStatusLabel(r.status)}</Tag>
              ),
            },
          ];

          const basicTab = (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="所属项目">{(asset.project as Record<string, unknown>)?.name as string ?? ''}</Descriptions.Item>
              <Descriptions.Item label="计算资源名称">{String(asset.name ?? '')}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{String(asset.ip ?? '')}</Descriptions.Item>
              <Descriptions.Item label="EIP">{String((asset as { eip?: unknown }).eip ?? '')}</Descriptions.Item>
              <Descriptions.Item label="主机名">{String(asset.hostname ?? '')}</Descriptions.Item>
              <Descriptions.Item label="操作系统类型">
                {asset.osType != null && asset.osType !== ''
                  ? (osTypeOptions.find((o) => o.value === asset.osType)?.label ?? String(asset.osType))
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作系统">
                {asset.os != null && asset.os !== ''
                  ? (osOptionsForDisplay.find((o) => o.value === asset.os)?.label ?? String(asset.os))
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="CPU架构">{String(asset.cpuArch ?? '')}</Descriptions.Item>
              <Descriptions.Item label="CPU型号">{String(asset.cpuModel ?? '')}</Descriptions.Item>
              <Descriptions.Item label="CPU核数（单位：C）">{asset.cpuCores != null && asset.cpuCores !== '' ? String(asset.cpuCores) : '-'}</Descriptions.Item>
              <Descriptions.Item label="内存（单位：GB）">{asset.memory != null && asset.memory !== '' ? String(asset.memory) : '-'}</Descriptions.Item>
              <Descriptions.Item label="系统盘（单位：GB）">{asset.systemDisk != null && asset.systemDisk !== '' ? String(asset.systemDisk) : '-'}</Descriptions.Item>
              <Descriptions.Item label="数据盘（单位：GB）">{asset.dataDisk != null && asset.dataDisk !== '' ? String(asset.dataDisk) : '-'}</Descriptions.Item>
              <Descriptions.Item label="网络区域">
                {asset.networkRegion != null && asset.networkRegion !== ''
                  ? (networkRegionOptions.find((o) => o.value === asset.networkRegion)?.label ?? String(asset.networkRegion))
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="SSH端口">
                {(asset as { sshPort?: number | null }).sshPort != null && (asset as { sshPort?: number | null }).sshPort !== undefined
                  ? String((asset as { sshPort?: number | null }).sshPort)
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="SSH用户">
                {String((asset as { sshUser?: string | null }).sshUser ?? '') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="SSH密码">
                {(asset as { sshPassword?: string | null }).sshPassword
                  ? '••••••••'
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="远程方式">
                {(asset.defaultRemoteInfo as Record<string, unknown>)?.id != null ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                    onClick={async () => {
                      const ri = asset.defaultRemoteInfo as Record<string, unknown>;
                      setRemoteContentRecord(ri);
                      setRemoteContentModalOpen(true);
                      if (ri?.id != null && ri.content == null) {
                        setRemoteContentLoading(true);
                        try {
                          const { data } = await getRemoteInfo(ri.id as number);
                          setRemoteContentRecord(data as Record<string, unknown>);
                        } finally {
                          setRemoteContentLoading(false);
                        }
                      }
                    }}
                  >
                    {(() => {
                      const ri = asset.defaultRemoteInfo as Record<string, unknown>;
                      const projectName = (projects.find((p) => p.id === ri?.projectId) as Record<string, unknown>)?.name as string;
                      return projectName ? `${projectName} - 查看内容` : `#${String(ri?.id ?? '')} 查看内容`;
                    })()}
                  </Button>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="部署软件">
                {((asset.serverDeployItems as Record<string, unknown>[]) ?? []).map((sdi: Record<string, unknown>) => {
                  const di = sdi.deployItem as Record<string, unknown> | undefined;
                  return di ? `${di.name ?? ''} ${di.version ?? ''}` : '';
                }).filter(Boolean).join('、') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{String(asset.remark ?? '')}</Descriptions.Item>
            </Descriptions>
          );

          return (
            <Tabs
              items={[
                { key: 'basic', label: '基本信息', children: basicTab },
                {
                  key: 'egress',
                  label: `出访信息${!viewDetailLoading && viewDetail ? `（${egressPolicies.length}）` : ''}`,
                  children: viewDetailLoading ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>加载中…</div>
                  ) : (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 8, showSizeChanger: true }}
                      dataSource={egressPolicies}
                      columns={egressColumns}
                      locale={{ emptyText: '暂无出访策略' }}
                    />
                  ),
                },
                {
                  key: 'ingress',
                  label: `入访信息${!viewDetailLoading && viewDetail ? `（${ingressPolicies.length}）` : ''}`,
                  children: viewDetailLoading ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>加载中…</div>
                  ) : (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 8, showSizeChanger: true }}
                      dataSource={ingressPolicies}
                      columns={ingressColumns}
                      locale={{ emptyText: '暂无入访策略' }}
                    />
                  ),
                },
                {
                  key: 'deploy',
                  label: `部署软件清单（${deployRows.length}）`,
                  children: (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 8, showSizeChanger: true }}
                      dataSource={deployRows}
                      columns={deployColumns}
                      locale={{ emptyText: '暂无部署软件' }}
                    />
                  ),
                },
              ]}
            />
          );
        })()}
      </Modal>
      <Modal
        title="远程方式 - 内容"
        open={remoteContentModalOpen}
        onCancel={() => { setRemoteContentModalOpen(false); setRemoteContentRecord(null); }}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {remoteContentLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>
        ) : remoteContentRecord ? (
          <div
            className="custom-html-style"
            style={{ maxHeight: 480, overflow: 'auto', padding: 12, background: '#f5f5f5', borderRadius: 4 }}
            dangerouslySetInnerHTML={{
              __html: remoteContentRecord.content != null && remoteContentRecord.content !== ''
                ? mdParser.render(String(remoteContentRecord.content))
                : '<p>暂无内容</p>',
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
