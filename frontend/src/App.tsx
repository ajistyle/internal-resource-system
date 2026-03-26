import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './pages/Layout';
import Login from './pages/Login';
import Home from './pages/Home/Home';
import ProjectList from './pages/Projects/ProjectList';
import StakeholderList from './pages/Stakeholders/StakeholderList';
import RemoteInfoList from './pages/RemoteInfos/RemoteInfoList';
import DeployItemList from './pages/DeployItems/DeployItemList';
import ServerList from './pages/Servers/ServerList';
import UserList from './pages/Users/UserList';
import DictionaryList from './pages/Dictionaries/DictionaryList';
import OperationLogList from './pages/OperationLogs/OperationLogList';
import ServerMaintenanceRecordList from './pages/Ops/ServerMaintenanceRecordList';
import DataMaintenanceRecordList from './pages/Ops/DataMaintenanceRecordList';
import ReleaseRecordList from './pages/Quality/ReleaseRecordList';
import DeliveryRecordList from './pages/Quality/DeliveryRecordList';
import NetworkPolicyList from './pages/NetworkPolicies/NetworkPolicyList';
import AssetHub from './pages/Assets/AssetHub';
import K8sDeploymentList from './pages/K8sDeployments/K8sDeploymentList';
import DataBackupList from './pages/DataBackups/DataBackupList';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="assets" element={<AssetHub />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="stakeholders" element={<StakeholderList />} />
        <Route path="remote-infos" element={<RemoteInfoList />} />
        <Route path="deploy-items" element={<DeployItemList />} />
        <Route path="servers" element={<ServerList />} />
        <Route path="network-policies" element={<NetworkPolicyList />} />
        <Route path="k8s-deployments" element={<K8sDeploymentList />} />
        <Route path="data-backups" element={<DataBackupList />} />
        <Route path="dictionaries" element={<DictionaryList />} />
        <Route path="users" element={<UserList />} />
        <Route path="operation-logs" element={<OperationLogList />} />
        <Route path="ops/server-maintenance-records" element={<ServerMaintenanceRecordList />} />
        <Route path="ops/data-maintenance-records" element={<DataMaintenanceRecordList />} />
        <Route path="quality/release-records" element={<ReleaseRecordList />} />
        <Route path="quality/delivery-records" element={<DeliveryRecordList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Apple 系浅色 + AI 产品常见的柔和蓝紫点缀 */
const theme = {
  token: {
    colorPrimary: '#007aff',
    colorInfo: '#5e5ce6',
    colorSuccess: '#34c759',
    colorWarning: '#ff9f0a',
    colorError: '#ff3b30',
    colorBgBase: '#f5f5f7',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorTextBase: '#1d1d1f',
    colorTextSecondary: '#6e6e73',
    colorBorder: 'rgba(0, 0, 0, 0.08)',
    colorBorderSecondary: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 10,
    borderRadiusLG: 12,
    boxShadow:
      '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      bodyBg: '#f5f5f7',
      headerBg: '#ffffff',
      headerHeight: 52,
      headerPadding: '0 20px',
      siderBg: '#f2f2f7',
      triggerBg: '#f2f2f7',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: 'rgba(0, 122, 255, 0.12)',
      itemSelectedColor: '#0071e3',
      itemHoverBg: 'rgba(0, 0, 0, 0.04)',
      itemActiveBg: 'rgba(0, 122, 255, 0.08)',
      itemColor: '#1d1d1f',
      itemMarginInline: 8,
      itemMarginBlock: 2,
      borderRadius: 8,
      iconSize: 16,
    },
    Card: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 12,
      paddingLG: 20,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#6e6e73',
      rowHoverBg: 'rgba(0, 122, 255, 0.04)',
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Input: {
      activeBorderColor: '#007aff',
      hoverBorderColor: 'rgba(0, 122, 255, 0.45)',
    },
  },
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider locale={zhCN} theme={theme} componentSize="middle">
          <AntApp>
            <AppRoutes />
          </AntApp>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
