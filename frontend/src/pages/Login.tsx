import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const onFinish = async (v: { username: string; password: string }) => {
    setLoading(true);
    setLoginError(null);
    try {
      await login(v.username, v.password);
      message.success('登录成功');
      navigate('/', { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? '登录失败';
      setLoginError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflowY: 'auto',
        background:
          'radial-gradient(1000px 420px at 10% 10%, rgba(22,119,255,0.18), transparent 60%), radial-gradient(900px 380px at 90% 0%, rgba(170,59,255,0.16), transparent 55%), linear-gradient(180deg, #f7f9ff 0%, #f3f6ff 100%)',
      }}
    >
      <style>{`
        @keyframes blobFloatA {
          0% { transform: translate3d(-8%, -6%, 0) scale(1); }
          45% { transform: translate3d(10%, 6%, 0) scale(1.08); }
          100% { transform: translate3d(-8%, -6%, 0) scale(1); }
        }
        @keyframes blobFloatB {
          0% { transform: translate3d(10%, -8%, 0) scale(1); }
          55% { transform: translate3d(-6%, 10%, 0) scale(1.12); }
          100% { transform: translate3d(10%, -8%, 0) scale(1); }
        }
        @keyframes blobFloatC {
          0% { transform: translate3d(-6%, 8%, 0) scale(1); }
          50% { transform: translate3d(8%, -10%, 0) scale(1.06); }
          100% { transform: translate3d(-6%, 8%, 0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-blob { animation: none !important; }
        }

        /* ProComponents LoginForm 比例微调（注意：antd 默认 prefixCls=ant） */
        .ant-pro-form-login-title {
          font-size: 14px !important;
          line-height: 1.3 !important;
          font-weight: 600 !important;
          letter-spacing: 0.1px !important;
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
        }
        .ant-pro-form-login-top {
          margin-bottom: 24px !important;
        }
        .ant-pro-form-login-main {
          margin: 0 auto !important;
        }
      `}</style>

      {/* 背景纹理层（不影响内容交互） */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(16,24,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,40,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(closest-side at 50% 30%, rgba(0,0,0,0.9), transparent 70%)',
          opacity: 0.6,
        }}
      />

      {/* 动态光斑背景（不影响内容交互） */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          className="login-blob"
          style={{
            position: 'absolute',
            left: '-15%',
            top: '-20%',
            width: 520,
            height: 520,
            borderRadius: '999px',
            background: 'radial-gradient(circle at 30% 30%, rgba(22,119,255,0.55), rgba(22,119,255,0) 65%)',
            filter: 'blur(30px)',
            opacity: 0.9,
            animation: 'blobFloatA 16s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          className="login-blob"
          style={{
            position: 'absolute',
            right: '-18%',
            top: '-12%',
            width: 560,
            height: 560,
            borderRadius: '999px',
            background: 'radial-gradient(circle at 40% 35%, rgba(170,59,255,0.5), rgba(170,59,255,0) 68%)',
            filter: 'blur(34px)',
            opacity: 0.85,
            animation: 'blobFloatB 18s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          className="login-blob"
          style={{
            position: 'absolute',
            left: '10%',
            bottom: '-22%',
            width: 640,
            height: 640,
            borderRadius: '999px',
            background: 'radial-gradient(circle at 45% 45%, rgba(22,119,255,0.28), rgba(170,59,255,0.22), rgba(0,0,0,0) 70%)',
            filter: 'blur(40px)',
            opacity: 0.75,
            animation: 'blobFloatC 20s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>
      <div style={{ width: 420, maxWidth: '100%' }}>
        <div
          style={{
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(16,24,40,0.08)',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            padding: 22,
          }}
        >
          <LoginForm
            title="内部管理系统"
            subTitle={false}
            message={loginError ? <div style={{ color: '#cf1322' }}>{loginError}</div> : undefined}
            onFinish={onFinish}
            contentStyle={{ width: '100%', maxWidth: 360 }}
            submitter={{
              searchConfig: { submitText: '登录' },
              submitButtonProps: { loading, block: true, type: 'primary' as any },
            }}
          >
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined />,
                autoFocus: true,
                autoComplete: 'username',
                placeholder: '请输入用户名',
              }}
              rules={[{ required: true, message: '请输入用户名' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
                autoComplete: 'current-password',
                placeholder: '请输入密码',
              }}
              rules={[{ required: true, message: '请输入密码' }]}
            />
          </LoginForm>
        </div>
      </div>
    </div>
  );
}
