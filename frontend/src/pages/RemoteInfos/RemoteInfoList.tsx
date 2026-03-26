import { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Select, message, Modal, Form, Input, Descriptions, App } from 'antd';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';
import { getRemoteInfos, createRemoteInfo, updateRemoteInfo, deleteRemoteInfo } from '../../api/remoteInfos';
import { getProjects } from '../../api/projects';
import { useAuth } from '../../contexts/AuthContext';

const mdParser = new MarkdownIt({ html: true, breaks: true });

function MdEditorField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const renderHTML = useMemo(() => (text: string) => mdParser.render(text), []);
  return (
    <MdEditor
      value={value ?? ''}
      renderHTML={renderHTML}
      onChange={({ text }) => onChange?.(text ?? '')}
      style={{ height: 280 }}
    />
  );
}

export default function RemoteInfoList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projectIdFilter, setProjectIdFilter] = useState<number | undefined>();
  const [form] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const load = async (pid?: number) => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        getRemoteInfos(pid),
        getProjects(),
      ]);
      setList(Array.isArray(r1.data) ? r1.data : []);
      setProjects(Array.isArray(r2.data) ? r2.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(projectIdFilter);
  }, [projectIdFilter]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    if (projectIdFilter) form.setFieldsValue({ projectId: projectIdFilter });
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const proj = record.project as Record<string, unknown> | undefined;
    form.setFieldsValue({
      projectId: record.projectId ?? proj?.id,
      content: record.content,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editingId != null) {
        await updateRemoteInfo(editingId, { content: v.content, remark: v.remark });
        message.success('更新成功');
      } else {
        await createRemoteInfo(v);
        message.success('创建成功');
      }
      setModalOpen(false);
      load(projectIdFilter);
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteRemoteInfo(id);
        message.success('已删除');
        load(projectIdFilter);
      },
    });
  };

  const columns = [
    { title: '所属项目', dataIndex: ['project', 'name'], key: 'projectName' },
    { title: '内容摘要', dataIndex: 'content', ellipsis: true, render: (t: string) => (t ? String(t).replace(/<[^>]+>/g, '').slice(0, 80) + (String(t).length > 80 ? '...' : '') : '-') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setViewingRecord(record); setViewOpen(true); }}>查看</Button>
          {canEdit() && (
            <>
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
        <h2>远程管理</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增远程信息</Button>}
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
        <Button type="primary" onClick={() => load(projectIdFilter)}>查询</Button>
        <Button onClick={() => setProjectIdFilter(undefined)}>重置</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal
        title={editingId != null ? '编辑远程信息' : '新增远程信息'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select options={projects.map((p) => ({ label: p.name as string, value: p.id as number }))} placeholder="请选择" disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="content" label="内容（Markdown）">
            <MdEditorField />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title="查看远程信息" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={560} destroyOnHidden>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="所属项目">{(viewingRecord.project as Record<string, unknown>)?.name as string ?? ''}</Descriptions.Item>
            <Descriptions.Item label="内容">
              <div
                className="custom-html-style"
                style={{ maxHeight: 400, overflow: 'auto', padding: 12, background: '#f5f5f5', borderRadius: 4 }}
                dangerouslySetInnerHTML={{ __html: mdParser.render(String(viewingRecord.content ?? '')) }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="备注">{String(viewingRecord.remark ?? '')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
