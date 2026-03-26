import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, message, Button, Space } from 'antd';
import { getProjects } from '../../api/projects';
import { getStakeholders } from '../../api/stakeholders';
import { getServers } from '../../api/servers';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ projectCount: number; stakeholderCount: number; serverCount: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, sv] = await Promise.all([
        getProjects(),
        getStakeholders(),
        getServers(),
      ]);
      const res = {
        projectCount: Array.isArray(p.data) ? p.data.length : 0,
        stakeholderCount: Array.isArray(s.data) ? s.data.length : 0,
        serverCount: Array.isArray(sv.data) ? sv.data.length : 0,
      };
      setData({
        projectCount: Number((res as any)?.projectCount ?? 0),
        stakeholderCount: Number((res as any)?.stakeholderCount ?? 0),
        serverCount: Number((res as any)?.serverCount ?? 0),
      });
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>首页</h2>
        <Space>
          <Button onClick={load}>刷新</Button>
        </Space>
      </div>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 16 }}>
        快速概览当前资源规模。
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered loading={loading} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <Statistic title="项目数量" value={data?.projectCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered loading={loading} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <Statistic title="干系人数量" value={data?.stakeholderCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered loading={loading} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <Statistic title="服务器数量" value={data?.serverCount ?? 0} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

