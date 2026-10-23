import { useState } from 'react';
import {
  Card,
  Progress,
  Button,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  message,
  Space,
  Badge,
  Tooltip,
} from 'antd';
import {
  PlayCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Monitor,
  Calendar,
} from 'lucide-react';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface Session {
  id: string;
  sessionNumber: number;
  date: string;
  deviceUsed?: string;
  notes?: string;
  status: 'completed' | 'missed' | 'upcoming';
  durationMin?: number;
}

export interface SessionCourse {
  id: string;
  patientId: string;
  courseName: string;
  deviceName?: string;
  totalSessions: number;
  pricePerSession: number;
  currency: string;
  sessions: Session[];
  startDate: string;
  notes?: string;
}

const LS_KEY_PREFIX = 'session_course_';

function loadCourses(patientId: string): SessionCourse[] {
  try {
    const raw = localStorage.getItem(`${LS_KEY_PREFIX}${patientId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveCourses(patientId: string, courses: SessionCourse[]) {
  localStorage.setItem(`${LS_KEY_PREFIX}${patientId}`, JSON.stringify(courses));
}

const DEVICE_OPTIONS = [
  'جهاز ليزر CO2',
  'جهاز ليزر Nd:YAG',
  'جهاز RF تردد راديوي',
  'جهاز HIFU',
  'جهاز موجات صوتية (Ultrasound)',
  'جهاز TENS',
  'جهاز مغناطيسي (Magneto)',
  'جهاز IPL',
  'جهاز شمع (Waxing unit)',
  'جهاز ضغط هواء (Pneumatic)',
  'جهاز بخار (Steam)',
  'أخرى',
];

interface SessionCourseCardProps {
  patientId: string;
  clinicType?: string;
}

export function SessionCourseCard({ patientId, clinicType }: SessionCourseCardProps) {
  const [courses, setCourses] = useState<SessionCourse[]>(() => loadCourses(patientId));
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [courseForm] = Form.useForm();
  const [recordSessionOpen, setRecordSessionOpen] = useState<string | null>(null); // courseId
  const [sessionForm] = Form.useForm();

  const update = (next: SessionCourse[]) => {
    setCourses(next);
    saveCourses(patientId, next);
  };

  const handleAddCourse = (vals: any) => {
    const newCourse: SessionCourse = {
      id: `course-${Date.now()}`,
      patientId,
      courseName: vals.courseName,
      deviceName: vals.deviceName,
      totalSessions: vals.totalSessions,
      pricePerSession: vals.pricePerSession || 0,
      currency: vals.currency || 'EGP',
      sessions: [],
      startDate: new Date().toISOString(),
      notes: vals.notes,
    };
    update([...courses, newCourse]);
    setAddCourseOpen(false);
    courseForm.resetFields();
    message.success('تم إضافة الكورس');
  };

  const handleRecordSession = (courseId: string, vals: any) => {
    const next = courses.map((c) => {
      if (c.id !== courseId) return c;
      const attended = c.sessions.filter((s) => s.status === 'completed').length + 1;
      const newSession: Session = {
        id: `sess-${Date.now()}`,
        sessionNumber: attended,
        date: vals.date ? dayjs(vals.date).toISOString() : new Date().toISOString(),
        deviceUsed: vals.deviceUsed || c.deviceName,
        notes: vals.notes,
        status: 'completed',
        durationMin: vals.durationMin || 30,
      };
      return { ...c, sessions: [...c.sessions, newSession] };
    });
    update(next);
    setRecordSessionOpen(null);
    sessionForm.resetFields();
    message.success('تم تسجيل الجلسة');
  };

  const deleteCourse = (id: string) => {
    update(courses.filter((c) => c.id !== id));
    message.success('تم حذف الكورس');
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <Layers size={15} color="#6D28D9" />
          <span style={{ fontWeight: 600, fontSize: 13 }}>كورسات الجلسات</span>
          {courses.length > 0 && (
            <Badge count={courses.length} style={{ backgroundColor: '#6D28D9' }} />
          )}
        </Space>
      }
      extra={
        <Button
          size="small"
          type="primary"
          icon={<Plus size={13} />}
          style={{ borderRadius: 8, fontSize: 11, backgroundColor: '#6D28D9', borderColor: '#6D28D9' }}
          onClick={() => { courseForm.resetFields(); setAddCourseOpen(true); }}
        >
          كورس جديد
        </Button>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B' }}>
          <Layers size={28} color="#CBD5E1" style={{ marginBottom: 8 }} />
          <br />
          <Text style={{ color: '#64748B', fontSize: 12 }}>لا يوجد كورسات — اضغط "كورس جديد"</Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map((course) => {
            const attended = course.sessions.filter((s) => s.status === 'completed').length;
            const remaining = Math.max(0, course.totalSessions - attended);
            const pct = Math.round((attended / course.totalSessions) * 100);
            const isFinished = remaining === 0;

            return (
              <div
                key={course.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isFinished ? '#A7F3D0' : '#E2E8F0'}`,
                  backgroundColor: isFinished ? '#ECFDF5' : '#FAFAFA',
                }}
              >
                {/* Course header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: 13 }}>{course.courseName}</Text>
                      {isFinished ? (
                        <Tag color="success" style={{ fontSize: 10 }}>مكتمل ✓</Tag>
                      ) : (
                        <Tag color="purple" style={{ fontSize: 10 }}>جارٍ</Tag>
                      )}
                    </div>
                    {course.deviceName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Monitor size={11} color="#64748B" />
                        <Text style={{ fontSize: 11, color: '#64748B' }}>{course.deviceName}</Text>
                      </div>
                    )}
                  </div>

                  <Space size={4}>
                    {!isFinished && (
                      <Tooltip title="تسجيل جلسة جديدة">
                        <Button
                          size="small"
                          icon={<PlayCircle size={13} />}
                          style={{ borderRadius: 8, fontSize: 11, backgroundColor: '#EDE9FE', borderColor: '#C4B5FD', color: '#6D28D9' }}
                          onClick={() => { sessionForm.resetFields(); setRecordSessionOpen(course.id); }}
                        >
                          جلسة
                        </Button>
                      </Tooltip>
                    )}
                    <Popconfirm title="حذف الكورس؟" onConfirm={() => deleteCourse(course.id)} okText="نعم" cancelText="لا">
                      <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
                    </Popconfirm>
                  </Space>
                </div>

                {/* Progress */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#6D28D9', lineHeight: 1 }}>{attended}</div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>حضر</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>{remaining}</div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>متبقي</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{course.totalSessions}</div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>إجمالي</div>
                      </div>
                    </div>
                    {course.pricePerSession > 0 && (
                      <div style={{ textAlign: 'end' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#047857' }}>
                          {(attended * course.pricePerSession).toLocaleString()} {course.currency}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>محصّل</div>
                      </div>
                    )}
                  </div>
                  <Progress
                    percent={pct}
                    strokeColor={isFinished ? '#047857' : '#6D28D9'}
                    trailColor="#E2E8F0"
                    showInfo={false}
                    size="small"
                    style={{ margin: 0 }}
                  />
                </div>

                {/* Sessions log */}
                {course.sessions.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {course.sessions.map((sess) => (
                      <Tooltip key={sess.id} title={`${dayjs(sess.date).format('DD/MM/YYYY')} — ${sess.deviceUsed || ''} — ${sess.notes || ''}`}>
                        <Tag
                          icon={<CheckCircle2 size={10} />}
                          color="success"
                          style={{ fontSize: 10, cursor: 'default' }}
                        >
                          #{sess.sessionNumber}
                        </Tag>
                      </Tooltip>
                    ))}
                    {Array.from({ length: remaining }).map((_, i) => (
                      <Tag key={`up-${i}`} icon={<Calendar size={10} />} style={{ fontSize: 10, backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', color: '#64748B' }}>
                        #{attended + i + 1}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Course Modal */}
      <Modal
        title={<Space><Layers size={15} color="#6D28D9" /><span>كورس جلسات جديد</span></Space>}
        open={addCourseOpen}
        onCancel={() => setAddCourseOpen(false)}
        onOk={() => courseForm.submit()}
        okText="إضافة"
        cancelText="إلغاء"
      >
        <Form form={courseForm} layout="vertical" onFinish={handleAddCourse}>
          <Form.Item name="courseName" label="اسم الكورس / الخدمة" rules={[{ required: true }]}>
            <Input placeholder="مثال: كورس ليزر إزالة شعر، جلسات علاج طبيعي..." />
          </Form.Item>
          <Form.Item name="totalSessions" label="عدد الجلسات الإجمالي" rules={[{ required: true }]}>
            <InputNumber min={1} max={50} style={{ width: '100%' }} placeholder="6" />
          </Form.Item>
          <Form.Item name="deviceName" label="الجهاز المستخدم">
            <Select allowClear placeholder="اختر الجهاز" showSearch>
              {DEVICE_OPTIONS.map((d) => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="pricePerSession" label="سعر الجلسة الواحدة (EGP)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="500" />
          </Form.Item>
          <Form.Item name="notes" label="ملاحظات">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Session Modal */}
      <Modal
        title={<Space><PlayCircle size={15} color="#6D28D9" /><span>تسجيل جلسة</span></Space>}
        open={!!recordSessionOpen}
        onCancel={() => setRecordSessionOpen(null)}
        onOk={() => sessionForm.submit()}
        okText="تسجيل"
        cancelText="إلغاء"
      >
        <Form
          form={sessionForm}
          layout="vertical"
          onFinish={(vals) => recordSessionOpen && handleRecordSession(recordSessionOpen, vals)}
        >
          <Form.Item name="deviceUsed" label="الجهاز المستخدم اليوم">
            <Select allowClear placeholder="اختياري">
              {DEVICE_OPTIONS.map((d) => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="durationMin" label="مدة الجلسة (دقيقة)">
            <InputNumber min={5} max={240} style={{ width: '100%' }} defaultValue={30} />
          </Form.Item>
          <Form.Item name="notes" label="ملاحظات الجلسة">
            <Input.TextArea rows={2} placeholder="مثال: استجابة جيدة، لا آثار جانبية..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Hidden clinicType usage to satisfy strict mode */}
      {clinicType && null}
    </Card>
  );
}
