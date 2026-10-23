import React from 'react';

export type StatusType =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'active'
  | 'inactive'
  | 'archived'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'finalized'
  | 'amended';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfigMap: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  // Appointments
  scheduled: { label: 'Scheduled', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  confirmed: { label: 'Confirmed', bg: '#F0FDF4', color: '#047857', border: '#BBF7D0' },
  in_progress: { label: 'In Progress', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  completed: { label: 'Completed', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  no_show: { label: 'No Show', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },

  // Generic / Patient / Staff
  active: { label: 'Active', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  inactive: { label: 'Inactive', bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  archived: { label: 'Archived', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },

  // Invoices
  draft: { label: 'Draft', bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
  issued: { label: 'Issued', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  partially_paid: { label: 'Partially Paid', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  paid: { label: 'Paid', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  overdue: { label: 'Overdue', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },

  // Clinical Records
  finalized: { label: 'Finalized', bg: '#F0FDF4', color: '#047857', border: '#BBF7D0' },
  amended: { label: 'Amended', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const normalizedKey = (status || '').toLowerCase().trim();
  const config = statusConfigMap[normalizedKey] || {
    label: status || 'Unknown',
    bg: '#F1F5F9',
    color: '#475569',
    border: '#E2E8F0',
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: 9999,
        fontSize: isSmall ? 11 : 12,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        lineHeight: 1.3,
        letterSpacing: '0.01em',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.color,
          marginInlineEnd: 6,
          display: 'inline-block',
        }}
      />
      {label || config.label}
    </span>
  );
};
