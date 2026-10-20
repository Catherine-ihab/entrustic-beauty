/**
 * TimelineTab — Unified chronological medical history feed.
 * Aggregates visits, conditions, allergies, medications, files,
 * consents, and invoices into a single filterable timeline.
 */
import { useState, useMemo } from 'react';
import {
  Timeline,
  Tag,
  Typography,
  Segmented,
  Skeleton,
  Empty,
  Space,
  Button,
} from 'antd';
import {
  Stethoscope,
  ShieldAlert,
  Activity,
  Pill,
  FolderOpen,
  FileCheck,
  Receipt,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { TimelineEventType, TimelineEvent } from '../api';
import { useTimeline } from '../api';
import { getRegisteredPatients } from '../../../../lib/patientsDirectory';

const { Text, Title } = Typography;

// ─── Colour / icon map per event type ───────────────────────────────────────

const TYPE_CONFIG: Record<
  TimelineEventType,
  { color: string; dot: React.ReactNode; label: string }
> = {
  visit: {
    color: '#2563EB',
    dot: <Stethoscope size={14} color="#2563EB" />,
    label: 'Visits',
  },
  condition: {
    color: '#DC2626',
    dot: <Activity size={14} color="#DC2626" />,
    label: 'Conditions',
  },
  allergy: {
    color: '#EA580C',
    dot: <ShieldAlert size={14} color="#EA580C" />,
    label: 'Allergies',
  },
  medication: {
    color: '#7C3AED',
    dot: <Pill size={14} color="#7C3AED" />,
    label: 'Medications',
  },
  file: {
    color: '#0891B2',
    dot: <FolderOpen size={14} color="#0891B2" />,
    label: 'Files',
  },
  consent: {
    color: '#059669',
    dot: <FileCheck size={14} color="#059669" />,
    label: 'Consents',
  },
  invoice: {
    color: '#D97706',
    dot: <Receipt size={14} color="#D97706" />,
    label: 'Invoices',
  },
};

const TAG_COLOR_MAP: Record<string, string> = {
  green: 'success',
  red: 'error',
  blue: 'processing',
  orange: 'warning',
  volcano: 'orange',
  purple: 'purple',
  default: 'default',
};

// ─── Filter options ───────────────────────────────────────────────────────────

type FilterValue = TimelineEventType | 'all';

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'visit', label: 'Visits' },
  { value: 'condition', label: 'Conditions' },
  { value: 'allergy', label: 'Allergies' },
  { value: 'medication', label: 'Medications' },
  { value: 'file', label: 'Files' },
  { value: 'consent', label: 'Consents' },
  { value: 'invoice', label: 'Invoices' },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface TimelineTabProps {
  patientId: string;
}

