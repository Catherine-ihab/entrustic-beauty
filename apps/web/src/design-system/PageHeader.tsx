import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: Array<{ title: string; href?: string }>;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  extra,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs}
          style={{ marginBottom: 8, fontSize: 12, color: '#64748B' }}
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Space align="center" size={10}>
            <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {title}
            </Title>
            {badge}
          </Space>
          {subtitle && (
            <Text style={{ display: 'block', marginTop: 4, color: '#64748B', fontSize: 14 }}>
              {subtitle}
            </Text>
          )}
        </div>
        {extra && (
          <Space size={12} align="center" style={{ flexWrap: 'wrap' }}>
            {extra}
          </Space>
        )}
      </div>
    </div>
  );
};
