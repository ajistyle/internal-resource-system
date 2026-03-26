---
name: pageagent-resource-ops
description: Use PageAgentWidget to operate internal-resource-system pages
user-invocable: true
---

# pageagent-resource-ops

用于控制 `internal-resource-system` 前端页面（资源管理系统）的“新增/查询/编辑”等操作。

核心分工：
- OpenClaw/Agent 决策：把用户问题转成结构化字段与一个可执行的“页面操作指令”
- PageAgentWidget（页面内）：根据指令执行页面 UI 操作
- 执行后校验：用页面查询（或必要时用 API 查询）确认落库结果

重要限制：
- 不能依赖在页面端注入 JavaScript；必须通过 agent-browser 对 DOM 元素进行点击/输入/滚动来完成操作。

## 1) 任务协议（由 OpenClaw 解析用户意图后填参）

你需要输出以下结构（给下面的“PageAgent 指令模板”填参）：

```json
{
  "taskId": "uuid",
  "action": "create_server | query_server | update_server",
  "payload": {
    "projectName": "项目名称（用于选择所属项目）",
    "name": "计算资源名称",
    "ip": "IP地址",
    "eip": "EIP(可选)",
    "hostname": "主机名(可选)",
    "osType": "操作系统类型代码(可选)",
    "os": "操作系统代码(可选)",
    "cpuArch": "CPU架构(可选)",
    "cpuModel": "CPU型号(可选)",
    "cpuCores": 4,
    "memory": 16,
    "systemDisk": 80,
    "dataDisk": 200,
    "networkRegion": "网络区域代码(可选)",
    "remark": "备注(可选)",
    "defaultRemoteInfoId": 1,
    "deployItems": [
      { "deployItemId": 1, "remark": "可选部署备注" }
    ]
  }
}
```

## 2) 如何控制 PageAgentWidget（固定动作，给 agent-browser 用）

页面右下角有一个机器人按钮（AI 助手）。PageAgentWidget 已提供可稳定定位的“指令输入区 + 执行按钮”：
- 指令输入框：`data-testid="page-agent-prompt"`
- 执行按钮：`data-testid="page-agent-run"`
- 面板打开/关闭按钮：`data-testid="page-agent-trigger"`

建议执行流程（agent-browser）：
1. 确保当前在资源系统页面（例如“计算资源”页）。
2. 点击右下角 `page-agent-trigger` 打开指令输入面板。
3. 将下面第 3 节生成的“PageAgent 指令模板”粘贴到 `page-agent-prompt`。
4. 点击 `page-agent-run`。
5. 等待页面刷新/弹窗关闭/表格更新完成后进入校验步骤。

## 3) PageAgent 指令模板（由 OpenClaw 用 payload 填参）

### 3.1 create_server（新增计算资源）

把下面模板内容作为“PageAgent 指令”：

> 在页面打开“计算资源”列表；点击“新增计算资源”按钮；在弹窗表单里：
> 1) 选择“所属项目”为 payload.projectName（按名称匹配）
> 2) 填写“计算资源名称”为 payload.name
> 3) 填写“IP地址”为 payload.ip
> 4) 填写/可选填写：EIP=payload.eip、主机名=payload.hostname
> 5) 选择“操作系统类型”为 payload.osType（如果有）；选择“操作系统”为 payload.os（如果有）
> 6) 填写：CPU架构=payload.cpuArch、CPU型号=payload.cpuModel
> 7) 填写：CPU核数(C)=payload.cpuCores、内存(GB)=payload.memory、系统盘(GB)=payload.systemDisk、数据盘(GB)=payload.dataDisk
> 8) 选择/可选填写“网络区域”为 payload.networkRegion
> 9) 选择“远程方式”为 payload.defaultRemoteInfoId（如需要且有）
> 10) “部署软件”区域：点击“+ 添加部署软件”，选择第一个条目的 deployItemId=payload.deployItems[0].deployItemId（或用名称匹配）
> 11) 可选填写：每个部署软件条目的备注为 payload.deployItems[0].remark
> 12) 点击弹窗的提交/确定按钮以创建
> 创建完成后等待列表刷新（表格出现对应记录）。

### 3.2 query_server（查询计算资源）

> 在页面“计算资源”列表中，使用筛选条件：
> - 如 payload.ip 存在：在“IP地址”输入框填 payload.ip，并点击“查询”
> - 如 payload.projectName 存在：在“所属项目”下拉选择 payload.projectName
> 最终返回表格中匹配的那一行（至少包含 name、ip）。

### 3.3 update_server（编辑计算资源）

> 在页面“计算资源”列表中，筛选找到 payload.ip 对应的那条记录；点击该行的“编辑”；在弹窗中把字段更新为 payload.*（同 create_server 填写规则）；点击提交/确定；等待列表刷新，并确保该行的新值可在列表/详情中看到。

## 4) 执行后校验（必须做，避免“看起来成功但未落库”）

对于 `create_server` / `update_server`：
1. 进入“计算资源”列表页
2. 在“IP地址”输入 payload.ip，点“查询”
3. 确认表格中出现：
   - IP 等于 payload.ip
   - 计算资源名称为 payload.name（若 payload.name 提供）
4. 若确认失败，返回错误证据：
   - 表格当前筛选条件
   - 页面上的错误提示/弹窗是否存在
   - 最近一次提交按钮点击后的页面状态

对于 `query_server`：
1. 直接以表格中匹配行作为返回依据

