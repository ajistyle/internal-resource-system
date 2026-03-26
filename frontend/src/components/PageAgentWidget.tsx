import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Input } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { PageAgent } from 'page-agent';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    pageAgent?: any;
  }
}

type AgentStatus = 'idle' | 'loading' | 'executing';

export default function PageAgentWidget() {
  const { canEdit } = useAuth();
  const { message } = App.useApp();
  const agentRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const panelHostRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const movedRef = useRef(false);
  const dragStartRef = useRef({
    startX: 0,
    startY: 0,
    origLeft: 0,
    origTop: 0,
  });

  const config = useMemo(() => {
    // 通过环境变量配置模型。示例：
    // VITE_PAGE_AGENT_MODEL=qwen3.5-plus
    // VITE_PAGE_AGENT_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
    // VITE_PAGE_AGENT_API_KEY=xxx
    const model = import.meta.env.VITE_PAGE_AGENT_MODEL as string | undefined;
    const baseURL = import.meta.env.VITE_PAGE_AGENT_BASE_URL as string | undefined;
    const apiKey = import.meta.env.VITE_PAGE_AGENT_API_KEY as string | undefined;
    const language = (import.meta.env.VITE_PAGE_AGENT_LANGUAGE as string | undefined) ?? 'zh-CN';
    return { model, baseURL, apiKey, language };
  }, []);

  // 清理历史遗留的全局 demo 面板（防止页面上出现两套对话框）
  useEffect(() => {
    try {
      document.getElementById('page-agent-runtime_agent-panel')?.remove();
    } catch {
      // ignore
    }

    const g = window.pageAgent;
    if (g) {
      try {
        g.panel?.hide?.();
      } catch {
        // ignore
      }
      try {
        g.dispose?.();
      } catch {
        // ignore
      }
      try {
        const w = g.panel?.wrapper as HTMLElement | undefined;
        w?.remove?.();
      } catch {
        // ignore
      }
      window.pageAgent = undefined;
    }

    return () => {
      try {
        agentRef.current?.dispose?.();
      } catch {
        // ignore
      }
      agentRef.current = null;
    };
  }, []);

  // 注入触发按钮动画样式（只注入一次）
  useEffect(() => {
    const styleId = 'page-agent-trigger-anim';
    if (document.getElementById(styleId)) return;
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = `
/* 无动画：避免旋转和边框闪光 */
.page-agent-trigger {
  animation: none !important;
}

.page-agent-ai-badge {
  position: absolute;
  right: -5px;
  top: -5px;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background: rgba(0, 122, 255, 0.95);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(0, 122, 255, 0.22);
}

@keyframes pageAgentBadgeBubble {
  0% { transform: translateY(0) scale(1); box-shadow: 0 6px 14px rgba(0, 122, 255, 0.22); opacity: 0.95; }
  50% { transform: translateY(-3px) scale(1.08); box-shadow: 0 10px 22px rgba(0, 122, 255, 0.32); opacity: 1; }
  100% { transform: translateY(0) scale(1); box-shadow: 0 6px 14px rgba(0, 122, 255, 0.22); opacity: 0.95; }
}

/* 仅让 AI 角标有“气泡”动态 */
.page-agent-ai-badge {
  animation: pageAgentBadgeBubble 1.8s ease-in-out infinite;
}

.page-agent-icon-wrap {
  position: relative;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-agent-person-icon {
  animation: none !important;
  font-size: 24px;
}

    `.trim();
    document.head.appendChild(el);
  }, []);

  const isDisposed = (agent: any) => {
    // 兼容不同实现：disposed 属性 / execute 抛错
    return Boolean(agent?.disposed);
  };

  const createAgent = () => {
    agentRef.current = new (PageAgent as any)({
      model: config.model,
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      language: config.language,
      // 防止 PageAgent 创建“全屏遮罩”，避免抽屉关闭后仍然沾满页面
      enableMask: false,
    });
    // 集成模式下，我们优先让 agent-browser 操作“本组件的指令输入框”，
    // 因此默认隐藏 PageAgent 内置面板，减少 DOM 干扰。
    agentRef.current?.panel?.hide?.();
    mountBuiltinPanel();
  };

  const mountBuiltinPanel = () => {
    const host = panelHostRef.current;
    const agent = agentRef.current;
    const wrapper = agent?.panel?.wrapper as HTMLElement | undefined;
    if (!host || !wrapper) return;

    // 将内置面板 DOM 挂到抽屉内
    if (wrapper.parentElement !== host) {
      host.innerHTML = '';
      host.appendChild(wrapper);
    }

    // 让内置面板在抽屉里正常布局（去掉浮窗定位）
    wrapper.style.position = 'static';
    wrapper.style.left = 'auto';
    wrapper.style.right = 'auto';
    wrapper.style.bottom = 'auto';
    wrapper.style.top = 'auto';
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '100%';
    wrapper.style.margin = '0';
    wrapper.style.boxShadow = 'none';
    wrapper.style.transform = 'none';
    wrapper.style.opacity = '1';
    wrapper.style.display = 'block';
    wrapper.style.zIndex = 'auto';
    wrapper.style.height = 'auto';
    wrapper.style.minHeight = '0';

    // 覆盖浮窗默认的宽高（默认是 360x40 的“底部条”）
    try {
      wrapper.style.setProperty('--width', '100%');
      // 让面板在抽屉里按容器高度自适应（否则会把抽屉占满）
      wrapper.style.setProperty('--height', 'auto');
    } catch {
      // ignore
    }

    // 强制进入“展开态”（避免在抽屉里仍然显示为浮窗折叠条）
    try {
      // 该类名来自 @page-agent/ui 的构建产物（1.5.9）
      wrapper.classList.add('_expanded_gtdpc_278');
    } catch {
      // ignore
    }

    // 隐藏“关闭/停止”按钮，避免用户点击导致 agent dispose
    try {
      const buttons = Array.from(wrapper.querySelectorAll('button')) as HTMLButtonElement[];
      buttons.forEach((b) => {
        const t = (b.getAttribute('title') || '').toLowerCase();
        const txt = (b.textContent || '').trim().toLowerCase();
        if (
          t.includes('close') ||
          t.includes('stop') ||
          t.includes('关闭') ||
          t.includes('停止') ||
          txt === 'x'
        ) {
          b.style.display = 'none';
        }
      });

      // 再加一层兜底：拦截 stop/close 的点击，防止 dispose
      wrapper.addEventListener(
        'click',
        (evt) => {
          const el = evt.target as HTMLElement | null;
          const btn = el?.closest?.('button') as HTMLButtonElement | null;
          if (!btn) return;
          const t = (btn.getAttribute('title') || '').toLowerCase();
          const txt = (btn.textContent || '').trim().toLowerCase();
          if (t.includes('close') || t.includes('stop') || txt === 'x') {
            evt.preventDefault();
            evt.stopPropagation();
            // @ts-ignore
            evt.stopImmediatePropagation?.();
          }
        },
        true,
      );
    } catch {
      // ignore
    }

  };

  const unmountBuiltinPanel = () => {
    const agent = agentRef.current;
    const wrapper = agent?.panel?.wrapper as HTMLElement | undefined;
    if (!wrapper) return;
    try {
      agent?.panel?.hide?.();
    } catch {
      // ignore
    }

    // 强制隐藏：避免 hide 没生效时 wrapper 继续占据布局
    wrapper.style.display = 'none';
    // 取消展开态（避免重新插入后仍保持奇怪高度/动画态）
    try {
      wrapper.classList.remove('_expanded_gtdpc_278');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // 只在第一次打开时初始化，避免影响首屏性能
    if (!open) return;
    if (agentRef.current) return;

    if (!config.model || !config.baseURL || !config.apiKey) {
      message.warning('AI 助手未配置模型参数（请配置 VITE_PAGE_AGENT_MODEL / BASE_URL / API_KEY）');
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus('loading');
      setLastError(null);
      try {
        if (cancelled) return;
        createAgent();
        message.success('AI 助手已就绪');
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : 'AI 助手初始化失败';
        setLastError(msg);
        message.error(msg);
        agentRef.current = null;
      } finally {
        if (!cancelled) setStatus('idle');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, config]);

  useEffect(() => {
    if (open) {
      // 打开“指令输入区”时，确保内置面板仍保持隐藏（由我们提供稳定 UI）。
      mountBuiltinPanel();
      try {
        agentRef.current?.panel?.hide?.();
      } catch {
        // ignore
      }
    } else {
      // 抽屉关闭时，隐藏并卸载面板
      unmountBuiltinPanel();
    }
  }, [open]);

  const onRun = async () => {
    const text = prompt.trim();
    if (!text) return;
    if (status === 'loading') {
      message.info('AI 助手初始化中，请稍候…');
      return;
    }
    if (!agentRef.current) {
      // 尝试触发一次初始化（避免用户打开后立即执行，误以为没反应）
      message.warning('AI 助手未就绪（请确认已配置模型参数，或稍后重试）');
      return;
    }
    if (isDisposed(agentRef.current)) {
      // 重新创建实例
      agentRef.current = null;
      createAgent();
    }
    setStatus('executing');
    setLastError(null);
    try {
      // 查看者：界面上本就没有新增/编辑/删除按钮，因此通常无法触发写操作。
      // 这里不做强制拦截，避免误伤正常的“查询/跳转/填充”动作。
      const timeoutMs = 60_000;
      await Promise.race([
        agentRef.current.execute(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('执行超时（60s），请简化指令或分步执行）')), timeoutMs)),
      ]);
      setPrompt('');
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : '执行失败，请换一种说法或缩小指令范围';
      // 若是 disposed，自动重建并提示
      if (typeof msg === 'string' && msg.includes('disposed')) {
        agentRef.current = null;
        message.warning('AI 助手实例已重置，请重试一次指令');
      }
      setLastError(msg);
      message.error(msg);
    } finally {
      setStatus('idle');
    }
  };

  // 初始化拖拽按钮位置（右下角附近）
  useEffect(() => {
    const setDefault = () => {
      const size = 56;
      const margin = 18;
      setPos({
        left: window.innerWidth - size - margin,
        top: window.innerHeight - size - margin,
      });
    };
    setDefault();
    window.addEventListener('resize', setDefault);
    return () => window.removeEventListener('resize', setDefault);
  }, []);

  const openAgent = () => {
    if (!config.model || !config.baseURL || !config.apiKey) {
      message.warning('AI 助手未配置模型参数（请配置 VITE_PAGE_AGENT_MODEL / BASE_URL / API_KEY）');
      return;
    }

    if (!canEdit()) {
      message.info('当前为查看权限：建议执行查询/跳转/筛选等操作。');
    }

    // 切换“指令输入区”
    if (open) {
      try {
        agentRef.current?.panel?.hide?.();
      } catch {
        // ignore
      }
      setOpen(false);
      return;
    }

    if (!agentRef.current || isDisposed(agentRef.current)) {
      agentRef.current = null;
      createAgent();
    } else {
      // 即使已存在，也保证内置面板隐藏（减少 agent-browser 干扰）
      try {
        agentRef.current?.panel?.hide?.();
      } catch {
        // ignore
      }
    }
    setOpen(true);
  };

  const onPointerDown = (e: any) => {
    if (!pos) return;
    // mouse 左键才允许拖拽/点击
    if (e?.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;

    const startX = e.clientX;
    const startY = e.clientY;
    movedRef.current = false;
    dragStartRef.current = {
      startX,
      startY,
      origLeft: pos.left,
      origTop: pos.top,
    };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movedRef.current = true;

      const size = 56;
      const margin = 8;
      const left = Math.min(
        Math.max(dragStartRef.current.origLeft + dx, margin),
        window.innerWidth - size - margin,
      );
      const top = Math.min(
        Math.max(dragStartRef.current.origTop + dy, margin),
        window.innerHeight - size - margin,
      );
      setPos({ left, top });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // 没拖动时当作“点击打开”
      if (!movedRef.current) openAgent();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    e.preventDefault?.();
  };

  return (
    <>
      {open && (
        <div
          data-testid="page-agent-panel"
          style={{
            position: 'fixed',
            zIndex: 1000,
            right: 18,
            bottom: 76,
            width: 440,
            padding: 12,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>AI 指令</div>
          <Input.TextArea
            data-testid="page-agent-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder=""
            autoSize={{ minRows: 3, maxRows: 7 }}
            disabled={status === 'loading'}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <Button
              data-testid="page-agent-run"
              type="primary"
              onClick={onRun}
              loading={status === 'executing'}
              disabled={status === 'loading'}
            >
              执行
            </Button>
            <Button
              data-testid="page-agent-close"
              onClick={() => {
                try {
                  agentRef.current?.panel?.hide?.();
                } catch {
                  // ignore
                }
                setOpen(false);
              }}
            >
              关闭
            </Button>
          </div>
          {lastError && (
            <div style={{ color: '#b91c1c', marginTop: 8, fontSize: 12 }}>
              {lastError}
            </div>
          )}
        </div>
      )}

      <div
        data-testid="page-agent-trigger"
        style={{
          position: 'fixed',
          zIndex: 999,
          left: pos?.left ?? 0,
          top: pos?.top ?? 0,
          cursor: 'grab',
          touchAction: 'none',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPointerDown={onPointerDown}
        role="button"
        aria-label="AI 助手"
        tabIndex={0}
        className="page-agent-trigger"
      >
        <Button
          type="primary"
          shape="circle"
          size="large"
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="page-agent-icon-wrap">
            <RobotOutlined className="page-agent-person-icon" />
            <span className="page-agent-ai-badge">AI</span>
          </span>
        </Button>
      </div>
    </>
  );
}

