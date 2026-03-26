import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getProjects } from '../../api/projects';
import { getReleaseRecords } from '../../api/releaseRecords';

type ProjectOption = { id: number; name: string };
type ReleaseRecord = Record<string, unknown>;

export default function ReleaseRecordList() {
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [data, setData] = useState<ReleaseRecord[]>([]);

  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [environment, setEnvironment] = useState<string | undefined>(undefined);
  const [versionTag, setVersionTag] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [startAt, setStartAt] = useState<string>('');
  const [endAt, setEndAt] = useState<string>('');

  const environmentOptions = useMemo(() => {
    // 前端不依赖字典，尽量让查询体验可用
    return ['dev', 'test', 'prod'].map((v) => ({ label: v, value: v }));
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data } = await getProjects({});
      const list = Array.isArray(data) ? data : [];
      setProjectOptions(
        list.map((p: any) => ({
          id: Number(p.id),
          name: String(p.name ?? ''),
        })),
      );
    } catch (e) {
      message.error('加载项目信息失败');
      setProjectOptions([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (projectId != null) params.projectId = projectId;
      if (environment) params.environment = environment;
      if (versionTag.trim()) params.versionTag = versionTag.trim();
      if (keyword.trim()) params.keyword = keyword.trim();
      if (startAt) params.startAt = startAt;
      if (endAt) params.endAt = endAt;

      const { data } = await getReleaseRecords(params);
      setData(Array.isArray(data) ? data : []);
    } catch (e) {
      message.error('加载发布记录失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReset = () => {
    setProjectId(undefined);
    setEnvironment(undefined);
    setVersionTag('');
    setKeyword('');
    setStartAt('');
    setEndAt('');
    load();
  };

  const onQuery = () => load();

  const projectNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of projectOptions) map.set(p.id, p.name);
    return map;
  }, [projectOptions]);

  const columns: ColumnsType<ReleaseRecord> = [
    { title: '发布时间', dataIndex: 'releasedAt', render: (v) => (v ? String(v).replace('T', ' ') : '') },
    { title: '项目', dataIndex: 'projectId', render: (v) => projectNameById.get(Number(v)) ?? String(v ?? '') },
    { title: '环境', dataIndex: 'environment' },
    { title: '版本', dataIndex: 'versionTag' },
    { title: '发布人', dataIndex: 'releasedBy' },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
  ];

  // 简化：发布记录主要展示，暂不提供新增/编辑
  return (
    <Card>
      <div className="page-header">
        <h2>发布记录</h2>
        <Space>
          <Button onClick={onQuery}>查询</Button>
          <Button onClick={onReset}>重置</Button>
        </Space>
      </div>

      <div className="page-query">
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>起始时间：</span>
              <Input
                placeholder="YYYY-MM-DD HH:mm:ss"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>结束时间：</span>
              <Input placeholder="YYYY-MM-DD HH:mm:ss" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>项目：</span>
              <Select
                allowClear
                placeholder={loadingProjects ? '加载中' : '请选择'}
                style={{ width: '100%' }}
                value={projectId}
                onChange={(v) => setProjectId(v)}
                options={projectOptions.map((p) => ({ label: p.name, value: p.id }))}
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>环境：</span>
              <Select
                allowClear
                placeholder="请选择"
                style={{ width: '100%' }}
                value={environment}
                onChange={(v) => setEnvironment(v)}
                options={environmentOptions}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>版本tag：</span>
              <Input placeholder="请输入" value={versionTag} onChange={(e) => setVersionTag(e.target.value)} />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>关键字：</span>
              <Input placeholder="发布人/备注" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </Col>
        </Row>
      </div>

      <Table rowKey="id" size="middle" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
    </Card>
  );
}

