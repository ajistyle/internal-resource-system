import { useEffect, useState } from 'react';
import { Table, Button, Select, Input, DatePicker, message, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { getOperationLogs } from '../../api/operationLogs';

const typeOptions = [
  { label: '新增', value: 'CREATE' },
  { label: '变更', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
];

const targetOptions = [
  { label: '项目信息', value: 'PROJECT' },
  { label: '项目附件', value: 'PROJECT_ATTACHMENT' },
  { label: '应用集群', value: 'K8S_DEPLOYMENT' },
  { label: '数据备份', value: 'DATA_BACKUP' },
  { label: '干系人信息', value: 'STAKEHOLDER' },
  { label: '服务器', value: 'SERVER' },
  { label: '远程信息', value: 'REMOTE_INFO' },
  { label: '软件清单', value: 'DEPLOY_ITEM' },
  { label: '字典', value: 'DICTIONARY' },
  { label: '用户', value: 'USER' },
];

export default function OperationLogList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryStart, setQueryStart] = useState<Dayjs | null>(null);
  const [queryEnd, setQueryEnd] = useState<Dayjs | null>(null);
  const [queryType, setQueryType] = useState<string | undefined>();
  const [queryTarget, setQueryTarget] = useState<string | undefined>();
  const [queryMessage, setQueryMessage] = useState('');

  const load = async (params?: { startTime?: string; endTime?: string; type?: string; target?: string; message?: string }) => {
    setLoading(true);
    try {
      const { data } = await getOperationLogs(params);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onQuery = () => {
    load({
      startTime: queryStart ? queryStart.toISOString() : undefined,
      endTime: queryEnd ? queryEnd.toISOString() : undefined,
      type: queryType,
      target: queryTarget,
      message: queryMessage.trim() || undefined,
    });
  };

  const onReset = () => {
    setQueryStart(null);
    setQueryEnd(null);
    setQueryType(undefined);
    setQueryTarget(undefined);
    setQueryMessage('');
    load();
  };

  const columns = [
    { title: '日志类型', dataIndex: 'type', width: 90, render: (v: string) => typeOptions.find((o) => o.value === v)?.label ?? v },
    { title: '操作对象', dataIndex: 'target', width: 110, render: (v: string) => targetOptions.find((o) => o.value === v)?.label ?? v },
    { title: '操作用户', dataIndex: 'operatorName', width: 120 },
    { title: '操作日志', dataIndex: 'message', ellipsis: true },
    {
      title: '日志时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>操作日志</h2>
        <Space>
          <Button onClick={() => onQuery()}>刷新</Button>
        </Space>
      </div>
      <div className="page-query">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <span>日志起始时间：</span>
        <DatePicker
          showTime
          allowClear
          placeholder="请选择"
          style={{ width: 180 }}
          value={queryStart}
          onChange={(v) => setQueryStart(v)}
        />
        <span>日志结束时间：</span>
        <DatePicker
          showTime
          allowClear
          placeholder="请选择"
          style={{ width: 180 }}
          value={queryEnd}
          onChange={(v) => setQueryEnd(v)}
        />
      </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>日志类型：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 140 }}
          value={queryType}
          onChange={setQueryType}
          options={typeOptions}
        />
        <span>操作对象：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 160 }}
          value={queryTarget}
          onChange={setQueryTarget}
          options={targetOptions}
        />
        <span>操作日志：</span>
        <Input
          allowClear
          placeholder="请输入"
          style={{ width: 200 }}
          value={queryMessage}
          onChange={(e) => setQueryMessage(e.target.value)}
        />
        <Button type="primary" onClick={onQuery}>查询</Button>
        <Button onClick={onReset}>重置</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
    </div>
  );
}

