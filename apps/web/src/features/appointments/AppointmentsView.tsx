import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Tag,
  Typography,
  Input,
  InputNumber,
  Space,
  Select,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  message,
  Popconfirm,
  Avatar,
  Card,
  Row,
  Col,
  Segmented,
  Calendar,
  Alert,
  Checkbox,
  Empty,
} from 'antd';
import {
  CalendarPlus,
  Search,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  AlarmClock,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
  ListFilter,
  MessageSquare,
  Settings,
  Plus,
  Columns,
  LayoutGrid,
  ShieldAlert,
  RefreshCw,
  Cpu,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../lib/api-client';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';
import { getClinicPackages, ClinicPackage, subscribeToPackages } from '../../lib/packagesDirectory';
import { addToQueue, detectServiceCategory } from '../../lib/clinicQueue';
import { recordDoctorSessionEarning } from '../../lib/doctorEarnings';

const { Title, Text } = Typography;

export type QueueStatus = 'waiting' | 'in_doctor' | 'completed' | 'cancelled';

export interface ClinicAppointment {
  id: string;
  name: string;
  phone: string;
  patientNumber: string;
  serviceCategory: 'ليزر وإزالة شعر' | 'بوتوكس وفيلر' | 'عناية بالبشرة وهيدرافيشل' | 'سبا ومساج' | 'عناية بالجسم وسكراب' | 'كشف واستشارة';
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  doctor: string;
  room: string;
  deviceId?: string;
  deviceName?: string;
  priceEgp: number;
  status: QueueStatus;
  notes?: string;
}

export const CLINIC_ROOMS = [
  { id: 'room-1', name: 'غرفة ليزر 1 (كانديلا)', type: 'laser' },
  { id: 'room-2', name: 'غرفة ليزر 2 (ديكا)', type: 'laser' },
  { id: 'room-3', name: 'عيادة الحقن والتجميل', type: 'injectable' },
  { id: 'room-4', name: 'جناح العناية بالبشرة والهيدرافيشل', type: 'skincare' },
  { id: 'room-5', name: 'جناح الحمام المغربي والسبا', type: 'spa' },
  { id: 'room-6', name: 'غرفة العناية بالجسم والسنفرة', type: 'bodycare' },
];

export const CLINIC_SHARED_DEVICES = [
  { id: 'candela_pro', name: 'كانديلا جنتل ماكس برو بلس (Candela Pro Plus)', type: 'laser' },
  { id: 'hydrafacial_syndeo', name: 'هيدرافيشل إيليت إم دي سينديو (Hydrafacial Syndeo)', type: 'skincare' },
  { id: 'deka_again', name: 'ديكا أجين ليزر (Deka Again Laser)', type: 'laser' },
  { id: 'dermapen_4', name: 'ديرمابن 4 ميكرونيدلينج (Dermapen 4)', type: 'derma' },
  { id: 'skin_analyzer', name: 'جهاز فحص وتحليل البشرة الرقمي (Visia Skin Analyzer)', type: 'diagnostics' },
];

export interface DoctorSchedule {
  id: string;
  name: string;
  roleTitle: string;
  specialtyCategory: string;
  room: string;
  color: string;
  offDays: number[]; // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
  offDates?: string[]; // specific dates like YYYY-MM-DD
}

export const DAYS_OF_WEEK = [
  { id: 6, nameAr: 'السبت' },
  { id: 0, nameAr: 'الأحد' },
  { id: 1, nameAr: 'الاثنين' },
  { id: 2, nameAr: 'الثلاثاء' },
  { id: 3, nameAr: 'الأربعاء' },
  { id: 4, nameAr: 'الخميس' },
  { id: 5, nameAr: 'الجمعة' },
];

const INITIAL_DOCTORS: DoctorSchedule[] = [
  {
    id: 'doc-1',
    name: 'د. سارة القاضي',
    roleTitle: 'استشارية الجلدية والطب التجميلي والليزر',
    specialtyCategory: 'ليزر وإزالة شعر',
    room: 'غرفة ليزر 1',
    color: '#be185d',
    offDays: [0, 5], // إجازة الأحد والجمعة
    offDates: [],
  },
  {
    id: 'doc-2',
    name: 'د. هبة رمضان',
    roleTitle: 'استشارية جراحة التجميل وحقن الفيلر والبوتوكس',
    specialtyCategory: 'بوتوكس وفيلر',
    room: 'عيادة الحقن والتجميل',
    color: '#0369A1',
    offDays: [4, 5], // إجازة الخميس والجمعة
    offDates: [],
  },
  {
    id: 'doc-3',
    name: 'أخصائية البشرة ندى',
    roleTitle: 'أخصائية العناية بالبشرة وتنظيف الهيدرافيشل',
    specialtyCategory: 'عناية بالبشرة وهيدرافيشل',
    room: 'غرفة العناية بالبشرة',
    color: '#047857',
    offDays: [5], // إجازة الجمعة
    offDates: [],
  },
  {
    id: 'doc-4',
    name: 'أخصائية السبا فاطمة',
    roleTitle: 'كبيرة معالجات السبا والحمام المغربي',
    specialtyCategory: 'سبا ومساج',
    room: 'جناح الحمام المغربي 1',
    color: '#B45309',
    offDays: [1], // إجازة الاثنين
    offDates: [],
  },
  {
    id: 'doc-5',
    name: 'أخصائية الجسم مريم',
    roleTitle: 'أخصائية سنفرة وعناية بالجسم وتفتيح البشرة',
    specialtyCategory: 'عناية بالجسم وسكراب',
    room: 'غرفة العناية بالجسم',
    color: '#6D28D9',
    offDays: [3], // إجازة الأربعاء
    offDates: [],
  },
];

const STATUS_CONFIG: Record<QueueStatus, { labelAr: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  waiting: {
    labelAr: 'في الانتظار',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: <AlarmClock size={14} />,
  },
  in_doctor: {
    labelAr: 'قيد الجلسة والكشف',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: <Loader2 size={14} />,
  },
  completed: {
    labelAr: 'تمت الجلسة',
    color: '#047857',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    icon: <CheckCircle2 size={14} />,
  },
  cancelled: {
    labelAr: 'ملغي',
    color: '#B91C1C',
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: <XCircle size={14} />,
  },
};

const STATUS_ORDER: QueueStatus[] = ['waiting', 'in_doctor', 'completed', 'cancelled'];

const INITIAL_APPOINTMENTS: ClinicAppointment[] = [
  {
    id: 'apt-1',
    name: 'منة الله سيد أحمد',
    phone: '01012345678',
    patientNumber: 'PAT-00001',
    serviceCategory: 'ليزر وإزالة شعر',
    serviceName: 'جلسة ليزر كانديلا كامل الجسم',
    date: dayjs().format('YYYY-MM-DD'),
    time: '10:00',
    doctor: 'د. سارة القاضي',
    room: 'غرفة ليزر 1 (كانديلا)',
    deviceId: 'candela_pro',
    deviceName: 'كانديلا جنتل ماكس برو بلس (Candela Pro Plus)',
    priceEgp: 1800,
    status: 'completed',
  },
  {
    id: 'apt-2',
    name: 'سارة علي السيد',
    phone: '01098765432',
    patientNumber: 'PAT-00002',
    serviceCategory: 'بوتوكس وفيلر',
    serviceName: 'حقن بوتوكس جبهة وجلابيلا',
    date: dayjs().format('YYYY-MM-DD'),
    time: '11:00',
    doctor: 'د. هبة رمضان',
    room: 'عيادة الحقن والتجميل',
    priceEgp: 3500,
    status: 'in_doctor',
  },
  {
    id: 'apt-3',
    name: 'نورهان خالد',
    phone: '01234567890',
    patientNumber: 'PAT-00003',
    serviceCategory: 'عناية بالبشرة وهيدرافيشل',
    serviceName: 'تنظيف عميق هيدرافيشل Syndeo',
    date: dayjs().format('YYYY-MM-DD'),
    time: '12:00',
    doctor: 'أخصائية البشرة ندى',
    room: 'جناح العناية بالبشرة والهيدرافيشل',
    deviceId: 'hydrafacial_syndeo',
    deviceName: 'هيدرافيشل إيليت إم دي سينديو (Hydrafacial Syndeo)',
    priceEgp: 1500,
    status: 'waiting',
  },
  {
    id: 'apt-4',
    name: 'فريدة صبري',
    phone: '01155566677',
    patientNumber: 'PAT-00004',
    serviceCategory: 'سبا ومساج',
    serviceName: 'حمام مغربي ملكي بالأعشاب',
    date: dayjs().format('YYYY-MM-DD'),
    time: '14:00',
    doctor: 'أخصائية السبا فاطمة',
    room: 'جناح الحمام المغربي 1',
    priceEgp: 950,
    status: 'waiting',
  },
  {
    id: 'apt-5',
    name: 'مها الشريف',
    phone: '01599887766',
    patientNumber: 'PAT-00005',
    serviceCategory: 'عناية بالجسم وسكراب',
    serviceName: 'سكراب القهوة العضوية وزبدة الشيا',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    time: '11:30',
    doctor: 'أخصائية الجسم مريم',
    room: 'غرفة العناية بالجسم',
    priceEgp: 550,
    status: 'waiting',
  },
  {
    id: 'apt-6',
    name: 'ريم عبد العزيز',
    phone: '01055443322',
    patientNumber: 'PAT-00006',
    serviceCategory: 'ليزر وإزالة شعر',
    serviceName: 'جلسة ليزر بكيني وتحت الإبط',
    date: dayjs().format('YYYY-MM-DD'),
    time: '12:00',
    doctor: 'د. سارة القاضي',
    room: 'غرفة ليزر 1',
    priceEgp: 650,
    status: 'in_doctor',
  },
  {
    id: 'apt-7',
    name: 'منى الشافعي',
    phone: '01222334455',
    patientNumber: 'PAT-00007',
    serviceCategory: 'ليزر وإزالة شعر',
    serviceName: 'جلسة رتوش ليزر وجه كامل',
    date: dayjs().format('YYYY-MM-DD'),
    time: '12:45',
    doctor: 'د. سارة القاضي',
    room: 'غرفة ليزر 1',
    priceEgp: 450,
    status: 'waiting',
  },
];

const LS_APPOINTMENTS = 'clinic_appointments_unified_v3';
const LS_DOCTORS = 'clinic_doctors_profiles_v3';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<ClinicAppointment[]>(() => {
    try {
      const raw = localStorage.getItem(LS_APPOINTMENTS);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return INITIAL_APPOINTMENTS;
  });

  const [doctors, setDoctors] = useState<DoctorSchedule[]>(() => {
    try {
      const raw = localStorage.getItem(LS_DOCTORS);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return INITIAL_DOCTORS;
  });

  const [activeTab, setActiveTab] = useState<'today_queue' | 'calendar' | 'all_list' | 'room_device_matrix'>('today_queue');
  const [queueMode, setQueueMode] = useState<'doctor_focused' | 'multi_lanes'>('doctor_focused');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  // Conflict calculation for Rooms and Shared Devices
  const matrixConflicts = useMemo(() => {
    const list = appointments.filter((a) => a.date === selectedDate && a.status !== 'cancelled');
    const warnings: string[] = [];

    // Room conflicts
    const roomMap = new Map<string, ClinicAppointment[]>();
    list.forEach((a) => {
      const key = `${a.room}__${a.time}`;
      if (!roomMap.has(key)) roomMap.set(key, []);
      roomMap.get(key)!.push(a);
    });
    roomMap.forEach((appts, key) => {
      if (appts.length > 1) {
        const [rName, t] = key.split('__');
        warnings.push(`تعارض بالغرفة [${rName}] في توقيت ${t} بين [${appts.map((x) => x.name).join(' و ')}]`);
      }
    });

    // Device conflicts
    const devMap = new Map<string, ClinicAppointment[]>();
    list.forEach((a) => {
      if (a.deviceId) {
        const key = `${a.deviceId}__${a.time}`;
        if (!devMap.has(key)) devMap.set(key, []);
        devMap.get(key)!.push(a);
      }
    });
    devMap.forEach((appts, key) => {
      if (appts.length > 1) {
        const [, t] = key.split('__');
        const devTitle = appts[0].deviceName || 'جهاز مشترك';
        warnings.push(`تعارض بالجهاز [${devTitle}] في توقيت ${t} بين الطبيبات [${appts.map((x) => x.doctor).join(' و ')}]`);
      }
    });

    return warnings;
  }, [appointments, selectedDate]);

  // Modals & Connected Directories
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);
  const [clinicPackages, setClinicPackages] = useState<ClinicPackage[]>(getClinicPackages);
  const [isManualPatient, setIsManualPatient] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPackages(() => {
      setClinicPackages(getClinicPackages());
    });
    return () => unsub();
  }, []);

  const [apptLoading, setApptLoading] = useState(false);

  const fetchAppointmentsFromApi = async () => {
    try {
      setApptLoading(true);
      const res: any = await apiClient.get('/appointments');
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      if (list.length > 0) {
        const mapped: ClinicAppointment[] = list.map((a: any) => {
          const pName = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.trim() || 'Patient';
          const sName = a.service?.name || a.notes || 'استشارة عامة';
          const category = detectServiceCategory(sName);
          const docName = a.provider
            ? `د. ${a.provider.first_name} ${a.provider.last_name || ''}`.trim()
            : 'د. سارة القاضي';

          let qStatus: QueueStatus = 'waiting';
          if (a.status === 'completed') qStatus = 'completed';
          else if (a.status === 'in_progress') qStatus = 'in_doctor';
          else if (a.status === 'cancelled') qStatus = 'cancelled';

          return {
            id: a.id,
            name: pName,
            phone: a.patient?.phone || '',
            patientNumber: a.patient?.patient_number || '',
            serviceCategory: category,
            serviceName: sName,
            date: dayjs(a.start_time).format('YYYY-MM-DD'),
            time: dayjs(a.start_time).format('HH:mm'),
            doctor: docName,
            room: a.room_code || 'غرفة 1',
            priceEgp: Number(a.service?.current_price || 0),
            status: qStatus,
            notes: a.notes || '',
          };
        });

        setAppointments((prev) => {
          const serverIds = new Set(mapped.map((m) => m.id));
          const localAppts = prev.filter((a) => a.id.startsWith('apt-') && !serverIds.has(a.id));
          const combined = [...mapped, ...localAppts];
          try {
            localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(combined));
          } catch (_) {}
          return combined;
        });
      }
    } catch (err) {
      console.warn('Could not load appointments from server:', err);
    } finally {
      setApptLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsFromApi();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingAppt, setSavingAppt] = useState(false);
  const [editingAppt, setEditingAppt] = useState<ClinicAppointment | null>(null);
  const [form] = Form.useForm();

  // Watch doctor & date in modal for immediate secretary warning
  const [modalDoctor, setModalDoctor] = useState<string>('د. سارة القاضي');
  const [modalDate, setModalDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  // Doctors & Holidays Management Modal
  const [isDoctorsModalOpen, setIsDoctorsModalOpen] = useState(false);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [doctorForm] = Form.useForm();

  const saveAppointments = (next: ClinicAppointment[]) => {
    setAppointments(next);
    localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(next));
  };

  const saveDoctors = (next: DoctorSchedule[]) => {
    setDoctors(next);
    localStorage.setItem(LS_DOCTORS, JSON.stringify(next));
  };

  const sendApptToQueue = (appt: ClinicAppointment) => {
    const category = detectServiceCategory(appt.serviceName || appt.serviceCategory);
    addToQueue({
      patientId: appt.patientNumber || appt.id,
      patientName: appt.name,
      patientPhone: appt.phone,
      patientNumber: appt.patientNumber,
      serviceName: appt.serviceName || appt.serviceCategory,
      serviceCategory: category,
      scheduledTime: appt.time,
      isPaid: false,
      totalAmount: appt.priceEgp || 0,
      paidAmount: 0,
      status: 'waiting',
    });
    message.success(`🚀 تم إرسال الحالة [${appt.name}] مباشرة لطابور عيادة [${appt.doctor}]`);
  };

  const changeStatus = (id: string, newStatus: QueueStatus) => {
    const next = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    saveAppointments(next);
    message.success('تم تحديث حالة الموعد');

    // Automatically record doctor commission when appointment is marked completed
    if (newStatus === 'completed') {
      const appt = appointments.find((a) => a.id === id);
      if (appt) {
        recordDoctorSessionEarning({
          sessionRefId: appt.id,
          doctorName: appt.doctor,
          patientName: appt.name,
          patientId: appt.patientNumber,
          serviceName: appt.serviceName,
          serviceCategory: appt.serviceCategory,
          servicePriceEgp: appt.priceEgp || 1200,
          date: appt.date,
          time: appt.time,
          notes: `${appt.room}${appt.deviceName ? ` — ${appt.deviceName}` : ''}`,
        });
      }
    }

    if (id.length > 20 && !id.startsWith('apt-')) {
      const apiStatus = newStatus === 'completed' ? 'completed' : newStatus === 'in_doctor' ? 'in_progress' : newStatus === 'cancelled' ? 'cancelled' : 'scheduled';
      apiClient.patch(`/appointments/${id}`, { status: apiStatus }).catch(() => {});
    }
  };

  const handleDelete = (id: string) => {
    const next = appointments.filter((a) => a.id !== id);
    saveAppointments(next);
    message.success('تم حذف الموعد');
    if (id.length > 20 && !id.startsWith('apt-')) {
      apiClient.delete(`/appointments/${id}`).catch(() => {});
    }
  };

  // Helper: check if a doctor is off on a specific date
  const checkDoctorOff = (docName: string, dateStr: string): { isOff: boolean; reason: string; offDayName: string; availableDays: string } => {
    const doc = doctors.find((d) => d.name === docName);
    if (!doc || !dateStr) return { isOff: false, reason: '', offDayName: '', availableDays: '' };

    const d = dayjs(dateStr);
    const dayIndex = d.day();
    const dayName = DAYS_OF_WEEK.find((x) => x.id === dayIndex)?.nameAr || '';

    const availableDaysList = DAYS_OF_WEEK.filter((w) => !doc.offDays.includes(w.id))
      .map((w) => w.nameAr)
      .join('، ');

    if (doc.offDays.includes(dayIndex)) {
      return {
        isOff: true,
        reason: `يوم (${dayName}) هو يوم إجازة أسبوعية رسمية للدكتورة ${doc.name}.`,
        offDayName: dayName,
        availableDays: availableDaysList,
      };
    }

    if (doc.offDates && doc.offDates.includes(dateStr)) {
      return {
        isOff: true,
        reason: `تاريخ ${dateStr} مسجل كإجازة سنوية / استثنائية للدكتورة ${doc.name}.`,
        offDayName: dayName,
        availableDays: availableDaysList,
      };
    }

    return { isOff: false, reason: '', offDayName: '', availableDays: availableDaysList };
  };

  const handleOpenAdd = (presetDoctor?: string) => {
    setEditingAppt(null);
    form.resetFields();
    const initialDoc = presetDoctor || (selectedDoctorFilter !== 'all' ? selectedDoctorFilter : doctors[0]?.name || 'د. سارة القاضي');
    const initialDate = selectedDate || dayjs().format('YYYY-MM-DD');

    setModalDoctor(initialDoc);
    setModalDate(initialDate);

    const docObj = doctors.find((d) => d.name === initialDoc);

    form.setFieldsValue({
      doctor: initialDoc,
      date: dayjs(initialDate),
      time: dayjs('10:00', 'HH:mm'),
      serviceCategory: (docObj?.specialtyCategory as any) || 'ليزر وإزالة شعر',
      room: docObj?.room || 'غرفة ليزر 1',
      status: 'waiting',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (appt: ClinicAppointment) => {
    setEditingAppt(appt);
    setModalDoctor(appt.doctor);
    setModalDate(appt.date);
    form.setFieldsValue({
      ...appt,
      date: dayjs(appt.date),
      time: dayjs(appt.time, 'HH:mm'),
    });
    setIsModalOpen(true);
  };

  const handleSaveAppointment = (values: any) => {
    const dateStr = values.date ? dayjs(values.date).format('YYYY-MM-DD') : selectedDate;
    const timeStr = values.time ? dayjs(values.time).format('HH:mm') : '10:00';
    const chosenDoctor = values.doctor || modalDoctor;

    // Strict validation to prevent secretary booking on doctor off-day
    const offCheck = checkDoctorOff(chosenDoctor, dateStr);
    if (offCheck.isOff) {
      Modal.confirm({
        title: '⚠️ تنبيه: اليوم المحدد إجازة رسمية للطبيبة!',
        content: `${offCheck.reason}\nأيام العمل المتاحة للدكتورة هي: [${offCheck.availableDays}].\n\nهل ترغبين بالتأكيد كحجز استثنائي طارئ أم إلغاء الحجز وتغيير اليوم؟`,
        okText: 'تأكيد الحجز الاستثنائي',
        cancelText: 'الرجوع لتغيير اليوم',
        okButtonProps: { danger: true },
        onOk: () => {
          proceedSave(values, dateStr, timeStr);
        },
      });
      return;
    }

    // Check doctor, room, or shared device time slot collision
    const docObj = doctors.find((d) => d.name === chosenDoctor);
    const targetRoom = values.room || docObj?.room || "غرفة ليزر 1 (كانديلا)";
    const targetDeviceId = values.deviceId;

    const conflict = appointments.find(
      (a) =>
        a.id !== editingAppt?.id &&
        a.date === dateStr &&
        a.time === timeStr &&
        a.status !== "cancelled" &&
        (a.doctor === chosenDoctor || a.room === targetRoom || (targetDeviceId && a.deviceId === targetDeviceId))
    );

    if (conflict) {
      const conflictMsg = (targetDeviceId && conflict.deviceId === targetDeviceId)
        ? `الجهاز المشترك [${conflict.deviceName || "جهاز الجلسة"}] محجوز بالفعل في هذا التوقيت (${timeStr})!`
        : conflict.room === targetRoom
        ? `الغرفة [${targetRoom}] محجوزة بالفعل في هذا التوقيت (${timeStr})!`
        : `الطبيبة [${conflict.doctor}] لديها موعد آخر مسجل في نفس التوقيت (${timeStr})!`;

      Modal.confirm({
        title: "⚠️ تنبيه: تعارض في حجز الغرفة أو الجهاز المشترك!",
        content: `${conflictMsg}\nالحجز الحالي مسجل للدكتورة [${conflict.doctor}] للمريضة: ${conflict.name} (${conflict.serviceName}).\n\nهل ترغبين بالتأكيد وتجاوز التعارض كحجز استثنائي أم الرجوع لتعديل الحجز؟`,
        okText: "تأكيد الحجز الاستثنائي",
        cancelText: "الرجوع لتعديل الحجز",
        okButtonProps: { danger: true },
        onOk: () => {
          proceedSave(values, dateStr, timeStr);
        },
      });
      return;
    }

    proceedSave(values, dateStr, timeStr);
  };

  const proceedSave = (values: any, dateStr: string, timeStr: string) => {
    setSavingAppt(true);
    try {
    const docObj = doctors.find((d) => d.name === values.doctor);
    const devObj = CLINIC_SHARED_DEVICES.find((d) => d.id === values.deviceId);
    const resolvedDeviceName = values.deviceName || devObj?.name || undefined;

    if (editingAppt) {
      const next = appointments.map((a) =>
        a.id === editingAppt.id
          ? {
              ...a,
              ...values,
              room: values.room || docObj?.room || a.room,
              deviceId: values.deviceId,
              deviceName: resolvedDeviceName,
              date: dateStr,
              time: timeStr,
            }
          : a
      );
      saveAppointments(next);
      message.success("تم تعديل بيانات الحجز وتحديث تخصيص الغرفة والجهاز");
    } else {
      const newAppt: ClinicAppointment = {
        id: `apt-${Date.now()}`,
        name: values.name,
        phone: values.phone || "",
        patientNumber: values.patientNumber || `PAT-00${Math.floor(Math.random() * 900) + 100}`,
        serviceCategory: values.serviceCategory,
        serviceName: values.serviceName || values.serviceCategory,
        date: dateStr,
        time: timeStr,
        doctor: values.doctor || "د. سارة القاضي",
        room: values.room || docObj?.room || "غرفة ليزر 1 (كانديلا)",
        deviceId: values.deviceId,
        deviceName: resolvedDeviceName,
        priceEgp: values.priceEgp || 0,
        status: values.status || "waiting",
        notes: values.notes || "",
      };
      saveAppointments([newAppt, ...appointments]);
      message.success(`تم حجز موعد جديد للحالة: ${newAppt.name} مع ${newAppt.doctor} في [${newAppt.room}]`);
    }
    setIsModalOpen(false);
    form.resetFields();
    } finally {
      setSavingAppt(false);
    }
  };
  // WhatsApp contextual generator
  const sendWhatsAppReminder = (appt: ClinicAppointment) => {
    const phone = appt.phone.replace(/\D/g, '');
    if (!phone) {
      message.warning('رقم هاتف الحالة غير مسجل!');
      return;
    }

    let customText = '';
    const dateFormatted = dayjs(appt.date).format('YYYY/MM/DD');

    if (appt.serviceCategory === 'ليزر وإزالة شعر') {
      customText = `أهلاً بكِ ${appt.name} في مركز الجلدية والتجميل والليزر.\n\nنود تذكيركِ بموعد جلسة الليزر (${appt.serviceName})\nالتاريخ: ${dateFormatted}\nالساعة: ${appt.time}\nمع: ${appt.doctor}\nالمكان: ${appt.room}\n\nتعليمات هامة قبل الجلسة:\n- حلاقة المنطقة بالموس قبل الموعد بـ 24 ساعة.\n- تجنب التعرض المباشر للشمس أو التسمير.\n- التوقف عن استخدام أي كريمات تقشير قبل الجلسة بـ 48 ساعة.\n\nنتمنى لكِ يوماً سعيداً ونسعد بزيارتكِ دائماً.`;
    } else if (appt.serviceCategory === 'بوتوكس وفيلر') {
      customText = `أهلاً بكِ ${appt.name} في مركز الجلدية والتجميل.\n\nنود تذكيركِ بموعد جلسة الحقن والتجميل (${appt.serviceName})\nالتاريخ: ${dateFormatted}\nالساعة: ${appt.time}\nمع: ${appt.doctor}\nالمكان: ${appt.room}\n\nتعليمات هامة قبل الجلسة:\n- تجنب تناول المسكنات المسيلة للدم أو فيتامين E قبل الجلسة.\n- تجنب شرب الكافيين المركز قبل الموعد.\n\nنسعد باستقبالكِ دائماً وتقديم أفضل رعاية لكِ.`;
    } else if (appt.serviceCategory === 'عناية بالبشرة وهيدرافيشل') {
      customText = `أهلاً بكِ ${appt.name} في مركز الجلدية والتجميل.\n\nنود تذكيركِ بموعد جلسة العناية بالبشرة وتنظيف الهيدرافيشل (${appt.serviceName})\nالتاريخ: ${dateFormatted}\nالساعة: ${appt.time}\nمع: ${appt.doctor}\nالمكان: ${appt.room}\n\nتعليمات هامة قبل الجلسة:\n- يفضل الحضور بدون مستحضرات تجميل على البشرة.\n\nننتظركِ لتجربة متميزة وإشراقة طبيعية.`;
    } else if (appt.serviceCategory === 'سبا ومساج') {
      customText = `أهلاً بكِ ${appt.name} في مركز الجلدية والتجميل والسبا.\n\nنود تذكيركِ بموعد جلسة السبا والاسترخاء (${appt.serviceName})\nالتاريخ: ${dateFormatted}\nالساعة: ${appt.time}\nمع: ${appt.doctor}\nالمكان: ${appt.room}\n\nتعليمات هامة:\n- يفضل الحضور قبل الموعد بـ 15 دقيقة للاسترخاء.\n\nنتمنى لكِ قضاء وقت ممتع ومريح يجدد طاقتكِ.`;
    } else {
      customText = `أهلاً بكِ ${appt.name} في مركز الجلدية والتجميل.\n\nنود تذكيركِ بموعد جلستكِ (${appt.serviceName})\nالتاريخ: ${dateFormatted}\nالساعة: ${appt.time}\nمع: ${appt.doctor}\nالمكان: ${appt.room}\n\nنتشرف بزيارتكِ دائماً.`;
    }

    const cleanNumber = phone.startsWith('0') ? '2' + phone : phone.startsWith('2') ? phone : '2' + phone;
    const encoded = encodeURIComponent(customText);
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encoded}`, '_blank');
  };

  // Filtered by selected date
  const todayDateStr = dayjs().format('YYYY-MM-DD');
  const todayList = appointments.filter((a) => a.date === todayDateStr);
  const selectedDateList = appointments.filter((a) => a.date === selectedDate);

  // Active doctor focused filter
  const currentFocusedDoctor = doctors.find((d) => d.name === selectedDoctorFilter);

  const filteredQueue = useMemo(() => {
    return todayList.filter((a) => {
      const matchDoc = selectedDoctorFilter === 'all' || a.doctor === selectedDoctorFilter;
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery) ||
        a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDoc && matchSearch;
    });
  }, [todayList, selectedDoctorFilter, searchQuery]);

  // Handle adding new doctor
  const handleSaveNewDoctor = (values: any) => {
    const newDoc: DoctorSchedule = {
      id: `doc-${Date.now()}`,
      name: values.name,
      roleTitle: values.roleTitle,
      specialtyCategory: values.specialtyCategory || 'ليزر وإزالة شعر',
      room: values.room || 'غرفة علاج جديدة',
      color: values.color || '#be185d',
      offDays: values.offDays || [5],
      offDates: values.offDates ? values.offDates.split(',').map((s: string) => s.trim()) : [],
    };
    saveDoctors([...doctors, newDoc]);
    message.success(`تمت إضافة الطبيبة: ${newDoc.name} بنجاح`);
    setIsAddDoctorModalOpen(false);
    doctorForm.resetFields();
  };

  // Toggle off-day for a doctor
  const handleToggleDoctorOffDay = (docId: string, dayId: number) => {
    const next = doctors.map((d) => {
      if (d.id !== docId) return d;
      const hasDay = d.offDays.includes(dayId);
      const newOffDays = hasDay ? d.offDays.filter((x) => x !== dayId) : [...d.offDays, dayId];
      return { ...d, offDays: newOffDays };
    });
    saveDoctors(next);
    message.success('تم تحديث أيام إجازة الطبيبة');
  };

  const modalOffCheck = checkDoctorOff(modalDoctor, modalDate);
  const selectedDocObj = doctors.find((d) => d.name === modalDoctor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Luxury Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          borderRadius: 16,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(30, 41, 59, 0.25)',
        }}
        bodyStyle={{ padding: '22px 28px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={15}>
            <Space align="center" size={14}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarPlus size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  طابور الحالات والمواعيد لكل طبيبة (Multi-Doctor Queue & Shifts)
                </Title>
                <Text style={{ color: '#e2e8f0', fontSize: 13 }}>
                  إدارة طابور مستقل لكل طبيبة وأخصائية، دعم تشغيل عدة عيادات في نفس الوقت، وحماية السكرتارية من الحجز في أيام الإجازات
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={9} style={{ textAlign: 'left' }}>
            <Space size={10} wrap>
              <Button
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  borderRadius: 8,
                }}
                icon={<Settings size={15} />}
                onClick={() => setIsDoctorsModalOpen(true)}
              >
                مواعيد وإجازات الطبيبات
              </Button>
              <Button
                size="large"
                icon={<RefreshCw size={16} />}
                loading={apptLoading}
                onClick={() => fetchAppointmentsFromApi()}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                تحديث
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CalendarPlus size={16} />}
                style={{
                  backgroundColor: '#be185d',
                  borderColor: '#be185d',
                  fontWeight: 700,
                  borderRadius: 8,
                  boxShadow: '0 4px 14px rgba(190, 24, 93, 0.4)',
                }}
                onClick={() => handleOpenAdd()}
              >
                + حجز موعد جديد
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Switcher (Queue vs Calendar vs All List) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            {
              value: 'today_queue',
              label: (
                <Space>
                  <Clock size={15} />
                  <span>طابور حالات اليوم ({todayList.length})</span>
                </Space>
              ),
            },
            {
              value: 'calendar',
              label: (
                <Space>
                  <CalendarIcon size={15} />
                  <span>التقويم والحجوزات المستقبلية</span>
                </Space>
              ),
            },
            {
              value: 'room_device_matrix',
              label: (
                <Space>
                  <Cpu size={15} />
                  <span>جدولة الغرف والأجهزة المشتركة</span>
                </Space>
              ),
            },
            {
              value: 'all_list',
              label: (
                <Space>
                  <ListFilter size={15} />
                  <span>كافة المواعيد ({appointments.length})</span>
                </Space>
              ),
            },
          ]}
          style={{ padding: 4, background: '#F1F5F9', borderRadius: 10 }}
        />

        {activeTab === 'today_queue' && (
          <Space size={12} wrap>
            {/* View Mode Toggle: Single Doctor Queue vs Side-by-Side Multi Lanes */}
            <Segmented
              value={queueMode}
              onChange={(val) => setQueueMode(val as any)}
              options={[
                {
                  value: 'doctor_focused',
                  label: (
                    <Space size={4}>
                      <LayoutGrid size={14} />
                      <span>طابور الطبيبة المحددة</span>
                    </Space>
                  ),
                },
                {
                  value: 'multi_lanes',
                  label: (
                    <Space size={4}>
                      <Columns size={14} />
                      <span>عرض مقارن للعيادات المتزامنة</span>
                    </Space>
                  ),
                },
              ]}
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}
            />

            <Input
              prefix={<Search size={14} color="#64748B" />}
              placeholder="بحث بالحالة أو الطبيبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />
          </Space>
        )}
      </div>

      {/* TAB 1: TODAY'S QUEUE */}
      {activeTab === 'today_queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Doctor Switcher Bar (Filter by Doctor) */}
          <Card
            size="small"
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FAFAFA' }}
            bodyStyle={{ padding: '10px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text strong style={{ fontSize: 13, color: '#475569' }}>
                  طابور عيادة:
                </Text>
                <Button
                  size="small"
                  type={selectedDoctorFilter === 'all' ? 'primary' : 'default'}
                  style={
                    selectedDoctorFilter === 'all'
                      ? { backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: 6, fontWeight: 600 }
                      : { borderRadius: 6 }
                  }
                  onClick={() => setSelectedDoctorFilter('all')}
                >
                  جميع العيادات ({todayList.length})
                </Button>

                {doctors.map((doc) => {
                  const docTodayCount = todayList.filter((a) => a.doctor === doc.name).length;
                  const isOffToday = doc.offDays.includes(dayjs().day());
                  const isSelected = selectedDoctorFilter === doc.name;

                  return (
                    <Button
                      key={doc.id}
                      size="small"
                      type={isSelected ? 'primary' : 'default'}
                      style={
                        isSelected
                          ? { backgroundColor: doc.color, borderColor: doc.color, borderRadius: 6, fontWeight: 700 }
                          : { borderRadius: 6 }
                      }
                      onClick={() => setSelectedDoctorFilter(doc.name)}
                    >
                      <Space size={6}>
                        <Avatar size={16} style={{ backgroundColor: isSelected ? '#ffffff' : doc.color, color: isSelected ? doc.color : '#fff', fontSize: 10 }}>
                          {doc.name.charAt(3) || 'د'}
                        </Avatar>
                        <span>{doc.name}</span>
                        <Tag
                          color={isSelected ? 'default' : 'blue'}
                          style={{ margin: 0, padding: '0 5px', fontSize: 11, borderRadius: 4, fontWeight: 700 }}
                        >
                          {docTodayCount}
                        </Tag>
                        {isOffToday && (
                          <span style={{ fontSize: 11, color: isSelected ? '#ffedd5' : '#B91C1C' }}>
                            (إجازة اليوم)
                          </span>
                        )}
                      </Space>
                    </Button>
                  );
                })}
              </div>

              <Button
                size="small"
                type="link"
                icon={<Plus size={13} />}
                onClick={() => handleOpenAdd(selectedDoctorFilter !== 'all' ? selectedDoctorFilter : undefined)}
                style={{ fontWeight: 600, color: '#be185d' }}
              >
                + إضافة حالة للطابور
              </Button>
            </div>
          </Card>

          {/* If Single Doctor selected: Show Doctor Header Status & Working Days */}
          {currentFocusedDoctor && selectedDoctorFilter !== 'all' && (
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: `1px solid ${currentFocusedDoctor.color}30`,
                background: `${currentFocusedDoctor.color}08`,
              }}
            >
              <Row justify="space-between" align="middle" gutter={[12, 12]}>
                <Col xs={24} md={16}>
                  <Space size={12} align="center">
                    <Avatar size={42} style={{ backgroundColor: currentFocusedDoctor.color, fontWeight: 700, fontSize: 16 }}>
                      {currentFocusedDoctor.name.charAt(3) || 'د'}
                    </Avatar>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{currentFocusedDoctor.name}</span>
                        <Tag color="cyan">{currentFocusedDoctor.room}</Tag>
                        {currentFocusedDoctor.offDays.includes(dayjs().day()) ? (
                          <Tag color="error" style={{ fontWeight: 600 }}>⛔ اليوم يوم إجازة أسبوعية للدكتورة</Tag>
                        ) : (
                          <Tag color="success" style={{ fontWeight: 600 }}>🟢 اليوم متاح لاستقبال الحالات (يوم عمل)</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        {currentFocusedDoctor.roleTitle} • أيام الإجازة: {currentFocusedDoctor.offDays.map((d) => DAYS_OF_WEEK.find((x) => x.id === d)?.nameAr).join('، ')}
                      </div>
                    </div>
                  </Space>
                </Col>

                <Col xs={24} md={8} style={{ textAlign: 'left' }}>
                  <Space size={8}>
                    <div style={{ textAlign: 'center', padding: '4px 10px', background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B' }}>بالانتظار</div>
                      <div style={{ fontWeight: 700, color: '#B45309' }}>
                        {filteredQueue.filter((a) => a.status === 'waiting').length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '4px 10px', background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B' }}>قيد الكشف</div>
                      <div style={{ fontWeight: 700, color: '#1D4ED8' }}>
                        {filteredQueue.filter((a) => a.status === 'in_doctor').length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '4px 10px', background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B' }}>اكتملت</div>
                      <div style={{ fontWeight: 700, color: '#047857' }}>
                        {filteredQueue.filter((a) => a.status === 'completed').length}
                      </div>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          {/* VIEW MODE A: STANDARD KANBAN BY STATUS */}
          {queueMode === 'doctor_focused' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredQueue.length === 0 ? (
                <Card style={{ borderRadius: 14, textAlign: 'center', padding: '36px 0', border: '1px dashed #CBD5E1' }}>
                  <Empty description="لا توجد مواعيد مسجلة في طابور اليوم حتى الآن" />
                </Card>
              ) : (
                STATUS_ORDER.map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const items = filteredQueue.filter((a) => a.status === status);
                  if (items.length === 0) return null;
                  return (
                    <div key={status}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 14,
                          fontWeight: 700,
                          color: cfg.color,
                          backgroundColor: cfg.bg,
                          padding: '4px 12px',
                          borderRadius: 8,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        {cfg.icon}
                        <span>{cfg.labelAr}</span>
                        <Tag color={cfg.color} style={{ margin: 0, padding: '0 6px', fontSize: 11, fontWeight: 700 }}>
                          {items.length}
                        </Tag>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map((appt) => (
                        <Card
                          key={appt.id}
                          size="small"
                          style={{
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s',
                          }}
                          bodyStyle={{ padding: '12px 16px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <Avatar size={38} style={{ backgroundColor: '#be185d', fontWeight: 700, fontSize: 14 }}>
                                {appt.name.charAt(0)}
                              </Avatar>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{appt.name}</span>
                                  <Tag color="cyan" style={{ fontSize: 11 }}>{appt.patientNumber}</Tag>
                                  <Tag color="#be185d" style={{ fontSize: 11, fontWeight: 600 }}>{appt.serviceCategory}</Tag>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 12, color: '#64748B' }}>
                                  <span>⏰ <strong>{appt.time}</strong></span>
                                  <span>•</span>
                                  <span>{appt.serviceName}</span>
                                  <span>•</span>
                                  <span style={{ color: '#0369A1', fontWeight: 600 }}>👨‍⚕️ {appt.doctor}</span>
                                  <span>•</span>
                                  <span>🏢 {appt.room}</span>
                                  {appt.phone && (
                                    <>
                                      <span>•</span>
                                      <span>📞 {appt.phone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Space size={8}>
                              {/* 1-Click WhatsApp Button */}
                              <Button
                                size="small"
                                style={{
                                  backgroundColor: '#047857',
                                  color: '#ffffff',
                                  borderColor: '#047857',
                                  fontWeight: 600,
                                  borderRadius: 6,
                                }}
                                icon={<MessageSquare size={13} />}
                                onClick={() => sendWhatsAppReminder(appt)}
                              >
                                تذكير واتساب
                              </Button>

                              {/* Status Transition Actions */}
                              {status === 'waiting' && (
                                <>
                                  <Button
                                    size="small"
                                    style={{
                                      backgroundColor: '#fff1f2',
                                      color: '#be185d',
                                      borderColor: '#BE123C',
                                      fontWeight: 600,
                                      borderRadius: 6,
                                    }}
                                    onClick={() => sendApptToQueue(appt)}
                                  >
                                    إرسال لطابور الطبيبة
                                  </Button>
                                  <Button
                                    type="primary"
                                    size="small"
                                    style={{ backgroundColor: '#1D4ED8', borderColor: '#1D4ED8', borderRadius: 6 }}
                                    onClick={() => {
                                      changeStatus(appt.id, 'in_doctor');
                                      sendApptToQueue(appt);
                                    }}
                                  >
                                    دخول العيادة الآن
                                  </Button>
                                </>
                              )}
                              {status === 'in_doctor' && (
                                <Button
                                  type="primary"
                                  size="small"
                                  style={{ backgroundColor: '#047857', borderColor: '#047857', borderRadius: 6 }}
                                  onClick={() => changeStatus(appt.id, 'completed')}
                                >
                                  إنهاء الجلسة ✓
                                </Button>
                              )}
                              {status !== 'completed' && status !== 'cancelled' && (
                                <Popconfirm
                                  title="هل ترغبين بإلغاء هذا الموعد؟"
                                  onConfirm={() => changeStatus(appt.id, 'cancelled')}
                                  okText="نعم، إلغاء"
                                  cancelText="تراجع"
                                >
                                  <Button size="small" danger style={{ borderRadius: 6 }}>
                                    إلغاء
                                  </Button>
                                </Popconfirm>
                              )}

                              <Button size="small" icon={<Edit3 size={13} />} onClick={() => handleOpenEdit(appt)} />
                            </Space>
                          </div>
                        </Card>
                      ))}

                      {items.length === 0 && (
                        <div style={{ padding: '16px 20px', background: '#FAFAFA', borderRadius: 10, color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                          لا توجد حالات في هذه المرحلة حالياً
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          )}

          {/* VIEW MODE B: SIDE-BY-SIDE LANES FOR MULTIPLE DOCTORS AT THE SAME TIME */}
          {queueMode === 'multi_lanes' && (
            <Row gutter={[16, 16]}>
              {doctors.map((doc) => {
                const docCases = todayList.filter((a) => a.doctor === doc.name);
                const currentInSession = docCases.find((a) => a.status === 'in_doctor');
                const waitingCases = docCases.filter((a) => a.status === 'waiting');
                const completedCases = docCases.filter((a) => a.status === 'completed');
                const isOffToday = doc.offDays.includes(dayjs().day());

                return (
                  <Col xs={24} md={12} lg={8} key={doc.id}>
                    <Card
                      style={{
                        borderRadius: 14,
                        border: `1.5px solid ${doc.color}35`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        height: '100%',
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      {/* Doctor Lane Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 12, marginBottom: 14 }}>
                        <Space>
                          <Avatar size={34} style={{ backgroundColor: doc.color, fontWeight: 700 }}>
                            {doc.name.charAt(3) || 'د'}
                          </Avatar>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{doc.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>🏢 {doc.room}</div>
                          </div>
                        </Space>
                        <Tag color={isOffToday ? 'error' : 'blue'} style={{ margin: 0, fontWeight: 600 }}>
                          {isOffToday ? 'إجازة اليوم' : `${docCases.length} حالات`}
                        </Tag>
                      </div>

                      {/* Section 1: In Doctor Right Now */}
                      <div style={{ marginBottom: 14 }}>
                        <Text strong style={{ fontSize: 12, color: '#1D4ED8', display: 'block', marginBottom: 6 }}>
                          ⚡ داخل العيادة حالياً (In-Session):
                        </Text>
                        {currentInSession ? (
                          <div
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: 8,
                              padding: '10px 12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: '#1E3A8A', fontSize: 13 }}>{currentInSession.name}</div>
                              <div style={{ fontSize: 11, color: '#1D4ED8' }}>
                                ⏰ {currentInSession.time} • {currentInSession.serviceName}
                              </div>
                            </div>
                            <Button
                              size="small"
                              type="primary"
                              style={{ backgroundColor: '#047857', borderColor: '#047857', fontSize: 11 }}
                              onClick={() => changeStatus(currentInSession.id, 'completed')}
                            >
                              إنهاء ✓
                            </Button>
                          </div>
                        ) : (
                          <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '10px', textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                            العيادة شاغرة حالياً (لا توجد حالة بالداخل)
                          </div>
                        )}
                      </div>

                      {/* Section 2: Waiting Queue for this doctor */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text strong style={{ fontSize: 12, color: '#B45309' }}>
                            ⏳ قائمة الانتظار للغرفة ({waitingCases.length}):
                          </Text>
                          <Button size="small" type="link" style={{ padding: 0, fontSize: 11 }} onClick={() => handleOpenAdd(doc.name)}>
                            + حجز للدكتورة
                          </Button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {waitingCases.map((appt) => (
                            <div
                              key={appt.id}
                              style={{
                                background: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                borderRadius: 8,
                                padding: '8px 10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 12, color: '#78350F' }}>{appt.name}</div>
                                <div style={{ fontSize: 10, color: '#92400E' }}>
                                  ⏰ {appt.time} • {appt.serviceName}
                                </div>
                              </div>
                              <Space size={4}>
                                <Button
                                  size="small"
                                  style={{ backgroundColor: '#047857', color: '#fff', borderColor: '#047857', padding: '0 6px', fontSize: 11 }}
                                  onClick={() => sendWhatsAppReminder(appt)}
                                >
                                  واتساب
                                </Button>
                                <Button
                                  size="small"
                                  type="primary"
                                  style={{ padding: '0 8px', fontSize: 11 }}
                                  onClick={() => changeStatus(appt.id, 'in_doctor')}
                                >
                                  دخول
                                </Button>
                              </Space>
                            </div>
                          ))}

                          {waitingCases.length === 0 && (
                            <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', padding: '8px 0' }}>
                              لا توجد حالات في صالة الانتظار لهذه الطبيبة
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Completed count */}
                      <div style={{ fontSize: 11, color: '#047857', background: '#ECFDF5', padding: '6px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>الحالات المكتملة اليوم:</span>
                        <strong>{completedCases.length} حالات ✓</strong>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE CALENDAR FOR FUTURE BOOKINGS */}
      {activeTab === 'calendar' && (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CalendarIcon size={16} color="#be185d" />
                  <span style={{ fontWeight: 600 }}>اختيار التاريخ المستقبلي</span>
                </Space>
              }
              style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
            >
              <Calendar
                fullscreen={false}
                value={dayjs(selectedDate)}
                onChange={(date: Dayjs) => setSelectedDate(date.format('YYYY-MM-DD'))}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Clock size={16} color="#be185d" />
                    <span style={{ fontWeight: 600 }}>
                      مواعيد تاريخ: {dayjs(selectedDate).format('YYYY/MM/DD')} ({selectedDateList.length})
                    </span>
                  </Space>
                  <Button type="primary" size="small" onClick={() => handleOpenAdd()}>
                    + حجز في هذا اليوم
                  </Button>
                </div>
              }
              style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDateList.map((appt) => (
                  <div
                    key={appt.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      background: '#FAFAFA',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{appt.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        ⏰ {appt.time} • {appt.serviceName} • <span style={{ color: '#0369A1', fontWeight: 600 }}>{appt.doctor}</span> • 🏢 {appt.room}
                      </div>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small"
                        style={{ backgroundColor: '#047857', color: '#fff', borderColor: '#047857' }}
                        onClick={() => sendWhatsAppReminder(appt)}
                      >
                        واتساب
                      </Button>
                      <Button size="small" icon={<Edit3 size={13} />} onClick={() => handleOpenEdit(appt)} />
                    </Space>
                  </div>
                ))}

                {selectedDateList.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                    لا توجد حجوزات مجدولة في هذا التاريخ حتى الآن.
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* TAB 3: ALL APPOINTMENTS LIST */}
      
      {/* 4. Tab: Room & Shared Equipment Matrix (جدولة الغرف والأجهزة المشتركة) */}
      {activeTab === 'room_device_matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header & Date Controller */}
          <Card
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              borderRadius: 14,
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 6px 20px rgba(49, 46, 129, 0.25)',
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row justify="space-between" align="middle" gutter={[12, 12]}>
              <Col xs={24} md={13}>
                <Space align="center" size={12}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Cpu size={24} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                      مصفوفة إشغال الغرف والأجهزة المشتركة (Rooms & Equipment Schedule)
                    </div>
                    <div style={{ fontSize: 12, color: '#c7d2fe' }}>
                      تتبع لحظي وتنسيق زمني لغرف الليزر والهيدرافيشل والحقن لمنع التضارب وضمان تشغيل الأجهزة بكفاءة
                    </div>
                  </div>
                </Space>
              </Col>
              <Col xs={24} md={11} style={{ textAlign: 'start' }}>
                <Space wrap>
                  <DatePicker
                    value={dayjs(selectedDate)}
                    onChange={(d) => {
                      if (d) setSelectedDate(d.format('YYYY-MM-DD'));
                    }}
                    style={{ borderRadius: 8 }}
                  />
                  <Button
                    size="small"
                    style={{
                      background: selectedDate === dayjs().format('YYYY-MM-DD') ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      color: selectedDate === dayjs().format('YYYY-MM-DD') ? '#312e81' : '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                    }}
                    onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
                  >
                    اليوم
                  </Button>
                  <Button
                    size="small"
                    style={{
                      background: selectedDate === dayjs().add(1, 'day').format('YYYY-MM-DD') ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      color: selectedDate === dayjs().add(1, 'day').format('YYYY-MM-DD') ? '#312e81' : '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                    }}
                    onClick={() => setSelectedDate(dayjs().add(1, 'day').format('YYYY-MM-DD'))}
                  >
                    غداً
                  </Button>
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    style={{ background: '#be185d', borderColor: '#be185d', fontWeight: 700, borderRadius: 8 }}
                    onClick={() => {
                      setEditingAppt(null);
                      form.resetFields();
                      setModalDate(selectedDate);
                      form.setFieldsValue({ date: dayjs(selectedDate), time: dayjs('10:00', 'HH:mm') });
                      setIsModalOpen(true);
                    }}
                  >
                    + حجز جديد
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Conflict Alert Banner if any conflict exists on this day */}
          {matrixConflicts.length > 0 && (
            <Alert
              type="error"
              showIcon
              icon={<AlertTriangle size={20} color="#b91c1c" />}
              message={<span style={{ fontWeight: 800 }}>⚠️ اكتشاف تعارض في الغرف أو الأجهزة في يوم {selectedDate}:</span>}
              description={
                <ul style={{ margin: '6px 0 0 0', paddingInlineStart: 20 }}>
                  {matrixConflicts.map((c, i) => (
                    <li key={i} style={{ fontWeight: 600 }}>{c}</li>
                  ))}
                </ul>
              }
              style={{ borderRadius: 10, border: '1px solid #fca5a5', background: '#fef2f2' }}
            />
          )}

          {/* 1. ROOMS OCCUPANCY MATRIX */}
          <Card
            title={
              <Space>
                <Layers size={18} color="#4338ca" />
                <span style={{ fontWeight: 700 }}>1. جدول إشغال الغرف والأجنحة العلاجية — {selectedDate}</span>
              </Space>
            }
            style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
            bodyStyle={{ overflowX: 'auto', padding: '16px' }}
          >
            <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: 200, fontWeight: 700, color: '#334155' }}>الغرفة / الجناح</th>
                  {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((hour) => (
                    <th key={hour} style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 600, color: '#64748b', borderInlineStart: '1px solid #e2e8f0' }}>
                      {hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLINIC_ROOMS.map((room) => (
                  <tr key={room.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338ca' }} />
                        <span>{room.name}</span>
                      </div>
                    </td>
                    {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((hour) => {
                      const hourPrefix = hour.split(':')[0];
                      const matched = appointments.filter(
                        (a) => a.date === selectedDate && a.status !== 'cancelled' && (a.room === room.name || a.room.includes(room.name.split(' ')[0])) && a.time.startsWith(hourPrefix)
                      );

                      if (matched.length > 0) {
                        const isConflict = matched.length > 1;
                        return (
                          <td
                            key={hour}
                            style={{
                              padding: 4,
                              borderInlineStart: '1px solid #f1f5f9',
                              background: isConflict ? '#fee2e2' : '#f0fdf4',
                              verticalAlign: 'top',
                            }}
                          >
                            {matched.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => handleOpenEdit(m)}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  background: isConflict ? '#ef4444' : '#047857',
                                  color: '#ffffff',
                                  fontSize: 10,
                                  cursor: 'pointer',
                                  marginBottom: 2,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                              >
                                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {m.name}
                                </div>
                                <div style={{ opacity: 0.9, fontSize: 9 }}>
                                  {m.doctor.replace('د. ', '')} • {m.time}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={hour}
                          style={{
                            padding: 4,
                            borderInlineStart: '1px solid #f1f5f9',
                            textAlign: 'center',
                          }}
                        >
                          <Button
                            type="text"
                            size="small"
                            style={{ fontSize: 10, color: '#94a3b8', height: 24, padding: '0 4px', border: '1px dashed #e2e8f0' }}
                            onClick={() => {
                              setEditingAppt(null);
                              form.resetFields();
                              setModalDate(selectedDate);
                              form.setFieldsValue({
                                date: dayjs(selectedDate),
                                time: dayjs(hour, 'HH:mm'),
                                room: room.name,
                              });
                              setIsModalOpen(true);
                            }}
                          >
                            + متاح
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 2. SHARED DEVICES OCCUPANCY MATRIX */}
          <Card
            title={
              <Space>
                <Cpu size={18} color="#047857" />
                <span style={{ fontWeight: 700 }}>2. جدول إشغال الأجهزة والمعدات التجميلية المشتركة — {selectedDate}</span>
              </Space>
            }
            style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
            bodyStyle={{ overflowX: 'auto', padding: '16px' }}
          >
            <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: 220, fontWeight: 700, color: '#334155' }}>الجهاز المشترك</th>
                  {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((hour) => (
                    <th key={hour} style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 600, color: '#64748b', borderInlineStart: '1px solid #e2e8f0' }}>
                      {hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLINIC_SHARED_DEVICES.map((dev) => (
                  <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#047857' }} />
                        <span>{dev.name}</span>
                      </div>
                    </td>
                    {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((hour) => {
                      const hourPrefix = hour.split(':')[0];
                      const matched = appointments.filter(
                        (a) => a.date === selectedDate && a.status !== 'cancelled' && a.deviceId === dev.id && a.time.startsWith(hourPrefix)
                      );

                      if (matched.length > 0) {
                        const isConflict = matched.length > 1;
                        return (
                          <td
                            key={hour}
                            style={{
                              padding: 4,
                              borderInlineStart: '1px solid #f1f5f9',
                              background: isConflict ? '#fee2e2' : '#eff6ff',
                              verticalAlign: 'top',
                            }}
                          >
                            {matched.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => handleOpenEdit(m)}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  background: isConflict ? '#dc2626' : '#2563eb',
                                  color: '#ffffff',
                                  fontSize: 10,
                                  cursor: 'pointer',
                                  marginBottom: 2,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                              >
                                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {m.name}
                                </div>
                                <div style={{ opacity: 0.9, fontSize: 9 }}>
                                  {m.doctor.replace('د. ', '')} • {m.room}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={hour}
                          style={{
                            padding: 4,
                            borderInlineStart: '1px solid #f1f5f9',
                            textAlign: 'center',
                          }}
                        >
                          <Button
                            type="text"
                            size="small"
                            style={{ fontSize: 10, color: '#94a3b8', height: 24, padding: '0 4px', border: '1px dashed #e2e8f0' }}
                            onClick={() => {
                              setEditingAppt(null);
                              form.resetFields();
                              setModalDate(selectedDate);
                              form.setFieldsValue({
                                date: dayjs(selectedDate),
                                time: dayjs(hour, 'HH:mm'),
                                deviceId: dev.id,
                                deviceName: dev.name,
                              });
                              setIsModalOpen(true);
                            }}
                          >
                            + متاح
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'all_list' && (
        <Card style={{ borderRadius: 14, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {appointments.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Empty description="لا توجد أي مواعيد في الأرشيف حتى الآن" />
              </div>
            ) : (
              appointments.map((appt) => (
              <div
                key={appt.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 14 }}>{appt.name}</Text>
                    <Tag color="magenta">{appt.serviceCategory}</Tag>
                    <Tag color="cyan">{appt.serviceName}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    📅 {appt.date} • ⏰ {appt.time} • 👨‍⚕️ <strong style={{ color: '#0369A1' }}>{appt.doctor}</strong> • 🏢 {appt.room}
                  </div>
                </div>

                <Space size={8}>
                  <Button
                    size="small"
                    style={{ backgroundColor: '#047857', color: '#fff', borderColor: '#047857' }}
                    onClick={() => sendWhatsAppReminder(appt)}
                  >
                    واتساب تذكير
                  </Button>
                  <Button size="small" icon={<Edit3 size={13} />} onClick={() => handleOpenEdit(appt)}>تعديل</Button>
                  <Popconfirm title="حذف الحجز؟" onConfirm={() => handleDelete(appt.id)} okText="نعم" cancelText="إلغاء">
                    <Button size="small" danger icon={<Trash2 size={13} />} />
                  </Popconfirm>
                </Space>
              </div>
            ))
            )}
          </div>
        </Card>
      )}

      {/* Modal: Add/Edit Appointment with Secretary Holiday Protection */}
      <Modal
        title={editingAppt ? 'تعديل بيانات الحجز' : 'حجز موعد جلسة جديد بالعيادة'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={savingAppt}
        okText={editingAppt ? 'حفظ التعديلات' : 'تأكيد الحجز'}
        cancelText="إلغاء"
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveAppointment}>
          {/* Secretary Warning Alert if chosen doctor is off on chosen date */}
          {modalOffCheck.isOff && (
            <Alert
              type="error"
              showIcon
              icon={<ShieldAlert size={18} color="#B91C1C" />}
              message={<span style={{ fontWeight: 700 }}>⚠️ تحذير للسكرتارية: هذا اليوم إجازة رسمية للطبيبة!</span>}
              description={
                <div>
                  <div>{modalOffCheck.reason}</div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    💡 أيام العمل المتاحة للدكتورة {modalDoctor} هي: [{modalOffCheck.availableDays}].
                  </div>
                  <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>
                    يرجى تغيير تاريخ الموعد أو اختيار طبيبة بديلة لتجنب تضارب المواعيد مع إجازة الطبيبة.
                  </div>
                </div>
              }
              style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #fecaca' }}
            />
          )}

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span>اسم الحالة / العميلة</span>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, fontSize: 11, color: '#be185d', fontWeight: 600 }}
                      onClick={() => {
                        setIsManualPatient(!isManualPatient);
                        form.setFieldsValue({ name: '', phone: '', patientNumber: '' });
                      }}
                    >
                      {isManualPatient ? '🔍 اختيار من الحالات المسجلة' : '✏️ كتابة اسم حالة جديدة'}
                    </Button>
                  </div>
                }
                rules={[{ required: true, message: 'مطلوب كتابة أو اختيار الاسم' }]}
              >
                {isManualPatient ? (
                  <Input prefix={<User size={14} />} placeholder="الاسم الكامل للحالة" />
                ) : (
                  <Select
                    showSearch
                    allowClear
                    placeholder="ابحثي بالاسم أو رقم الهاتف..."
                    optionFilterProp="label"
                    onChange={(val, opt: any) => {
                      if (opt) {
                        form.setFieldsValue({
                          name: val,
                          phone: opt.phone,
                          patientNumber: opt.patientNumber,
                        });
                      }
                    }}
                    options={registeredPatients.map((p) => ({
                      value: p.name,
                      label: `${p.name} — ${p.patientNumber} (${p.phone})`,
                      phone: p.phone,
                      patientNumber: p.patientNumber,
                    }))}
                  />
                )}
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="phone" label="رقم الموبايل (للواتساب)">
                <Input prefix={<Phone size={14} />} placeholder="01xxxxxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="doctor" label="الطبيبة / الأخصائية المعالجة" rules={[{ required: true }]}>
                <Select
                  onChange={(val) => {
                    setModalDoctor(val);
                    const found = doctors.find((d) => d.name === val);
                    if (found) {
                      form.setFieldsValue({ room: found.room, serviceCategory: found.specialtyCategory });
                    }
                  }}
                  options={doctors.map((d) => ({
                    value: d.name,
                    label: `${d.name} (${d.room})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="room" label="الغرفة / الجناح المخصص" rules={[{ required: true, message: 'مطلوب اختيار الغرفة' }]}>
                <Select
                  showSearch
                  placeholder="اختر الغرفة أو الجناح..."
                  options={CLINIC_ROOMS.map((r) => ({
                    value: r.name,
                    label: r.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviceId" label="الجهاز المشترك للجلسة (تلقائي / اختياري)">
                <Select
                  allowClear
                  showSearch
                  placeholder="اختر الجهاز المستخدم (إن وجد)..."
                  options={CLINIC_SHARED_DEVICES.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  onChange={(_val, opt: any) => {
                    form.setFieldsValue({ deviceName: opt?.label || '' });
                  }}
                />
              </Form.Item>
              <Form.Item name="deviceName" hidden><Input /></Form.Item>
            </Col>
          </Row>

          {/* Doctor schedule hint */}
          {selectedDocObj && (
            <div style={{ fontSize: 12, color: '#475569', background: '#F8FAFC', padding: '6px 12px', borderRadius: 6, marginBottom: 14 }}>
              📅 <strong>جدول الطبيبة:</strong> إجازة أسبوعية يوم ({selectedDocObj.offDays.map((d) => DAYS_OF_WEEK.find((x) => x.id === d)?.nameAr).join(' و ')})
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="تاريخ الموعد" rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  onChange={(d) => {
                    if (d) setModalDate(d.format('YYYY-MM-DD'));
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time" label="وقت الموعد" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serviceCategory" label="نوع وتصنيف الجلسة" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'ليزر وإزالة شعر', label: 'ليزر وإزالة شعر' },
                    { value: 'بوتوكس وفيلر', label: 'بوتوكس وحقن فيلر' },
                    { value: 'عناية بالبشرة وهيدرافيشل', label: 'عناية بالبشرة وهيدرافيشل' },
                    { value: 'سبا ومساج', label: 'سبا ومساج وحمام مغربي' },
                    { value: 'عناية بالجسم وسكراب', label: 'عناية بالجسم وسكراب' },
                    { value: 'كشف واستشارة', label: 'كشف واستشارة جلدية' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serviceName" label="اختيار الخدمة أو الباقة">
                <Select
                  showSearch
                  allowClear
                  placeholder="اختاري من باقات العيادة أو اكتبي..."
                  onChange={(val) => {
                    const foundPkg = clinicPackages.find((p) => p.name === val);
                    if (foundPkg) {
                      form.setFieldsValue({
                        serviceName: foundPkg.name,
                        serviceCategory: foundPkg.category,
                        priceEgp: foundPkg.priceEgp,
                      });
                    }
                  }}
                  options={clinicPackages.map((pkg) => ({
                    value: pkg.name,
                    label: `${pkg.name} (${pkg.priceEgp.toLocaleString()} ج.م)`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priceEgp" label="سعر الجلسة / الباقة (ج.م)">
                <InputNumber min={0} step={100} style={{ width: '100%' }} placeholder="السعر بالجنيه" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="ملاحظات الحجز">
                <Input placeholder="سجلي أي طلبات خاصة..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal: Doctors and Holidays Management */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Settings size={18} color="#be185d" />
              <span>إدارة مواعيد وأيام إجازات الطبيبات والأخصائيات</span>
            </Space>
            <Button
              type="primary"
              size="small"
              icon={<Plus size={14} />}
              style={{ backgroundColor: '#be185d', borderColor: '#be185d', marginInlineEnd: 24 }}
              onClick={() => {
                doctorForm.resetFields();
                setIsAddDoctorModalOpen(true);
              }}
            >
              + إضافة طبيبة جديدة
            </Button>
          </div>
        }
        open={isDoctorsModalOpen}
        onCancel={() => setIsDoctorsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsDoctorsModalOpen(false)}>
            إغلاق
          </Button>,
        ]}
        width={720}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 500, overflowY: 'auto', paddingInlineEnd: 4 }}>
          <Alert
            type="info"
            message="تنظيم طوابير العمل وحماية السكرتارية"
            description="حددي أيام الإجازة الأسبوعية لكل طبيبة؛ سيقوم النظام بمنع وتنبيه السكرتارية فوراً عند محاولة حجز موعد في يوم إجازة الطبيبة المسؤولة."
            showIcon
          />

          {doctors.map((doc) => (
            <Card
              key={doc.id}
              size="small"
              style={{ borderRadius: 10, border: '1px solid #E2E8F0' }}
              bodyStyle={{ padding: 14 }}
            >
              <Row justify="space-between" align="middle" gutter={[10, 10]}>
                <Col xs={24} sm={10}>
                  <Space>
                    <Avatar size={34} style={{ backgroundColor: doc.color, fontWeight: 700 }}>
                      {doc.name.charAt(3) || 'د'}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {doc.roleTitle} • 🏢 {doc.room}
                      </div>
                    </div>
                  </Space>
                </Col>

                <Col xs={24} sm={14}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text strong style={{ fontSize: 11, color: '#475569' }}>
                      أيام الإجازة الأسبوعية (اختاري الأيام التي لا تعمل بها):
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {DAYS_OF_WEEK.map((day) => {
                        const isOff = doc.offDays.includes(day.id);
                        return (
                          <Tag.CheckableTag
                            key={day.id}
                            checked={isOff}
                            onChange={() => handleToggleDoctorOffDay(doc.id, day.id)}
                            style={{
                              fontSize: 11,
                              borderRadius: 4,
                              padding: '2px 8px',
                              backgroundColor: isOff ? '#FEE2E2' : '#F1F5F9',
                              color: isOff ? '#B91C1C' : '#475569',
                              border: isOff ? '1px solid #FECACA' : '1px solid #E2E8F0',
                              fontWeight: isOff ? 700 : 400,
                            }}
                          >
                            {day.nameAr} {isOff && '⛔ إجازة'}
                          </Tag.CheckableTag>
                        );
                      })}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Modal: Add New Doctor */}
      <Modal
        title="إضافة طبيبة / أخصائية جديدة للعيادة"
        open={isAddDoctorModalOpen}
        onCancel={() => { setIsAddDoctorModalOpen(false); doctorForm.resetFields(); }}
        onOk={() => doctorForm.submit()}
        okText="حفظ وإضافة"
        cancelText="إلغاء"
      >
        <Form form={doctorForm} layout="vertical" onFinish={handleSaveNewDoctor}>
          <Form.Item name="name" label="اسم الطبيبة / الأخصائية" rules={[{ required: true, message: 'مطلوب الاسم' }]}>
            <Input placeholder="مثال: د. ريهام العسال" />
          </Form.Item>

          <Form.Item name="roleTitle" label="المسمى الوظيفي والتخصص" rules={[{ required: true }]}>
            <Input placeholder="مثال: أخصائية الجلدية والتجميل" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="room" label="الغرفة الافتراضية" initialValue="غرفة علاج 2">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specialtyCategory" label="التخصص الأساسي" initialValue="ليزر وإزالة شعر">
                <Select
                  options={[
                    { value: 'ليزر وإزالة شعر', label: 'ليزر وإزالة شعر' },
                    { value: 'بوتوكس وفيلر', label: 'بوتوكس وفيلر' },
                    { value: 'عناية بالبشرة وهيدرافيشل', label: 'عناية بالبشرة وهيدرافيشل' },
                    { value: 'سبا ومساج', label: 'سبا ومساج' },
                    { value: 'عناية بالجسم وسكراب', label: 'عناية بالجسم وسكراب' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="offDays" label="أيام الإجازة الأسبوعية" initialValue={[5]}>
            <Checkbox.Group
              options={DAYS_OF_WEEK.map((d) => ({
                label: d.nameAr,
                value: d.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
