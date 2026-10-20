import React from 'react';
import { Typography, Button, Space } from 'antd';
import {
  ShieldAlert,
  Activity,
  Pill,
  FolderOpen,
  Users,
  FileCheck,
  Search,
  Calendar,
  AlertCircle,
  Inbox,
} from 'lucide-react';

const { Title, Text } = Typography;

interface EmptyStateProps {
  icon: React.ReactNode | string;
  title: string;
  description: string;
  // New API (used by patient tabs)
  action?: { label: string; onClick: () => void };
  // Legacy API (backward compat)
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  shield: <ShieldAlert size={26} />,
  activity: <Activity size={26} />,
  pill: <Pill size={26} />,
  folder: <FolderOpen size={26} />,
  users: <Users size={26} />,
  'file-check': <FileCheck size={26} />,
  search: <Search size={26} />,
  calendar: <Calendar size={26} />,
  alert: <AlertCircle size={26} />,
  inbox: <Inbox size={26} />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  actionText,
  onAction,
  actionIcon,
}) => {
  const handleClick = action?.onClick || onAction;
  const label = action?.label || actionText;

  const renderedIcon =
    typeof icon === 'string' ? ICON_MAP[icon] || <Inbox size={26} /> : icon;

  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px dashed #CBD5E1',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {renderedIcon}
      </div>

      <Title level={5} style={{ margin: '0 0 6px 0', color: '#0F172A', fontWeight: 600 }}>
        {title}
      </Title>

      <Text
        style={{
          display: 'block',
          maxWidth: 420,
          margin: '0 auto 20px auto',
          color: '#64748B',
          fontSize: 14,
        }}
      >
        {description}
      </Text>

      {label && handleClick && (
        <Space>
          <Button
            type="primary"
            onClick={handleClick}
            icon={actionIcon}
            style={{ height: 38, paddingInline: 18 }}
          >
            {label}
          </Button>
        </Space>
      )}
    </div>
  );
};
