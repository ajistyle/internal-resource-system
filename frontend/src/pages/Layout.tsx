import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown, Typography } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import PageAgentWidget from '../components/PageAgentWidget';

const { Header, Sider, Content } = AntLayout;

const menuItems = (showUserManage: boolean) => [
  { key: '/home', label: <Link to="/home">首页</Link> },
  { key: '/assets', label: <Link to="/assets">资源中心</Link> },
  {
    key: 'project-resource',
    label: '项目资源管理',
    children: [
      { key: '/projects', label: <Link to="/projects">项目信息</Link> },
      { key: '/stakeholders', label: <Link to="/stakeholders">干系人</Link> },
    ],
  },
  {
    key: 'basic-resource',
    label: '基础资源管理',
    children: [
      { key: '/remote-infos', label: <Link to="/remote-infos">远程管理</Link> },
      { key: '/servers', label: <Link to="/servers">计算资源</Link> },
      { key: '/k8s-deployments', label: <Link to="/k8s-deployments">应用集群</Link> },
      { key: '/data-backups', label: <Link to="/data-backups">数据备份</Link> },
      { key: '/network-policies', label: <Link to="/network-policies">网络策略</Link> },
    ],
  },
  {
    key: 'ops-records',
    label: '日常运维记录',
    children: [
      { key: '/ops/server-maintenance-records', label: <Link to="/ops/server-maintenance-records">服务器维护记录</Link> },
      { key: '/ops/data-maintenance-records', label: <Link to="/ops/data-maintenance-records">数据维护记录</Link> },
    ],
  },
  {
    key: 'quality-management',
    label: '质量管理',
    children: [
      { key: '/quality/delivery-records', label: <Link to="/quality/delivery-records">交付记录</Link> },
      { key: '/quality/release-records', label: <Link to="/quality/release-records">发布记录</Link> },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    children: [
      { key: '/deploy-items', label: <Link to="/deploy-items">软件清单</Link> },
      { key: '/dictionaries', label: <Link to="/dictionaries">字典管理</Link> },
      { key: '/operation-logs', label: <Link to="/operation-logs">操作日志</Link> },
      ...(showUserManage ? [{ key: '/users', label: <Link to="/users">用户管理</Link> }] : []),
    ],
  },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const seg1 = location.pathname.split('/')[1] ?? 'projects';
  const pathFirst = seg1 === 'ops' ? '/ops' : '/' + seg1;
  const selectedKey = pathFirst;

  const parentKeyOf: Record<string, string> = {
    '/projects': 'project-resource',
    '/stakeholders': 'project-resource',
    '/remote-infos': 'basic-resource',
    '/servers': 'basic-resource',
    '/k8s-deployments': 'basic-resource',
    '/data-backups': 'basic-resource',
    '/network-policies': 'basic-resource',
    '/ops': 'ops-records',
    '/quality': 'quality-management',
    '/deploy-items': 'system',
    '/dictionaries': 'system',
    '/operation-logs': 'system',
    '/users': 'system',
  };
  const defaultOpenKeys = parentKeyOf[pathFirst] ? [parentKeyOf[pathFirst]] : [];
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);

  useEffect(() => {
    if (parentKeyOf[pathFirst] && !openKeys.includes(parentKeyOf[pathFirst])) {
      setOpenKeys((prev) => [...prev, parentKeyOf[pathFirst]!]);
    }
  }, [pathFirst]);

  const items = useMemo(() => menuItems(isAdmin()), [isAdmin()]);

  return (
    <AntLayout style={{ minHeight: '100vh', width: '100%', display: 'flex', background: '#f5f5f7' }}>
      <Sider
        theme="light"
        width={220}
        style={{
          background: '#f2f2f7',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div
          style={{
            margin: '20px 16px 12px',
            color: '#1d1d1f',
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          资源管理
        </div>
        <Menu
          theme="light"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          mode="inline"
          items={items}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>
      <AntLayout style={{ flex: 1, minWidth: 0, background: '#f5f5f7' }}>
        <Header
          style={{
            background: '#ffffff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            height: 52,
            lineHeight: '52px',
          }}
        >
          <Dropdown
            menu={{
              items: [{ key: 'logout', label: '退出登录', onClick: logout }],
            }}
          >
            <Typography.Text style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {user?.realName || user?.username}
              <DownOutlined />
            </Typography.Text>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '16px 24px 24px',
            padding: 24,
            background: '#ffffff',
            minHeight: 280,
            overflow: 'auto',
            borderRadius: 12,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
      <PageAgentWidget />
    </AntLayout>
  );
}
