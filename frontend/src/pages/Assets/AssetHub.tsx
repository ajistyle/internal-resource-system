import { useEffect, useState } from 'react';
import { Button, Card, Col, Descriptions, Drawer, Row, Select, Space, Table, Tag } from 'antd';
import { getProjects } from '../../api/projects';
import { getAssetDetail, getAssetsOverview } from '../../api/assets';

const SERVER_DETAIL_SKIP_KEYS = new Set(['project', 'serverDeployItems', 'defaultRemoteInfo']);

const policyTypeLabel = (v: string) =>
  v === 'egress' ? '出访' : v === 'ingress' ? '入访' : v === 'crossnet' ? '跨网(旧)' : v;

function policyPeerDisplay(r: Record<string, unknown>) {
  const p = r.peerIp as string | null | undefined;
  if (p != null && String(p).trim() !== '') return String(p).trim();
  if (r.policyType === 'egress' && r.targetZone) return String(r.targetZone);
  if (r.policyType === 'ingress' && r.sourceZone) return String(r.sourceZone);
  if (r.sourceZone || r.targetZone) return [r.sourceZone, r.targetZone].filter(Boolean).join(' / ');
  return '-';
}

function policyPurposeDisplay(r: Record<string, unknown>) {
  const p = r.purpose as string | null | undefined;
  if (p != null && String(p).trim() !== '') return String(p).trim();
  return (r.remark as string) || '-';
}

function countServerDeployItems(servers: Record<string, unknown>[]) {
  return servers.reduce((n, s) => n + (((s.serverDeployItems as Record<string, unknown>[] | undefined) ?? []).length), 0);
}

function renderServerDeployNameTags(record: Record<string, unknown>) {
  const items = (record.serverDeployItems as Record<string, unknown>[] | undefined) ?? [];
  const tags = items
    .map((sdi) => {
      const di = sdi.deployItem as Record<string, unknown> | undefined;
      const name = di?.name != null ? String(di.name).trim() : '';
      if (!name) return null;
      return <Tag key={sdi.id as number}>{name}</Tag>;
    })
    .filter(Boolean);
  if (tags.length === 0) return <span style={{ color: '#999' }}>-</span>;
  return <Space wrap size={[4, 4]}>{tags}</Space>;
}

function safeString(v: unknown, fallback = '-') {
  const s = v == null ? '' : String(v);
  const t = s.trim();
  return t ? t : fallback;
}

function dataBackupLabel(v: unknown) {
  const s = String(v ?? '');
  if (s === 'file') return '文件';
  if (s === 'database') return '数据库';
  if (s === 'incremental') return '增量';
  if (s === 'full') return '全量';
  return safeString(v);
}

