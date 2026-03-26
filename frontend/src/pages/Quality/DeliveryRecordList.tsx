import { Card, Typography } from 'antd';

export default function DeliveryRecordList() {
  return (
    <Card>
      <div className="page-header">
        <h2>交付记录</h2>
      </div>
      <Typography.Text type="secondary">
        该功能暂未接入 Jenkins。可与发布记录复用同一接口或仅做占位。
      </Typography.Text>
    </Card>
  );
}