export function TimelineTab({ patientId }: TimelineTabProps) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const { data: apiEvents, loading, refetch } = useTimeline(
    patientId,
    filter === 'all' ? undefined : filter,
  );

  // Aggregate local clinical workspace records for this patient
  const localClinicalEvents: TimelineEvent[] = useMemo(() => {
    const list: TimelineEvent[] = [];
    const registered = getRegisteredPatients();
    const patientObj = registered.find((p) => p.id === patientId || p.patientNumber === patientId);
    const pName = patientObj?.name || '';
    const pNum = patientObj?.patientNumber || '';

    const matchesPatient = (item: any) => {
      const name = item.patientName || item.name || '';
      const id = item.patientId || item.patientNumber || '';
      return (
        id === patientId ||
        (pNum && id === pNum) ||
        (pName && name && (name.includes(pName) || pName.includes(name)))
      );
    };

    // 1. Laser Sessions
    try {
      const raw = localStorage.getItem('laser_sessions_history_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.filter(matchesPatient).forEach((ls: any) => {
            list.push({
              id: ls.id,
              type: 'visit',
              timestamp: ls.date || new Date().toISOString(),
              title: `جلسة ليزر: ${ls.bodyArea}`,
              subtitle: `الجهاز: ${ls.device} — عدد النبضات: ${ls.pulsesCount} نبضة (${ls.fluenceJcm2} J/cm²)`,
              description: `الأخصائية: ${ls.practitioner} · التبريد: ${ls.coolingSetting} · ملاحظات: ${ls.notes || 'لا توجد'}`,
              tag: 'ليزر إزالة شعر',
              tagColor: 'volcano',
            });
          });
        }
      }
    } catch (_) {}

    // 2. Injectables / Botox & Filler
    try {
      const raw = localStorage.getItem('injectables_sessions_history_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.filter(matchesPatient).forEach((inj: any) => {
            list.push({
              id: inj.id,
              type: 'visit',
              timestamp: inj.date || new Date().toISOString(),
              title: `حقن تجميلي: ${inj.productName}`,
              subtitle: `المنطقة: ${inj.targetArea} — الجرعة: ${inj.totalDosage} (تشغيلة: ${inj.lotNumber})`,
              description: `الطبيب المعالج: ${inj.practitioner} · تقنية الحقن: ${inj.technique} · ${inj.notes || ''}`,
              tag: inj.category || 'بوتوكس وفيلر',
              tagColor: 'purple',
            });
          });
        }
      }
    } catch (_) {}

    // 3. Skincare & HydraFacial
    try {
      const raw = localStorage.getItem('skincare_sessions_history_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.filter(matchesPatient).forEach((sk: any) => {
            list.push({
              id: sk.id,
              type: 'visit',
              timestamp: sk.date || new Date().toISOString(),
              title: `جلسة عناية بالبشرة: ${sk.bundleOrItemsName}`,
              subtitle: `الماسكات: ${Array.isArray(sk.selectedMasks) ? sk.selectedMasks.join(' + ') : 'ماسك مرطب'}`,
              description: `الأخصائية: ${sk.practitioner} · نتيجة فورية: ${sk.immediateReaction} · ${sk.notes || ''}`,
              tag: 'عناية بالبشرة',
              tagColor: 'green',
            });
          });
        }
      }
    } catch (_) {}

    // 4. Body Care
    try {
      const raw = localStorage.getItem('bodycare_sessions_history_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.filter(matchesPatient).forEach((bc: any) => {
            list.push({
              id: bc.id,
              type: 'visit',
              timestamp: bc.date || new Date().toISOString(),
              title: `عناية بالجسم: ${bc.serviceName}`,
              subtitle: `المنطقة: ${bc.targetAreas} — الفئة: ${bc.category}`,
              description: `الأخصائية: ${bc.practitioner} · ${bc.notes || ''}`,
              tag: 'عناية بالجسم',
              tagColor: 'blue',
            });
          });
        }
      }
    } catch (_) {}

    // 5. Spa & Massage
    try {
      const raw = localStorage.getItem('spa_sessions_history_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.filter(matchesPatient).forEach((sp: any) => {
            list.push({
              id: sp.id,
              type: 'visit',
              timestamp: sp.date || new Date().toISOString(),
              title: `سبا ومساج: ${sp.serviceName}`,
              subtitle: `الجناح: ${sp.roomName} — الفئة: ${sp.category}`,
              description: `المعالجة: ${sp.therapist} · ${sp.notes || ''}`,
              tag: 'سبا ومساج',
              tagColor: 'orange',
            });
          });
        }
      }
    } catch (_) {}

    return list;
  }, [patientId]);

  const events = useMemo(() => {
    const combined = [...localClinicalEvents, ...apiEvents];
    return filter === 'all' ? combined : combined.filter((e) => e.type === filter);
  }, [localClinicalEvents, apiEvents, filter]);

  function formatTimestamp(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const timelineItems = events.map((ev) => {
    const cfg = TYPE_CONFIG[ev.type as TimelineEventType] || TYPE_CONFIG.visit;
    const antTagColor = ev.tagColor ? (TAG_COLOR_MAP[ev.tagColor] ?? ev.tagColor) : undefined;

    return {
      key: ev.id,
      color: cfg.color,
      dot: (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: `${cfg.color}15`,
            border: `1.5px solid ${cfg.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {cfg.dot}
        </div>
      ),
      children: (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #F1F5F9',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 4,
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = 'none')
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: ev.subtitle || ev.description ? 4 : 0,
                }}
              >
                <Text
                  strong
                  style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.4 }}
                >
                  {ev.title}
                </Text>
                {ev.tag && (
                  <Tag
                    color={antTagColor}
                    style={{
                      fontSize: 10,
                      lineHeight: '16px',
                      padding: '0 6px',
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {ev.tag}
                  </Tag>
                )}
              </div>

              {ev.subtitle && (
                <Text
                  style={{
                    fontSize: 12,
                    color: '#64748B',
                    display: 'block',
                    marginBottom: ev.description ? 2 : 0,
                  }}
                >
                  {ev.subtitle}
                </Text>
              )}

              {ev.description && (
                <Text
                  style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}
                >
                  {ev.description}
                </Text>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
              }}
            >
              <Clock size={11} color="#CBD5E1" />
              <Text style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                {formatTimestamp(ev.timestamp)}
              </Text>
            </div>
          </div>
        </div>
      ),
    };
  });

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={5} style={{ margin: 0, color: '#0F172A' }}>
            Medical Timeline
          </Title>
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            Complete chronological history of clinical events
          </Text>
        </div>
        <Button
          size="small"
          icon={<RefreshCw size={13} />}
          onClick={refetch}
          style={{ height: 30, fontSize: 12, color: '#64748B' }}
        >
          Refresh
        </Button>
      </div>

      {/* Filter segmented control */}
      <div style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        <Segmented
          size="small"
          value={filter}
          onChange={(v) => setFilter(v as FilterValue)}
          options={FILTER_OPTIONS.map((o) => ({
            value: o.value,
            label: (
              <Space size={4}>
                {o.value !== 'all' && TYPE_CONFIG[o.value as TimelineEventType].dot}
                <span style={{ fontSize: 12 }}>{o.label}</span>
              </Space>
            ),
          }))}
          style={{ backgroundColor: '#F8FAFC' }}
        />
      </div>

      {/* Timeline or states */}
      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Skeleton.Avatar size={28} active shape="circle" />
              <Skeleton active paragraph={{ rows: 1 }} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>
              {filter === 'all'
                ? 'No clinical events recorded yet'
                : `No ${TYPE_CONFIG[filter as TimelineEventType]?.label ?? filter} events recorded`}
            </Text>
          }
          style={{ padding: '48px 0' }}
        />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>
              {events.length} event{events.length !== 1 ? 's' : ''}
              {filter !== 'all'
                ? ` · ${TYPE_CONFIG[filter as TimelineEventType]?.label ?? filter}`
                : ''}
            </Text>
          </div>
          <Timeline mode="left" items={timelineItems} />
        </>
      )}
    </div>
  );
}
