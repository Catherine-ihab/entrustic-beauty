import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trendText?: string;
  trendPositive?: boolean;
  subtext?: string;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = '#EFF6FF',
  iconColor = '#2563EB',
  trendText,
  trendPositive = true,
  subtext,
  loading = false,
}) => {
  return (
    <Card
      loading={loading}
      className="elevation-card elevation-hover"
      style={{
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        height: '100%',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
          {title}
        </Text>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: iconBgColor,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 4 }} className="tabular-nums">
        {value}
      </div>

      {(trendText || subtext) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          {trendText && (
            <span
              style={{
                color: trendPositive ? '#059669' : '#DC2626',
                fontWeight: 600,
              }}
            >
              {trendText}
            </span>
          )}
          {subtext && <span style={{ color: '#94A3B8' }}>{subtext}</span>}
        </div>
      )}
    </Card>
  );
};
