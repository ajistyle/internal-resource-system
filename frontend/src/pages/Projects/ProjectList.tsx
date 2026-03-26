import { useEffect, useState } from 'react';
import { Table, Button, Space, Input, message, Modal, Form, Descriptions, Select, App, Upload, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getProjects, createProject, updateProject, deleteProject } from '../../api/projects';
import { getDictionaries } from '../../api/dictionaries';
import { createProjectModule, deleteProjectModule, getProjectModules, updateProjectModule } from '../../api/projectModules';
import {
  listProjectAttachments,
  uploadProjectAttachment,
  getProjectAttachmentDownloadUrl,
  deleteProjectAttachment,
  PROJECT_ATTACHMENT_CATEGORY_ORIGINAL,
} from '../../api/projectAttachments';
import { useAuth } from '../../contexts/AuthContext';

function formatAttachmentBytes(size: string | number | undefined) {
  const n = typeof size === 'string' ? parseInt(size, 10) : Number(size);
  if (!Number.isFinite(n) || n < 0) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectList() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [moduleList, setModuleList] = useState<Record<string, unknown>[]>([]);
  const [moduleListForView, setModuleListForView] = useState<Record<string, unknown>[]>([]);
  const [moduleUpdatingId, setModuleUpdatingId] = useState<number | null>(null);
  const [moduleEditName, setModuleEditName] = useState('');
  const [moduleEditRemark, setModuleEditRemark] = useState('');
  const [addingNewModuleRow, setAddingNewModuleRow] = useState(false);
  const [newModuleRowName, setNewModuleRowName] = useState('');
  const [newModuleRowRemark, setNewModuleRowRemark] = useState('');
  const [attachmentList, setAttachmentList] = useState<Record<string, unknown>[]>([]);
  const [attachmentListForView, setAttachmentListForView] = useState<Record<string, unknown>[]>([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentViewLoading, setAttachmentViewLoading] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState<{ code: string; name: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ code: string; name: string }[]>([]);
  const [allCityOptions, setAllCityOptions] = useState<{ code: string; name: string }[]>([]);
  const [queryProvince, setQueryProvince] = useState<string | undefined>();
  const [queryCity, setQueryCity] = useState<string | undefined>();
  const [queryName, setQueryName] = useState<string>('');
  const [queryCityOptions, setQueryCityOptions] = useState<{ code: string; name: string }[]>([]);
  const [form] = Form.useForm();
  const { canEdit } = useAuth();
  const { modal } = App.useApp();

  const load = async (province?: string, city?: string, name?: string) => {
    setLoading(true);
    try {
      const params: { province?: string; city?: string; name?: string } = {};
      if (province) params.province = province;
      if (city) params.city = city;
      if (name) params.name = name;
      const { data } = await getProjects(params);
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const onQuery = () => {
    load(queryProvince, queryCity, queryName || undefined);
  };

  const onResetQuery = () => {
    setQueryProvince(undefined);
    setQueryCity(undefined);
    setQueryName('');
    setQueryCityOptions([]);
    load();
  };

  const loadQueryCityOptions = async (provinceCode: string) => {
    try {
      const { data } = await getDictionaries({ type: '地市', parentCode: provinceCode, status: 1 });
      const cities = Array.isArray(data) ? data : [];
      setQueryCityOptions(cities.map((d: Record<string, unknown>) => ({ code: String(d.code ?? ''), name: String(d.name ?? '') })));
    } catch {
      setQueryCityOptions([]);
    }
  };

  const onQueryProvinceChange = (value: string | undefined) => {
    setQueryProvince(value);
    setQueryCity(undefined);
    if (value) {
      loadQueryCityOptions(value);
    } else {
      setQueryCityOptions([]);
    }
  };

  const loadProvinceOptions = async () => {
    try {
      const { data } = await getDictionaries({ type: '省份', status: 1 });
      const provinces = Array.isArray(data) ? data : [];
      setProvinceOptions(provinces.map((d: Record<string, unknown>) => ({ code: String(d.code ?? ''), name: String(d.name ?? '') })));
    } catch {
      setProvinceOptions([]);
    }
  };

  const loadCityOptionsByProvince = async (provinceCode: string) => {
    if (!provinceCode) {
      setCityOptions([]);
      return;
    }
    try {
      const { data } = await getDictionaries({ type: '地市', parentCode: provinceCode, status: 1 });
      const cities = Array.isArray(data) ? data : [];
      setCityOptions(cities.map((d: Record<string, unknown>) => ({ code: String(d.code ?? ''), name: String(d.name ?? '') })));
    } catch {
      setCityOptions([]);
    }
  };

  const loadAllCityOptions = async () => {
    try {
      const { data } = await getDictionaries({ type: '地市', status: 1 });
      const cities = Array.isArray(data) ? data : [];
      setAllCityOptions(cities.map((d: Record<string, unknown>) => ({ code: String(d.code ?? ''), name: String(d.name ?? '') })));
    } catch {
      setAllCityOptions([]);
    }
  };

  useEffect(() => {
    load();
    loadProvinceOptions();
    loadAllCityOptions();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setCityOptions([]);
    setModuleList([]);
    setAttachmentList([]);
    setModalOpen(true);
  };

  const loadProjectAttachments = async (projectId: number) => {
    setAttachmentLoading(true);
    try {
      const { data } = await listProjectAttachments(projectId, PROJECT_ATTACHMENT_CATEGORY_ORIGINAL);
      setAttachmentList(Array.isArray(data) ? data : []);
    } catch {
      setAttachmentList([]);
    } finally {
      setAttachmentLoading(false);
    }
  };

  const loadProjectAttachmentsForView = async (projectId: number) => {
    setAttachmentViewLoading(true);
    try {
      const { data } = await listProjectAttachments(projectId, PROJECT_ATTACHMENT_CATEGORY_ORIGINAL);
      setAttachmentListForView(Array.isArray(data) ? data : []);
    } catch {
      setAttachmentListForView([]);
    } finally {
      setAttachmentViewLoading(false);
    }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    const provinceCode = record.province as string | undefined;
    form.setFieldsValue({
      name: record.name,
      projectLeader: record.projectLeader,
      envLeader: record.envLeader,
      province: provinceCode,
      city: record.city,
      remark: record.remark,
    });
    if (provinceCode) {
      loadCityOptionsByProvince(provinceCode);
    } else {
      setCityOptions([]);
    }
    loadProjectModules(record.id as number);
    loadProjectAttachments(record.id as number);
    setModalOpen(true);
  };

  const loadProjectModules = async (projectId: number) => {
    try {
      const { data } = await getProjectModules(projectId);
      setModuleList(Array.isArray(data) ? data : []);
    } catch {
      setModuleList([]);
    }
  };

  const loadProjectModulesForView = async (projectId: number) => {
    try {
      const { data } = await getProjectModules(projectId);
      setModuleListForView(Array.isArray(data) ? data : []);
    } catch {
      setModuleListForView([]);
    }
  };

  const onProvinceChange = (value: string | undefined) => {
    form.setFieldValue('city', undefined);
    if (value) {
      loadCityOptionsByProvince(value);
    } else {
      setCityOptions([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editingId != null) {
        await updateProject(editingId, v);
        message.success('更新成功');
      } else {
        await createProject(v);
        message.success('创建成功');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if ((e as Error).message) message.error((e as Error).message);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除',
      onOk: async () => {
        await deleteProject(id);
        message.success('已删除');
        load();
      },
    });
  };

  const handleDeleteModule = async (id: number) => {
    modal.confirm({
      title: '确认删除模块？',
      onOk: async () => {
        await deleteProjectModule(id);
        message.success('模块已删除');
        if (editingId != null) await loadProjectModules(editingId);
      },
    });
  };

  const columns = [
    { title: '项目名称', dataIndex: 'name' },
    { title: '项目负责人', dataIndex: 'projectLeader', width: 120, ellipsis: true },
    { title: '环境负责人', dataIndex: 'envLeader', width: 120, ellipsis: true },
    { title: '备注', dataIndex: 'remark', width: 180, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setViewingRecord(record);
              setViewOpen(true);
              loadProjectModulesForView(record.id as number);
              loadProjectAttachmentsForView(record.id as number);
            }}
          >
            查看
          </Button>
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
        <h2>项目信息</h2>
        {canEdit() && <Button type="primary" onClick={openCreate}>新增项目</Button>}
      </div>
      <div className="page-query">
        <span>项目省份：</span>
        <Select
          allowClear
          placeholder="请选择"
          style={{ width: 140 }}
          value={queryProvince}
          onChange={onQueryProvinceChange}
          options={provinceOptions.map((d) => ({ label: d.name, value: d.code }))}
        />
        <span>地市：</span>
        <Select
          allowClear
          placeholder={queryProvince ? '请选择' : '请先选择省份'}
          style={{ width: 140 }}
          value={queryCity}
          onChange={setQueryCity}
          options={queryCityOptions.map((d) => ({ label: d.name, value: d.code }))}
          disabled={!queryProvince}
        />
        <span>项目名称：</span>
        <Input
          placeholder="请输入"
          allowClear
          style={{ width: 160 }}
          value={queryName}
          onChange={(e) => setQueryName(e.target.value)}
        />
        <Button type="primary" onClick={onQuery}>查询</Button>
        <Button onClick={onResetQuery}>重置</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal
        title={editingId != null ? '编辑项目' : '新增项目'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
            基础信息
          </Typography.Title>
          <div style={{ display: 'block' }}>
            <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <Form.Item name="projectLeader" label="项目负责人">
                  <Input />
                </Form.Item>
              </div>
              <div style={{ flex: 1 }}>
                <Form.Item name="envLeader" label="环境负责人">
                  <Input />
                </Form.Item>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <Form.Item name="province" label="所属省份">
                  <Select
                    allowClear
                    placeholder="请选择省份"
                    options={provinceOptions.map((d) => ({ label: d.name, value: d.code }))}
                    onChange={onProvinceChange}
                  />
                </Form.Item>
              </div>
              <div style={{ flex: 1 }}>
                <Form.Item name="city" label="所属地市">
                  <Select
                    allowClear
                    placeholder={cityOptions.length ? '请选择地市' : '请先选择省份'}
                    options={cityOptions.map((d) => ({ label: d.name, value: d.code }))}
                    disabled={!form.getFieldValue('province')}
                  />
                </Form.Item>
              </div>
            </div>

            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} />
            </Form.Item>

            {editingId != null && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    原始附件
                  </Typography.Title>
                  {canEdit() && (
                    <Upload
                      showUploadList={false}
                      disabled={attachmentLoading}
                      customRequest={async (options) => {
                        const { file, onError, onSuccess } = options;
                        try {
                          await uploadProjectAttachment(editingId, file as File, PROJECT_ATTACHMENT_CATEGORY_ORIGINAL);
                          message.success('上传成功');
                          await loadProjectAttachments(editingId);
                          onSuccess?.({});
                        } catch {
                          message.error('上传失败');
                          onError?.(new Error('upload failed'));
                        }
                      }}
                    >
                      <Button size="small" type="primary" icon={<UploadOutlined />} loading={attachmentLoading}>
                        上传
                      </Button>
                    </Upload>
                  )}
                </div>
                <Table
                  rowKey="id"
                  size="small"
                  loading={attachmentLoading}
                  pagination={false}
                  locale={{ emptyText: '暂无附件' }}
                  dataSource={attachmentList}
                  columns={[
                    { title: '文件名', dataIndex: 'originalName', ellipsis: true },
                    {
                      title: '大小',
                      width: 96,
                      render: (_: unknown, r: Record<string, unknown>) => formatAttachmentBytes(r.size as string),
                    },
                    { title: '上传人', dataIndex: 'uploaderName', width: 100, render: (v: string) => v || '-' },
                    {
                      title: '上传时间',
                      dataIndex: 'createdAt',
                      width: 168,
                      render: (v: string) => (v ? String(v).replace('T', ' ').slice(0, 19) : '-'),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 140,
                      render: (_: unknown, r: Record<string, unknown>) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            onClick={async () => {
                              try {
                                const { data: d } = await getProjectAttachmentDownloadUrl(r.id as number);
                                const url = (d as { url?: string })?.url;
                                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                              } catch {
                                message.error('获取下载链接失败');
                              }
                            }}
                          >
                            下载
                          </Button>
                          {canEdit() && (
                            <Button
                              type="link"
                              size="small"
                              danger
                              onClick={() => {
                                modal.confirm({
                                  title: '确认删除该附件？',
                                  onOk: async () => {
                                    await deleteProjectAttachment(r.id as number);
                                    message.success('已删除');
                                    if (editingId != null) await loadProjectAttachments(editingId);
                                  },
                                });
                              }}
                            >
                              删除
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* 模块区域：你要求“项目模块/新增模块”各占一行，这里做成完整区块 */}
            {editingId != null && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>项目模块</h3>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setAddingNewModuleRow(true);
                      setNewModuleRowName('');
                      setNewModuleRowRemark('');
                    }}
                  >
                    新增模块
                  </Button>
                </div>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={
                    addingNewModuleRow
                      ? [...moduleList, { id: 'new-row', isNewRow: true }]
                      : moduleList
                  }
                  columns={[
                    {
                      title: '模块名称',
                      dataIndex: 'moduleName',
                      render: (_: unknown, record: Record<string, unknown>) => {
                        if (record.isNewRow) {
                          return (
                            <Input
                              style={{ width: 220 }}
                              value={newModuleRowName}
                              onChange={(e) => setNewModuleRowName(e.target.value)}
                              placeholder="请输入"
                            />
                          );
                        }
                        return record.moduleName as any;
                      },
                    },
                    {
                      title: '备注',
                      dataIndex: 'remark',
                      ellipsis: true,
                      render: (_: unknown, record: Record<string, unknown>) => {
                        if (record.isNewRow) {
                          return (
                            <Input
                              style={{ width: 240 }}
                              value={newModuleRowRemark}
                              onChange={(e) => setNewModuleRowRemark(e.target.value)}
                              placeholder="请输入"
                            />
                          );
                        }
                        return record.remark as any;
                      },
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_: unknown, record: Record<string, unknown>) => (
                        <Space>
                          {record.isNewRow ? (
                            <Button
                              type="primary"
                              size="small"
                              onClick={async () => {
                                if (!newModuleRowName.trim()) {
                                  message.error('请输入模块名称');
                                  return;
                                }
                                await createProjectModule({
                                  projectId: editingId,
                                  moduleName: newModuleRowName.trim(),
                                  remark: newModuleRowRemark.trim() || undefined,
                                });
                                if (editingId != null) await loadProjectModules(editingId);
                                setAddingNewModuleRow(false);
                                setNewModuleRowName('');
                                setNewModuleRowRemark('');
                                message.success('新增模块成功');
                              }}
                            >
                              保存
                            </Button>
                          ) : (
                            <>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                  setModuleUpdatingId(record.id as number);
                                  setModuleEditName(String(record.moduleName ?? ''));
                                  setModuleEditRemark(String(record.remark ?? ''));
                                }}
                              >
                                编辑
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                danger
                                onClick={() => handleDeleteModule(record.id as number)}
                              >
                                删除
                              </Button>
                            </>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />

                {/* 编辑模块：保持在“新增模块”下方 */}
                {moduleUpdatingId != null && (
                  <div style={{ marginTop: 12, border: '1px solid #f0f0f0', padding: 12, borderRadius: 6 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13 }}>编辑模块</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>模块名称：</span>
                      <Input style={{ width: 220 }} value={moduleEditName} onChange={(e) => setModuleEditName(e.target.value)} />
                      <span>备注：</span>
                      <Input style={{ width: 240 }} value={moduleEditRemark} onChange={(e) => setModuleEditRemark(e.target.value)} />
                      <Button
                        type="primary"
                        onClick={async () => {
                          if (moduleUpdatingId == null) return;
                          await updateProjectModule(moduleUpdatingId, { moduleName: moduleEditName.trim(), remark: moduleEditRemark.trim() || null });
                          await loadProjectModules(editingId);
                          setModuleUpdatingId(null);
                          message.success('模块更新成功');
                        }}
                      >
                        保存
                      </Button>
                      <Button onClick={() => setModuleUpdatingId(null)}>取消</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Form>
      </Modal>
      <Modal title="查看项目" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={640} destroyOnHidden>
        {viewingRecord && (
          <>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              基础信息
            </Typography.Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">{String(viewingRecord.name ?? '')}</Descriptions.Item>
              <Descriptions.Item label="项目负责人">{String(viewingRecord.projectLeader ?? '')}</Descriptions.Item>
              <Descriptions.Item label="环境负责人">{String(viewingRecord.envLeader ?? '')}</Descriptions.Item>
              <Descriptions.Item label="所属省份">
                {provinceOptions.find((d) => d.code === viewingRecord.province)?.name ?? String(viewingRecord.province ?? '')}
              </Descriptions.Item>
              <Descriptions.Item label="所属地市">
                {allCityOptions.find((d) => d.code === viewingRecord.city)?.name ?? String(viewingRecord.city ?? '')}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{String(viewingRecord.remark ?? '')}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {viewOpen && viewingRecord && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>原始附件</h3>
            <Table
              rowKey="id"
              size="small"
              loading={attachmentViewLoading}
              pagination={false}
              locale={{ emptyText: '暂无附件' }}
              dataSource={attachmentListForView}
              columns={[
                { title: '文件名', dataIndex: 'originalName', ellipsis: true },
                {
                  title: '大小',
                  width: 96,
                  render: (_: unknown, r: Record<string, unknown>) => formatAttachmentBytes(r.size as string),
                },
                { title: '上传人', dataIndex: 'uploaderName', width: 100, render: (v: string) => v || '-' },
                {
                  title: '上传时间',
                  dataIndex: 'createdAt',
                  width: 168,
                  render: (v: string) => (v ? String(v).replace('T', ' ').slice(0, 19) : '-'),
                },
                {
                  title: '操作',
                  width: 88,
                  render: (_: unknown, r: Record<string, unknown>) => (
                    <Button
                      type="link"
                      size="small"
                      onClick={async () => {
                        try {
                          const { data: d } = await getProjectAttachmentDownloadUrl(r.id as number);
                          const url = (d as { url?: string })?.url;
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        } catch {
                          message.error('获取下载链接失败');
                        }
                      }}
                    >
                      下载
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        )}

        {viewOpen && viewingRecord && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>项目模块</h3>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '模块名称', dataIndex: 'moduleName' },
                { title: '备注', dataIndex: 'remark', ellipsis: true },
              ]}
              dataSource={moduleListForView}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
