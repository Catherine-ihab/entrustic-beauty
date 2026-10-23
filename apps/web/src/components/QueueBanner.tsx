import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Modal,
  Table,
  Badge,
  Tooltip,
  message,
  Popconfirm,
} from 'antd';
import {
  Clock,
  UserCheck,
  PlayCircle,
  CheckCircle,
  Users,
  ShieldCheck,
  AlertCircle,
  Volume2,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  QueueEntry,
  ServiceCategory,
  getQueue,
  startQueueSession,
  finishQueueSession,
  callQueuePatient,
  subscribeToQueue,
  clearQueue,
  CATEGORY_LABELS,
} from '../lib/clinicQueue';
import { useLang } from '../lib/useLang';

const { Text } = Typography;

interface QueueBannerProps {
  workspaceCategory: ServiceCategory | 'all';
  onSelectPatient?: (patient: QueueEntry) => void;
  practitionerName?: string;
}

export function QueueBanner({
  workspaceCategory,
  onSelectPatient,
  practitionerName = 'د. سارة القاضي',
}: QueueBannerProps) {
  const { tx } = useLang();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // Subscribe to live queue updates
  useEffect(() => {
    const refresh = () => {
      setQueue(getQueue());
    };
    refresh();
    const unsubscribe = subscribeToQueue(refresh);
    return () => unsubscribe();
  }, []);

  // Filter queue for this workspace
  const workspaceQueue = queue.filter((item) =>
    workspaceCategory === 'all' ? true : item.serviceCategory === workspaceCategory
  );

  // Current patient (in-progress)
  const currentPatient = workspaceQueue.find((item) => item.status === 'in-progress');

  // Next patient in line (waiting or calling, ordered chronologically)
  const waitingPatients = workspaceQueue.filter(
    (item) => item.status === 'waiting' || item.status === 'calling'
  );
  const nextPatient = waitingPatients.length > 0 ? waitingPatients[0] : null;

  // Completed count
  const completedCount = workspaceQueue.filter((item) => item.status === 'done').length;

  const handleStartSession = (entry: QueueEntry) => {
    startQueueSession(entry.id, practitionerName);
    message.success(
      tx(
        `تم بدء الجلسة للحالة: ${entry.patientName} (${entry.serviceName})`,
        `Started session for: ${entry.patientName}`
      )
    );
    if (onSelectPatient) {
      onSelectPatient(entry);
    }
  };

  const handleFinishSession = (entry: QueueEntry) => {
    finishQueueSession(entry.id, 'تمت الجلسة بنجاح دون مضاعفات.');
    message.success(
      tx(
        `✅ تم إنهاء الجلسة وتسجيل اكتمالها للحالة: ${entry.patientName}`,
        `Session completed for: ${entry.patientName}`
      )
    );
  };

  const handleCallPatient = (entry: QueueEntry) => {
    callQueuePatient(entry.id);
    message.info(
      tx(
        `📢 تم النداء على الحالة: ${entry.patientName} للتوجه لغرفة الطبيبة`,
        `Called ${entry.patientName} to treatment room`
      )
    );
  };

  return (
    <>
      <Card
        size="small"
        style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #ffffff 100%)',
          border: '1.5px solid #BE123C',
          boxShadow: '0 4px 16px rgba(244, 63, 94, 0.08)',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '14px 18px' }}
      >
        {/* Top live header badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Space size={8}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#be185d',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(190, 24, 93, 0.25)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.4)',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              {tx('طابور الحالات المباشر (متزامن لحظياً مع الاستقبال والـ Cashier)', 'Live Synchronized Queue')}
            </span>

            {workspaceCategory !== 'all' && (
              <Tag color={CATEGORY_LABELS[workspaceCategory]?.color || '#be185d'} style={{ fontWeight: 600 }}>
                {tx(
                  CATEGORY_LABELS[workspaceCategory]?.ar || '',
                  CATEGORY_LABELS[workspaceCategory]?.en || ''
                )}
              </Tag>
            )}

            <Tooltip
              title={tx(
                'النظام تسلسلي ومرن ضد التأخير: في حال تأخر موعد أي جلسة، يظهر المريض التالي تلقائياً بالترتيب دون إغلاق الميعاد أو إلغائه.',
                'Delay-tolerant queue: sessions never auto-close and follow realistic sequence.'
              )}
            >
              <Tag color="cyan" icon={<ShieldCheck size={12} />} style={{ cursor: 'pointer', fontWeight: 600 }}>
                {tx('مرونة التأخير والديلاي مفعلة ✓', 'Delay-Tolerant ✓')}
              </Tag>
            </Tooltip>
          </Space>

          <Space size={10}>
            <Badge count={waitingPatients.length} overflowCount={99} style={{ backgroundColor: '#BE123C' }}>
              <Button
                size="small"
                icon={<Users size={14} />}
                onClick={() => setIsListModalOpen(true)}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  borderColor: '#fda4af',
                  color: '#9f1239',
                }}
              >
                {tx(`عرض قائمة انتظار اليوم (${waitingPatients.length})`, `Today's Queue (${waitingPatients.length})`)}
              </Button>
            </Badge>
          </Space>
        </div>

        {/* Current & Next Split View */}
        <Row gutter={[16, 12]} align="middle">
          {/* Active In-Progress Patient */}
          <Col xs={24} lg={12}>
            <div
              style={{
                backgroundColor: currentPatient ? '#ffffff' : 'rgba(255,255,255,0.7)',
                border: currentPatient ? '1.5px solid #047857' : '1px dashed #cbd5e1',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 74,
              }}
            >
              {currentPatient ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Tag color="success" style={{ fontWeight: 700, margin: 0 }}>
                      {tx('● داخل الغرفة الآن (قيد الجلسة)', '● Currently in Room')}
                    </Tag>
                    {currentPatient.startedAt && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <Clock size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />
                        {tx('بدأت', 'Started')}{' '}
                        {dayjs(currentPatient.startedAt).format('hh:mm A')}
                      </Text>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                    {currentPatient.patientName}{' '}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                      ({currentPatient.patientNumber})
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#be185d', fontWeight: 600 }}>
                    {currentPatient.serviceName}
                    {currentPatient.packageSessionNumber && (
                      <Tag color="magenta" style={{ marginInlineStart: 6, fontSize: 11, fontWeight: 700 }}>
                        {tx(
                          `الجلسة ${currentPatient.packageSessionNumber} من ${currentPatient.packageTotalSessions || 4}`,
                          `Session ${currentPatient.packageSessionNumber}/${currentPatient.packageTotalSessions || 4}`
                        )}
                      </Tag>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} color="#64748B" />
                  <span>{tx('لا توجد حالة داخل غرفة العلاج حالياً — العيادة جاهزة لاستقبال الحالة التالية', 'No patient currently inside room')}</span>
                </div>
              )}

              {currentPatient && (
                <Space>
                  {onSelectPatient && (
                    <Button
                      size="small"
                      onClick={() => onSelectPatient(currentPatient)}
                      style={{ borderRadius: 6, fontWeight: 600 }}
                    >
                      {tx('تعبئة النموذج', 'Fill Form')}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    size="middle"
                    icon={<CheckCircle size={15} />}
                    onClick={() => handleFinishSession(currentPatient)}
                    style={{
                      backgroundColor: '#047857',
                      borderColor: '#047857',
                      fontWeight: 700,
                      borderRadius: 8,
                    }}
                  >
                    {tx('إنهاء الجلسة', 'Finish Session')}
                  </Button>
                </Space>
              )}
            </div>
          </Col>

          {/* Next Up Patient (with Delay Tolerance handling) */}
          <Col xs={24} lg={12}>
            <div
              style={{
                backgroundColor: nextPatient ? '#ffffff' : 'rgba(255,255,255,0.7)',
                border: nextPatient ? '1.5px solid #fda4af' : '1px dashed #cbd5e1',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 74,
              }}
            >
              {nextPatient ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Tag
                      color={nextPatient.status === 'calling' ? 'gold' : 'blue'}
                      style={{ fontWeight: 700, margin: 0 }}
                    >
                      {nextPatient.status === 'calling'
                        ? tx('📢 يتم النداء عليها للغرفة', 'Calling In')
                        : tx('التالي بالدور في الانتظار', 'Next in Line')}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <Clock size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />
                      {tx('الموعد:', 'Scheduled:')} {nextPatient.scheduledTime}
                    </Text>
                    {nextPatient.isPaid ? (
                      <Tag color="green" style={{ fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                        {tx('مسدد بالاستقبال ✓', 'Paid at Desk ✓')}
                      </Tag>
                    ) : (
                      <Tag color="orange" style={{ fontSize: 10 }}>
                        {tx('معلق بالخزينة', 'Pending Payment')}
                      </Tag>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                    {nextPatient.patientName}{' '}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                      ({nextPatient.patientNumber})
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                    {nextPatient.serviceName}
                    {nextPatient.packageSessionNumber && (
                      <span style={{ marginInlineStart: 6, fontWeight: 600, color: '#be185d' }}>
                        {tx(
                          `• باكدج (جلسة ${nextPatient.packageSessionNumber} من ${nextPatient.packageTotalSessions || 4})`,
                          `• Pkg (Sess ${nextPatient.packageSessionNumber}/${nextPatient.packageTotalSessions || 4})`
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="#047857" />
                  <span>{tx('طابور الانتظار فارغ — لا توجد حالات منتظرة حالياً', 'No patients waiting in queue')}</span>
                </div>
              )}

              {nextPatient && (
                <Space size={6}>
                  <Button
                    size="small"
                    icon={<Volume2 size={13} />}
                    onClick={() => handleCallPatient(nextPatient)}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    {tx('نداء', 'Call')}
                  </Button>
                  <Button
                    type="primary"
                    size="middle"
                    icon={<PlayCircle size={15} />}
                    onClick={() => handleStartSession(nextPatient)}
                    style={{
                      backgroundColor: '#be185d',
                      borderColor: '#be185d',
                      fontWeight: 700,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(190, 24, 93, 0.25)',
                    }}
                  >
                    {tx('ابدأ الجلسة', 'Start Session')}
                  </Button>
                </Space>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Full Today Queue Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#be185d" />
            <span style={{ fontWeight: 700 }}>
              {tx(
                `طابور ومواعيد اليوم — ${workspaceCategory === 'all' ? 'جميع العيادات' : CATEGORY_LABELS[workspaceCategory]?.ar}`,
                `Today's Full Queue`
              )}
            </span>
            <Tag color="pink" style={{ fontWeight: 600 }}>
              {tx(`${waitingPatients.length} في الانتظار • ${completedCount} مكتمل`, `${waitingPatients.length} waiting • ${completedCount} done`)}
            </Tag>
          </div>
        }
        open={isListModalOpen}
        onCancel={() => setIsListModalOpen(false)}
        footer={[
          <Popconfirm
            key="clear"
            title={tx('هل تريد تفريغ ومسح طابور اليوم بالكامل للبدء من جديد؟', 'Clear entire queue to start fresh?')}
            onConfirm={() => {
              clearQueue();
              message.success(tx('تم تفريغ طابور اليوم بنجاح!', 'Today queue cleared!'));
            }}
            okText={tx('نعم، تفريغ', 'Yes, clear')}
            cancelText={tx('إلغاء', 'Cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 size={13} />}>
              {tx('تفريغ الطابور كاملاً (للتجربة من الصفر)', 'Clear Queue')}
            </Button>
          </Popconfirm>,
          <Button key="close" type="primary" onClick={() => setIsListModalOpen(false)}>
            {tx('إغلاق', 'Close')}
          </Button>,
        ]}
        width={850}
      >
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} color="#0369A1" />
            <span>
              {tx(
                'الترتيب هنا تسلسلي: الحالة اللي بتدفع في الاستقبال بتسمع فوراً للدكتورة. حتى لو حصل تأخير (ديلاي) 10 أو 20 دقيقة، الترتيب يظل سارياً دون إغلاق الموعد.',
                'Sequential & delay-friendly: Cashier/Reception payments automatically pop up here.'
              )}
            </span>
          </div>
        </div>

        <Table
          dataSource={workspaceQueue}
          rowKey="id"
          pagination={false}
          size="middle"
          columns={[
            {
              title: tx('الحالة والعميلة', 'Patient'),
              key: 'patient',
              render: (_: any, r: QueueEntry) => (
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.patientName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {r.patientNumber} • {r.patientPhone}
                  </Text>
                </div>
              ),
            },
            {
              title: tx('الخدمة / الباكدج المحجوز', 'Service / Package'),
              key: 'service',
              render: (_: any, r: QueueEntry) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{r.serviceName}</div>
                  {r.packageSessionNumber ? (
                    <Tag color="magenta" style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                      {tx(`جلسة ${r.packageSessionNumber} من ${r.packageTotalSessions || 4}`, `Session ${r.packageSessionNumber} of ${r.packageTotalSessions || 4}`)}
                    </Tag>
                  ) : (
                    <Tag color="default" style={{ fontSize: 11, marginTop: 2 }}>
                      {tx('جلسة فردية', 'Single Session')}
                    </Tag>
                  )}
                </div>
              ),
            },
            {
              title: tx('وقت الموعد', 'Scheduled Time'),
              dataIndex: 'scheduledTime',
              key: 'scheduledTime',
              width: 110,
              render: (time: string) => <Tag color="purple" style={{ fontWeight: 600 }}>{time}</Tag>,
            },
            {
              title: tx('الدفع في الخزينة', 'Payment'),
              key: 'payment',
              width: 140,
              render: (_: any, r: QueueEntry) =>
                r.isPaid ? (
                  <Tag color="success" style={{ fontWeight: 600 }}>
                    {tx(`مسدد (${r.paidAmount?.toLocaleString() || 0} ج.م)`, `Paid (${r.paidAmount || 0})`)}
                  </Tag>
                ) : (
                  <Tag color="warning">{tx('معلق بالاستقبال', 'Pending')}</Tag>
                ),
            },
            {
              title: tx('حالة الحضور', 'Status'),
              key: 'status',
              width: 120,
              render: (_: any, r: QueueEntry) => {
                if (r.status === 'in-progress') {
                  return <Tag color="processing" style={{ fontWeight: 700 }}>{tx('في الجلسة الآن', 'In Progress')}</Tag>;
                }
                if (r.status === 'calling') {
                  return <Tag color="gold" style={{ fontWeight: 700 }}>{tx('يتم النداء', 'Calling')}</Tag>;
                }
                if (r.status === 'done') {
                  return <Tag color="green">{tx('اكتملت الجلسة ✓', 'Completed ✓')}</Tag>;
                }
                return <Tag color="blue">{tx('في الانتظار', 'Waiting')}</Tag>;
              },
            },
            {
              title: tx('إجراء الطبيبة', 'Action'),
              key: 'action',
              width: 130,
              render: (_: any, r: QueueEntry) => {
                if (r.status === 'in-progress') {
                  return (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        handleFinishSession(r);
                      }}
                      style={{ backgroundColor: '#047857', borderColor: '#047857', fontWeight: 600 }}
                    >
                      {tx('إنهاء', 'Finish')}
                    </Button>
                  );
                }
                if (r.status === 'done') {
                  return <Text type="secondary" style={{ fontSize: 12 }}>{tx('مكتمل', 'Done')}</Text>;
                }
                return (
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircle size={13} />}
                    onClick={() => {
                      handleStartSession(r);
                      setIsListModalOpen(false);
                    }}
                    style={{ backgroundColor: '#be185d', borderColor: '#be185d', fontWeight: 600 }}
                  >
                    {tx('بدء', 'Start')}
                  </Button>
                );
              },
            },
          ]}
        />
      </Modal>
    </>
  );
}