export default function AssetHub() {
  const [projectId, setProjectId] = useState<number | undefined>();
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [servers, setServers] = useState<Record<string, unknown>[]>([]);
  const [dataBackups, setDataBackups] = useState<Record<string, unknown>[]>([]);
  const [policies, setPolicies] = useState<Record<string, unknown>[]>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([getProjects(), getAssetsOverview(projectId)]);
      setProjects(Array.isArray(p.data) ? p.data : []);
      setServers(Array.isArray(o.data?.servers) ? o.data.servers : []);
      setDataBackups(Array.isArray(o.data?.dataBackups) ? o.data.dataBackups : []);
      setPolicies(Array.isArray(o.data?.policies) ? o.data.policies : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const openDetail = async (type: 'server' | 'data-backup', id: number) => {
    const { data } = await getAssetDetail(type, id);
    setDetail(data as Record<string, unknown>);
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <h2>资源中心</h2>
      </div>
      <div className="page-query">
        <span>所属项目：</span>
        <Select
          allowClear
          style={{ width: 220 }}
          value={projectId}
          onChange={setProjectId}
          placeholder="请选择"
          options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))}
        />
        <Button onClick={() => load()}>刷新</Button>
      </div>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card title="服务器数量">{servers.length}</Card></Col>
        <Col span={6}><Card title="部署软件数量">{countServerDeployItems(servers)}</Card></Col>
        <Col span={6}><Card title="数据备份数量">{dataBackups.length}</Card></Col>
        <Col span={6}><Card title="网络策略数量">{policies.length}</Card></Col>
      </Row>

      <Card title="服务器资产" style={{ marginBottom: 12 }}>
        <Table
          rowKey="id"
          loading={loading}
          size="small"
          dataSource={servers}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: '名称', dataIndex: 'name' },
            { title: 'IP', dataIndex: 'ip' },
            { title: 'OS', dataIndex: 'os' },
            {
              title: '部署',
              render: (_: unknown, r: Record<string, unknown>) => renderServerDeployNameTags(r),
            },
            {
              title: '操作',
              render: (_: unknown, r: Record<string, unknown>) => (
                <Space>
                  <Button type="link" size="small" onClick={() => openDetail('server', r.id as number)}>详情</Button>
                  <Button type="link" size="small" onClick={() => window.location.assign(`/ops/server-maintenance-records?projectId=${r.projectId}&serverId=${r.id}`)}>运维记录</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card title="数据备份" style={{ marginBottom: 12 }}>
        <Table
          rowKey="id"
          loading={loading}
          size="small"
          dataSource={dataBackups}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: '服务器', dataIndex: ['server', 'ip'], width: 140, ellipsis: true },
            { title: '类型', dataIndex: 'backupType', width: 90, ellipsis: true, render: (v: unknown) => dataBackupLabel(v) },
            { title: '策略', dataIndex: 'backupPolicy', width: 90, ellipsis: true, render: (v: unknown) => dataBackupLabel(v) },
            { title: '频率(cron)', dataIndex: 'cron', width: 140, ellipsis: true },
            { title: '保留天数', dataIndex: 'retentionDays', width: 90 },
            {
              title: '操作',
              width: 100,
              render: (_: unknown, r: Record<string, unknown>) => (
                <Space>
                  <Button type="link" size="small" onClick={() => openDetail('data-backup', r.id as number)}>详情</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card title="网络策略">
        <Table
          rowKey="id"
          loading={loading}
          size="small"
          dataSource={policies}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: '类型', dataIndex: 'policyType', render: (v: string) => policyTypeLabel(v) },
            {
              title: '本端机器',
              render: (_: unknown, r: Record<string, unknown>) => {
                const s = r.server as { ip?: string; name?: string } | null | undefined;
                if (!s?.ip && !s?.name) return '-';
                return `${s?.ip ?? ''}${s?.name ? ` (${s.name})` : ''}`;
              },
            },
            { title: '对端 IP', render: (_: unknown, r: Record<string, unknown>) => policyPeerDisplay(r) },
            { title: '作用', render: (_: unknown, r: Record<string, unknown>) => policyPurposeDisplay(r) },
            { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'default'}>{v}</Tag> },
          ]}
        />
      </Card>

      <Drawer open={detailOpen} onClose={() => setDetailOpen(false)} title="资源详情" width={680}>
        {detail?.asset ? (
          <>
            {detail.type === 'data-backup' ? (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="服务器IP">
                  {safeString((detail.asset as Record<string, unknown>)?.server && (detail.asset as any).server.ip)}
                </Descriptions.Item>
                <Descriptions.Item label="备份类型">{dataBackupLabel((detail.asset as any).backupType)}</Descriptions.Item>
                <Descriptions.Item label="备份策略">{dataBackupLabel((detail.asset as any).backupPolicy)}</Descriptions.Item>
                <Descriptions.Item label="备份范围">
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {safeString((detail.asset as any).scope)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="备份频率(cron)">{safeString((detail.asset as any).cron)}</Descriptions.Item>
                <Descriptions.Item label="保留天数">{safeString((detail.asset as any).retentionDays)}</Descriptions.Item>
                <Descriptions.Item label="本地备份（存储路径）">{safeString((detail.asset as any).localBackupPath)}</Descriptions.Item>
                <Descriptions.Item label="异地备份（存储路径）">{safeString((detail.asset as any).remoteBackupPath)}</Descriptions.Item>
                <Descriptions.Item label="本机备份脚本（路径）">{safeString((detail.asset as any).localScriptPath)}</Descriptions.Item>
                <Descriptions.Item label="Git备份脚本（路径）">{safeString((detail.asset as any).gitScriptPath)}</Descriptions.Item>
                <Descriptions.Item label="备注">
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {safeString((detail.asset as any).remark)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <>
                <Descriptions column={1} bordered size="small">
                  {Object.entries(detail.asset as Record<string, unknown>)
                    .filter(([k]) => {
                      if (detail.type === 'server') return !SERVER_DETAIL_SKIP_KEYS.has(k);
                      return k !== 'project';
                    })
                    .map(([k, v]) => (
                      <Descriptions.Item key={k} label={k}>
                        {v != null && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')}
                      </Descriptions.Item>
                    ))}
                </Descriptions>
                <Card title="最近日志" size="small" style={{ marginTop: 12 }}>
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={(detail.recentLogs as Record<string, unknown>[] | undefined) ?? []}
                    columns={[{ title: '类型', dataIndex: 'type', width: 90 }, { title: '对象', dataIndex: 'target', width: 120 }, { title: '内容', dataIndex: 'message' }]}
                  />
                </Card>
              </>
            )}
          </>
        ) : null}
      </Drawer>
    </div>
  );
}

