import { useState, useMemo } from 'react';
import {
  Card, Button, Typography, Row, Col, Table, Tag, Space, Divider,
  Alert, Progress, Segmented, DatePicker,
} from 'antd';
import {
  FileText, Download, Printer, TrendingUp, TrendingDown, DollarSign,
  Calendar, Users, CheckCircle2, Clock, AlertTriangle, BarChart3,
  RefreshCw,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { getClinicInventory } from '../../lib/clinicInventory';
import { getQueue } from '../../lib/clinicQueue';
import { getDoctorEarnings } from '../../lib/doctorEarnings';

const { Title, Text } = Typography;

function loadPackageEnrollments(): any[] {
  try {
    const raw = localStorage.getItem('clinic_package_enrollments_v2');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

// ─── Data loaders ────────────────────────────────────────────────────────────

function loadInvoices(): any[] {
  // Try known storage keys (same approach as InvoicesView)
  const keys = [
    'clinic_invoices_v1', 'clinic_invoices', 'invoices',
  ];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }
  return [];
}

function loadAppointments(): any[] {
  try {
    const raw = localStorage.getItem('clinic_appointments_unified_v3');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function loadCashierShift(): any | null {
  try {
    const raw = localStorage.getItem('clinic_cashier_shift');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function loadHistoricalReports(): DailyReport[] {
  try {
    const raw = localStorage.getItem('clinic_daily_reports_v1');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function saveHistoricalReport(report: DailyReport) {
  const all = loadHistoricalReports();
  // Replace same date or add new
  const exists = all.findIndex((r) => r.date === report.date);
  if (exists >= 0) all[exists] = report;
  else all.unshift(report);
  // Keep max 90 days
  const trimmed = all.slice(0, 90);
  localStorage.setItem('clinic_daily_reports_v1', JSON.stringify(trimmed));
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DailyReport {
  date: string; // YYYY-MM-DD
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalDiscount: number;
  totalExpenses: number;
  netProfit: number;
  cashRevenue: number;
  cardRevenue: number;
  appointmentsTotal: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  newPatients: number;
  queueServed: number;
  invoiceCount: number;
  topServices: { name: string; count: number; revenue: number }[];
  lowStockAlerts: number;
  generatedAt: string;
}

// ─── PDF Print helper ─────────────────────────────────────────────────────────

function printReport(reportHtml: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>التقرير اليومي</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #1e293b; background: #fff; font-size: 13px; }
        .header { background: linear-gradient(135deg, #be185d, #9d174d); color: #fff; padding: 24px 32px; margin-bottom: 24px; border-radius: 0 0 12px 12px; }
        .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .header p { font-size: 13px; opacity: 0.85; }
        .section { margin: 0 24px 20px; }
        .section-title { font-size: 15px; font-weight: 700; color: #be185d; border-right: 4px solid #be185d; padding-right: 10px; margin-bottom: 12px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 0 24px 20px; }
        .kpi-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
        .kpi-box .label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
        .kpi-box .value { font-size: 22px; font-weight: 700; color: #0f172a; }
        .kpi-box .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .kpi-box.green .value { color: #059669; }
        .kpi-box.pink .value { color: #be185d; }
        .kpi-box.blue .value { color: #0284c7; }
        .kpi-box.orange .value { color: #d97706; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f8fafc; padding: 8px 12px; text-align: right; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        tr:last-child td { border-bottom: none; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        .badge-red { background: #fee2e2; color: #dc2626; }
        .badge-yellow { background: #fef9c3; color: #a16207; }
        .footer { margin: 32px 24px 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${reportHtml}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 600);
}

// ─── CSV Export helper ────────────────────────────────────────────────────────

function exportCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const bom = '\uFEFF'; // BOM for Arabic Excel compatibility
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DailyReportView() {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');

  // ── Load live data ──
  const invoices = useMemo(() => loadInvoices(), []);
  const appointments = useMemo(() => loadAppointments(), []);
  const shift = useMemo(() => loadCashierShift(), []);
  const queue = useMemo(() => getQueue(), []);
  const inventory = useMemo(() => getClinicInventory(), []);
  const historicalReports = useMemo(() => loadHistoricalReports(), []);

  // ── Filter by selected date ──
  const dayInvoices = useMemo(() =>
    invoices.filter((inv) => dayjs(inv.issueDate || inv.createdAt).format('YYYY-MM-DD') === selectedDate),
    [invoices, selectedDate]
  );

  const dayAppointments = useMemo(() =>
    appointments.filter((a: any) => a.date === selectedDate),
    [appointments, selectedDate]
  );

  const dayQueue = useMemo(() =>
    queue.filter((q) => dayjs(q.addedAt).format('YYYY-MM-DD') === selectedDate),
    [queue, selectedDate]
  );

  const doctorEarnings = useMemo(() => getDoctorEarnings(), []);
  const packageEnrollments = useMemo(() => loadPackageEnrollments(), []);

  const dayDoctorEarnings = useMemo(() =>
    doctorEarnings.filter((e) => e.date === selectedDate),
    [doctorEarnings, selectedDate]
  );
  const totalDoctorCommissions = useMemo(() =>
    dayDoctorEarnings.reduce((s, e) => s + e.earnedAmountEgp, 0),
    [dayDoctorEarnings]
  );
  const totalPackageLiability = useMemo(() =>
    packageEnrollments.reduce((s: number, p: any) => {
      const rem = p.remainingSessions ?? Math.max(0, (p.totalSessions || 1) - (p.completedSessions || 0));
      const pricePerSession = (p.priceEgp || 0) / (p.totalSessions || 1);
      return s + Math.round(pricePerSession * rem);
    }, 0),
    [packageEnrollments]
  );


  // ── Revenue calculation ──
  const totalRevenue = useMemo(() => dayInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0), [dayInvoices]);
  const totalPaid = useMemo(() => dayInvoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0), [dayInvoices]);
  const totalDiscount = useMemo(() => dayInvoices.reduce((s, inv) => s + Number(inv.discountAmount || 0), 0), [dayInvoices]);
  const totalPending = totalRevenue - totalPaid;

  // ── Cashier shift ──
  const shiftIsToday = shift && dayjs(shift.openedAt).format('YYYY-MM-DD') === selectedDate;
  const cashRevenue = shiftIsToday ? shift.payments?.filter((p: any) => p.method === 'cash').reduce((s: number, p: any) => s + p.amount, 0) : 0;
  const cardRevenue = shiftIsToday ? shift.payments?.filter((p: any) => p.method === 'card').reduce((s: number, p: any) => s + p.amount, 0) : 0;
  const totalExpenses = shiftIsToday ? shift.expenses?.reduce((s: number, e: any) => s + e.amount, 0) : 0;
  const netProfit = totalPaid - totalExpenses;

  // ── Appointments ──
  const completedAppts = dayAppointments.filter((a: any) => a.status === 'completed').length;
  const cancelledAppts = dayAppointments.filter((a: any) => a.status === 'cancelled').length;

  // ── Queue served ──
  const queueServed = dayQueue.filter((q) => q.status === 'done').length;

  // ── New patients today (patients registered today based on queue or appointments) ──
  const newPatients = dayAppointments.filter(
    (a: any) => !a.patientNumber || a.patientNumber === 'PAT-NEW'
  ).length;

  // ── Low stock ──
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.reorderLevel).length;

  // ── Top services from invoices ──
  const topServicesMap: Record<string, { count: number; revenue: number }> = {};
  dayInvoices.forEach((inv) => {
    (inv.items || []).forEach((item: any) => {
      const name = item.description?.split('—')[0]?.trim() || item.description || 'خدمة';
      if (!topServicesMap[name]) topServicesMap[name] = { count: 0, revenue: 0 };
      topServicesMap[name].count += item.quantity || 1;
      topServicesMap[name].revenue += Number(item.lineTotal || item.unitPrice || 0);
    });
  });
  const topServices = Object.entries(topServicesMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Build today's report snapshot ──
  const todayReport: DailyReport = {
    date: selectedDate,
    totalRevenue,
    totalPaid,
    totalPending,
    totalDiscount,
    totalExpenses,
    netProfit,
    cashRevenue,
    cardRevenue,
    appointmentsTotal: dayAppointments.length,
    appointmentsCompleted: completedAppts,
    appointmentsCancelled: cancelledAppts,
    newPatients,
    queueServed,
    invoiceCount: dayInvoices.length,
    topServices,
    lowStockAlerts: lowStockCount,
    generatedAt: new Date().toISOString(),
  };

  // ─── Build printable HTML ──────────────────────────────────────────────────

  const buildPrintHtml = () => {
    const dateLabel = dayjs(selectedDate).locale('ar').format('dddd، D MMMM YYYY');
    const servicesRows = topServices.map((s) => `
      <tr>
        <td>${s.name}</td>
        <td style="text-align:center">${s.count}</td>
        <td style="text-align:center;font-weight:700;color:#059669">${s.revenue.toLocaleString()} ج.م</td>
      </tr>
    `).join('');

    const invoiceRows = dayInvoices.map((inv: any) => `
      <tr>
        <td>${inv.invoiceNumber || '—'}</td>
        <td>${inv.patientId || '—'}</td>
        <td>${Number(inv.total || 0).toLocaleString()} ج.م</td>
        <td>${Number(inv.paidAmount || 0).toLocaleString()} ج.م</td>
        <td>
          <span class="badge ${
            inv.status === 'PAID' || inv.status === 'paid' ? 'badge-green' :
            inv.status === 'PARTIALLY_PAID' || inv.status === 'partially_paid' ? 'badge-yellow' :
            'badge-blue'
          }">
            ${inv.status === 'PAID' || inv.status === 'paid' ? 'مدفوعة' :
              inv.status === 'PARTIALLY_PAID' || inv.status === 'partially_paid' ? 'جزئية' : 'صادرة'}
          </span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="header">
        <h1>📊 التقرير اليومي للعيادة</h1>
        <p>${dateLabel} &nbsp;·&nbsp; تم الإنشاء: ${dayjs().format('HH:mm')} &nbsp;·&nbsp; A'clat Beauty & Dermatology Clinic</p>
      </div>

      <div class="kpi-grid">
        <div class="kpi-box green">
          <div class="label">إجمالي الإيرادات</div>
          <div class="value">${totalRevenue.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
        <div class="kpi-box blue">
          <div class="label">المحصل فعلياً</div>
          <div class="value">${totalPaid.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
        <div class="kpi-box orange">
          <div class="label">المتبقي للتحصيل</div>
          <div class="value">${totalPending.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
        <div class="kpi-box pink">
          <div class="label">صافي الربح</div>
          <div class="value">${netProfit.toLocaleString()}</div>
          <div class="sub">ج.م بعد المصاريف</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="label">نقداً</div>
          <div class="value">${cashRevenue.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
        <div class="kpi-box">
          <div class="label">بطاقة</div>
          <div class="value">${cardRevenue.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
        <div class="kpi-box">
          <div class="label">المصاريف</div>
          <div class="value" style="color:#dc2626">${totalExpenses.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
        <div class="kpi-box">
          <div class="label">الخصومات الممنوحة</div>
          <div class="value" style="color:#d97706">${totalDiscount.toLocaleString()}</div>
          <div class="sub">ج.م</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">مواعيد وطابور اليوم</div>
        <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin: 0 0 16px;">
          <div class="kpi-box"><div class="label">إجمالي المواعيد</div><div class="value blue">${dayAppointments.length}</div></div>
          <div class="kpi-box"><div class="label">مكتملة</div><div class="value green">${completedAppts}</div></div>
          <div class="kpi-box"><div class="label">ملغاة</div><div class="value" style="color:#dc2626">${cancelledAppts}</div></div>
          <div class="kpi-box"><div class="label">خُدموا بالطابور</div><div class="value">${queueServed}</div></div>
        </div>
      </div>

      ${topServices.length > 0 ? `
      <div class="section">
        <div class="section-title">أعلى الخدمات إيراداً اليوم</div>
        <table>
          <thead><tr><th>الخدمة</th><th>عدد الجلسات</th><th>الإيراد</th></tr></thead>
          <tbody>${servicesRows}</tbody>
        </table>
      </div>
      ` : ''}

      ${dayInvoices.length > 0 ? `
      <div class="section">
        <div class="section-title">الفواتير (${dayInvoices.length} فاتورة)</div>
        <table>
          <thead><tr><th>رقم الفاتورة</th><th>الحالة</th><th>الإجمالي</th><th>المحصل</th><th>الحالة</th></tr></thead>
          <tbody>${invoiceRows}</tbody>
        </table>
      </div>
      ` : ''}

      ${lowStockCount > 0 ? `
      <div class="section">
        <div class="section-title" style="color:#d97706;border-color:#d97706">⚠️ تنبيهات المخزن (${lowStockCount} صنف)</div>
        <table>
          <thead><tr><th>الصنف</th><th>الرصيد الحالي</th><th>الحد الأدنى</th><th>الفئة</th></tr></thead>
          <tbody>
            ${inventory.filter((i) => i.currentStock <= i.reorderLevel).map((i) => `
              <tr>
                <td>${i.name}</td>
                <td style="color:#dc2626;font-weight:700">${i.currentStock} ${i.unit}</td>
                <td>${i.reorderLevel} ${i.unit}</td>
                <td><span class="badge badge-yellow">${i.category}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        تم إنشاء هذا التقرير تلقائياً بواسطة نظام A'clat Clinic المتكامل
        &nbsp;·&nbsp; ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
      </div>
    `;
  };

  const handlePrint = () => {
    printReport(buildPrintHtml());
  };

  const handleSaveAndExportCSV = () => {
    // Save snapshot
    saveHistoricalReport(todayReport);

    // Export invoices CSV
    const csvData = dayInvoices.map((inv: any) => ({
      'رقم الفاتورة': inv.invoiceNumber || '',
      'التاريخ': dayjs(inv.issueDate || inv.createdAt).format('YYYY-MM-DD HH:mm'),
      'الإجمالي': inv.total || 0,
      'المحصل': inv.paidAmount || 0,
      'المتبقي': Number(inv.total || 0) - Number(inv.paidAmount || 0),
      'الخصم': inv.discountAmount || 0,
      'الحالة': inv.status || '',
      'الخدمات': (inv.items || []).map((i: any) => i.description).join(' | '),
    }));

    if (csvData.length > 0) {
      exportCSV(csvData, `تقرير-فواتير-${selectedDate}.csv`);
    }

    // Export expenses CSV if shift exists
    if (shiftIsToday && shift.expenses?.length > 0) {
      const expData = shift.expenses.map((e: any) => ({
        'البيان': e.label,
        'المبلغ': e.amount,
        'الوقت': dayjs(e.at).format('HH:mm'),
      }));
      exportCSV(expData, `تقرير-مصاريف-${selectedDate}.csv`);
    }

    // Also export summary CSV
    const summaryData = [{
      'التاريخ': selectedDate,
      'إجمالي الإيرادات': totalRevenue,
      'المحصل': totalPaid,
      'المتبقي': totalPending,
      'الخصومات': totalDiscount,
      'المصاريف': totalExpenses,
      'صافي الربح': netProfit,
      'نقداً': cashRevenue,
      'بطاقة': cardRevenue,
      'إجمالي المواعيد': dayAppointments.length,
      'مواعيد مكتملة': completedAppts,
      'مواعيد ملغاة': cancelledAppts,
      'عدد الفواتير': dayInvoices.length,
      'تنبيهات مخزن': lowStockCount,
    }];
    exportCSV(summaryData, `ملخص-يومي-${selectedDate}.csv`);
  };

  // ── Invoice table columns ──
  const invoiceColumns = [
    {
      title: 'رقم الفاتورة',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string) => <Text strong style={{ color: '#be185d', fontFamily: 'monospace' }}>{v || '—'}</Text>,
    },
    {
      title: 'الوقت',
      key: 'time',
      render: (_: any, r: any) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(r.issueDate || r.createdAt).format('HH:mm')}
        </Text>
      ),
    },
    {
      title: 'الإجمالي',
      dataIndex: 'total',
      key: 'total',
      render: (v: number) => <Text strong style={{ color: '#0f172a' }}>{Number(v || 0).toLocaleString()} ج.م</Text>,
    },
    {
      title: 'المحصل',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (v: number) => <Text style={{ color: '#059669', fontWeight: 600 }}>{Number(v || 0).toLocaleString()} ج.م</Text>,
    },
    {
      title: 'المتبقي',
      key: 'remaining',
      render: (_: any, r: any) => {
        const rem = Number(r.total || 0) - Number(r.paidAmount || 0);
        return rem > 0
          ? <Text style={{ color: '#dc2626', fontWeight: 600 }}>{rem.toLocaleString()} ج.م</Text>
          : <Tag color="green">مكتملة</Tag>;
      },
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const map: Record<string, { label: string; color: string }> = {
          PAID: { label: 'مدفوعة', color: 'green' },
          paid: { label: 'مدفوعة', color: 'green' },
          PARTIALLY_PAID: { label: 'جزئية', color: 'gold' },
          partially_paid: { label: 'جزئية', color: 'gold' },
          ISSUED: { label: 'صادرة', color: 'blue' },
          issued: { label: 'صادرة', color: 'blue' },
        };
        const cfg = map[s] || { label: s, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  // ── Appointment table columns ──
  const appointmentColumns = [
    {
      title: 'الوقت',
      dataIndex: 'time',
      key: 'time',
      render: (v: string) => <Tag color="default">{v}</Tag>,
    },
    {
      title: 'الحالة / العميلة',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'الخدمة',
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: 'الأخصائي/ة',
      dataIndex: 'doctor',
      key: 'doctor',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'السعر',
      dataIndex: 'priceEgp',
      key: 'priceEgp',
      render: (v: number) => <Text style={{ color: '#0284c7', fontWeight: 600 }}>{Number(v || 0).toLocaleString()} ج.م</Text>,
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const map: Record<string, { label: string; color: string }> = {
          completed: { label: 'مكتملة', color: 'green' },
          waiting: { label: 'انتظار', color: 'gold' },
          in_doctor: { label: 'قيد الجلسة', color: 'blue' },
          cancelled: { label: 'ملغاة', color: 'red' },
        };
        const cfg = map[s] || { label: s, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  // ── History columns ──
  const historyColumns = [
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => <Text strong style={{ color: '#be185d', fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: 'الإيرادات',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (v: number) => <Text strong style={{ color: '#059669' }}>{Number(v).toLocaleString()} ج.م</Text>,
    },
    {
      title: 'المحصل',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      render: (v: number) => <Text style={{ color: '#0284c7', fontWeight: 600 }}>{Number(v).toLocaleString()} ج.م</Text>,
    },
    {
      title: 'المصاريف',
      dataIndex: 'totalExpenses',
      key: 'totalExpenses',
      render: (v: number) => <Text style={{ color: '#dc2626' }}>{Number(v).toLocaleString()} ج.م</Text>,
    },
    {
      title: 'صافي الربح',
      dataIndex: 'netProfit',
      key: 'netProfit',
      render: (v: number) => (
        <Text style={{ color: v >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
          {Number(v).toLocaleString()} ج.م
        </Text>
      ),
    },
    {
      title: 'الفواتير',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
      render: (v: number) => <Tag color="purple">{v} فاتورة</Tag>,
    },
    {
      title: 'المواعيد',
      dataIndex: 'appointmentsTotal',
      key: 'appointmentsTotal',
      render: (v: number) => <Tag color="blue">{v} موعد</Tag>,
    },
    {
      title: 'إجراءات',
      key: 'actions',
      render: (_: any, r: DailyReport) => (
        <Button
          size="small"
          type="text"
          icon={<Download size={13} />}
          onClick={() => {
            const data = [{
              'التاريخ': r.date,
              'إجمالي الإيرادات': r.totalRevenue,
              'المحصل': r.totalPaid,
              'المتبقي': r.totalPending,
              'الخصومات': r.totalDiscount,
              'المصاريف': r.totalExpenses,
              'صافي الربح': r.netProfit,
              'نقداً': r.cashRevenue,
              'بطاقة': r.cardRevenue,
              'المواعيد': r.appointmentsTotal,
              'مكتملة': r.appointmentsCompleted,
              'الفواتير': r.invoiceCount,
            }];
            exportCSV(data, `تقرير-${r.date}.csv`);
          }}
        >
          CSV
        </Button>
      ),
    },
  ];

  const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 14,
          border: 'none',
          boxShadow: '0 8px 24px rgba(67,56,202,0.25)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="center" size={12}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={26} color="#fff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
                  📊 التقارير والإحصائيات اليومية
                </Title>
                <Text style={{ color: '#c7d2fe', fontSize: 13 }}>
                  ملخص إيرادات ومصاريف وفواتير ومواعيد العيادة — مع تصدير PDF وExcel
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space size={8} wrap>
              <DatePicker
                value={dayjs(selectedDate)}
                onChange={(d) => d && setSelectedDate(d.format('YYYY-MM-DD'))}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8 }}
                allowClear={false}
              />
              <Button
                icon={<Printer size={15} />}
                onClick={handlePrint}
                style={{
                  background: '#fff',
                  color: '#312e81',
                  fontWeight: 700,
                  borderRadius: 8,
                  border: 'none',
                }}
              >
                طباعة PDF
              </Button>
              <Button
                icon={<Download size={15} />}
                onClick={handleSaveAndExportCSV}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                }}
              >
                Excel / CSV
              </Button>
              <Button
                icon={<RefreshCw size={14} />}
                size="small"
                type="text"
                style={{ color: '#c7d2fe' }}
                onClick={() => window.location.reload()}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ── Date display ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Calendar size={16} color="#6366f1" />
        <Title level={5} style={{ margin: 0, color: '#312e81' }}>
          {dayjs(selectedDate).locale('ar').format('dddd، D MMMM YYYY')}
        </Title>
        {selectedDate === dayjs().format('YYYY-MM-DD') && (
          <Tag color="purple" style={{ fontWeight: 700 }}>اليوم</Tag>
        )}
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as any)}
          options={[
            { label: 'تقرير اليوم', value: 'today' },
            { label: 'السجل التاريخي', value: 'history' },
          ]}
          style={{ marginRight: 'auto' }}
        />
      </div>

      {viewMode === 'history' ? (
        /* ── Historical view ─────────────────────────────────── */
        <Card
          style={{ borderRadius: 12, border: '1px solid #e0e7ff' }}
          title={
            <Space>
              <FileText size={16} color="#6366f1" />
              <Text strong>السجل التاريخي للتقارير (آخر 90 يوم)</Text>
            </Space>
          }
        >
          {historicalReports.length === 0 ? (
            <Alert
              type="info"
              showIcon
              message="لا توجد تقارير محفوظة بعد"
              description="اضغط على زر «Excel / CSV» في أي يوم وسيتم حفظ لقطة كاملة تلقائياً في السجل."
            />
          ) : (
            <Table
              dataSource={historicalReports}
              columns={historyColumns}
              rowKey="date"
              size="small"
              pagination={{ pageSize: 15 }}
              summary={(pageData) => {
                const sumRev = pageData.reduce((s, r) => s + r.totalRevenue, 0);
                const sumPaid = pageData.reduce((s, r) => s + r.totalPaid, 0);
                const sumExp = pageData.reduce((s, r) => s + r.totalExpenses, 0);
                const sumNet = pageData.reduce((s, r) => s + r.netProfit, 0);
                return (
                  <Table.Summary.Row style={{ background: '#f0f0ff', fontWeight: 700 }}>
                    <Table.Summary.Cell index={0}>المجموع</Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text style={{ color: '#059669', fontWeight: 700 }}>{sumRev.toLocaleString()} ج.م</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}><Text style={{ color: '#0284c7', fontWeight: 700 }}>{sumPaid.toLocaleString()} ج.م</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}><Text style={{ color: '#dc2626', fontWeight: 700 }}>{sumExp.toLocaleString()} ج.م</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}><Text style={{ color: sumNet >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>{sumNet.toLocaleString()} ج.م</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} />
                    <Table.Summary.Cell index={6} />
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                );
              }}
            />
          )}
        </Card>
      ) : (
        /* ── Daily Report view ────────────────────────────────── */
        <>
          {/* KPI Cards */}
          <Row gutter={[14, 14]}>
            <Col xs={12} sm={6}>
              <Card
                size="small"
                style={{ borderRadius: 12, border: '2px solid #d1fae5', background: '#f0fdf4' }}
                bodyStyle={{ padding: '16px 18px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <TrendingUp size={16} color="#059669" />
                  <Text type="secondary" style={{ fontSize: 12 }}>إجمالي الإيرادات</Text>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                  {totalRevenue.toLocaleString()}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>ج.م · {dayInvoices.length} فاتورة</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card
                size="small"
                style={{ borderRadius: 12, border: '2px solid #bfdbfe', background: '#eff6ff' }}
                bodyStyle={{ padding: '16px 18px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <DollarSign size={16} color="#0284c7" />
                  <Text type="secondary" style={{ fontSize: 12 }}>المحصل فعلياً</Text>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0284c7', lineHeight: 1.1 }}>
                  {totalPaid.toLocaleString()}
                </div>
                <div style={{ marginTop: 6 }}>
                  <Progress percent={collectionRate} size="small" strokeColor="#0284c7" showInfo={false} />
                  <Text type="secondary" style={{ fontSize: 11 }}>{collectionRate}% معدل التحصيل</Text>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card
                size="small"
                style={{ borderRadius: 12, border: '2px solid #fecaca', background: '#fef2f2' }}
                bodyStyle={{ padding: '16px 18px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <TrendingDown size={16} color="#dc2626" />
                  <Text type="secondary" style={{ fontSize: 12 }}>المصاريف</Text>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
                  {totalExpenses.toLocaleString()}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>ج.م &nbsp;·&nbsp; خصم: {totalDiscount.toLocaleString()} ج.م</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  border: `2px solid ${netProfit >= 0 ? '#a7f3d0' : '#fecaca'}`,
                  background: netProfit >= 0 ? '#ecfdf5' : '#fef2f2',
                }}
                bodyStyle={{ padding: '16px 18px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <BarChart3 size={16} color={netProfit >= 0 ? '#059669' : '#dc2626'} />
                  <Text type="secondary" style={{ fontSize: 12 }}>صافي الربح</Text>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: netProfit >= 0 ? '#059669' : '#dc2626', lineHeight: 1.1 }}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>ج.م بعد خصم المصاريف</Text>
              </Card>
            </Col>
          </Row>

          {/* Secondary KPIs */}
          <Row gutter={[14, 14]}>
            <Col xs={8} sm={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #e0e7ff' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4338ca' }}>{dayAppointments.length}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>مواعيد</Text>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #d1fae5' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{completedAppts}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>مكتملة</Text>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{cancelledAppts}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>ملغاة</Text>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #fbcfe8' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#be185d' }}>{queueServed}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>خُدموا</Text>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #c7d2fe' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4338ca' }}>{cashRevenue.toLocaleString()}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>نقداً ج.م</Text>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7' }}>{cardRevenue.toLocaleString()}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>بطاقة ج.م</Text>
              </Card>
            </Col>
          </Row>

          {/* Doctor Commissions & Package Liability Strip */}
          <Row gutter={[14, 14]}>
            <Col xs={24} sm={12}>
              <Card size="small" style={{ borderRadius: 10, border: '1px solid #fed7aa', background: '#fffbeb' }}>
                <Row justify="space-between" align="middle">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>مستحقات الأطباء المكتسبة عن جلسات اليوم</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>
                      {totalDoctorCommissions.toLocaleString()} ج.م
                    </div>
                  </div>
                  <Tag color="orange">{dayDoctorEarnings.length} جلسة منفذة</Tag>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" style={{ borderRadius: 10, border: '1px solid #e9d5ff', background: '#faf5ff' }}>
                <Row justify="space-between" align="middle">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>التزامات الباقات غير المنفذة (Package Liability)</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#7e22ce' }}>
                      {totalPackageLiability.toLocaleString()} ج.م
                    </div>
                  </div>
                  <Tag color="purple">جلسات مدفوعة مقدماً</Tag>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Alerts */}
          {lowStockCount > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<AlertTriangle size={16} />}
              message={`⚠️ ${lowStockCount} صنف في المخزن عند أو دون الحد الأدنى — يُرجى إعادة الطلب`}
              style={{ borderRadius: 10 }}
            />
          )}

          {!shiftIsToday && (
            <Alert
              type="info"
              showIcon
              message="الكاشير: لا يوجد شفت مفتوح لهذا اليوم"
              description="بيانات المصاريف ونقداً / بطاقة ستظهر بعد فتح الشفت من صفحة الكاشير."
              style={{ borderRadius: 10 }}
            />
          )}

          <Row gutter={[14, 14]}>
            {/* Top Services */}
            <Col xs={24} md={10}>
              <Card
                style={{ borderRadius: 12, border: '1px solid #e0e7ff', height: '100%' }}
                title={
                  <Space>
                    <TrendingUp size={15} color="#4338ca" />
                    <Text strong>أعلى الخدمات إيراداً</Text>
                  </Space>
                }
                extra={<Tag color="purple">{topServices.length} خدمة</Tag>}
              >
                {topServices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    <BarChart3 size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>لا توجد فواتير مسجلة بعد</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topServices.map((s, i) => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : '#fce7f3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : '#be185d',
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.name}
                          </div>
                          <Progress
                            percent={topServices[0].revenue > 0 ? Math.round((s.revenue / topServices[0].revenue) * 100) : 0}
                            size="small"
                            showInfo={false}
                            strokeColor="#4338ca"
                          />
                        </div>
                        <div style={{ textAlign: 'left', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{s.revenue.toLocaleString()} ج.م</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.count} جلسة</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>

            {/* Cashier Shift Summary */}
            <Col xs={24} md={14}>
              <Card
                style={{ borderRadius: 12, border: '1px solid #e0e7ff', height: '100%' }}
                title={
                  <Space>
                    <DollarSign size={15} color="#4338ca" />
                    <Text strong>ملخص الكاشير</Text>
                  </Space>
                }
                extra={
                  shiftIsToday
                    ? <Tag color={shift.status === 'open' ? 'green' : 'default'}>{shift.status === 'open' ? '🟢 شفت مفتوح' : '⚫ مقفول'}</Tag>
                    : <Tag color="default">لا يوجد شفت</Tag>
                }
              >
                {shiftIsToday ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Row gutter={[10, 10]}>
                      <Col span={8}>
                        <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{cashRevenue.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>نقداً ج.م</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ padding: '12px', background: '#eff6ff', borderRadius: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>{cardRevenue.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>بطاقة ج.م</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ padding: '12px', background: '#fef2f2', borderRadius: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{totalExpenses.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>مصاريف ج.م</div>
                        </div>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '4px 0' }} />
                    {shift.payments?.length > 0 ? (
                      <Table
                        dataSource={shift.payments}
                        size="small"
                        pagination={false}
                        rowKey="id"
                        columns={[
                          { title: 'العميل', dataIndex: 'patientName', key: 'patientName', render: (v: string) => <Text strong style={{ fontSize: 12 }}>{v}</Text> },
                          { title: 'الخدمة', dataIndex: 'service', key: 'service', render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> },
                          { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>{v.toLocaleString()} ج.م</Text> },
                          { title: 'طريقة', dataIndex: 'method', key: 'method', render: (v: string) => <Tag color={v === 'cash' ? 'green' : 'blue'} style={{ fontSize: 10 }}>{v === 'cash' ? 'نقدي' : 'بطاقة'}</Tag> },
                        ]}
                        scroll={{ y: 160 }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8' }}>
                        <Clock size={24} style={{ opacity: 0.3 }} />
                        <div style={{ fontSize: 12, marginTop: 4 }}>لا توجد مدفوعات مسجلة في الشفت</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    <Users size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>لا يوجد شفت كاشير لهذا اليوم</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Invoices Table */}
          <Card
            style={{ borderRadius: 12, border: '1px solid #e0e7ff' }}
            title={
              <Space>
                <FileText size={15} color="#4338ca" />
                <Text strong>فواتير اليوم</Text>
                <Tag color="purple">{dayInvoices.length} فاتورة</Tag>
              </Space>
            }
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>إجمالي: </Text>
                <Text strong style={{ color: '#059669' }}>{totalRevenue.toLocaleString()} ج.م</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>· محصل: </Text>
                <Text strong style={{ color: '#0284c7' }}>{totalPaid.toLocaleString()} ج.م</Text>
              </Space>
            }
          >
            {dayInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <FileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>لا توجد فواتير مسجلة لهذا اليوم</div>
                <Text type="secondary" style={{ fontSize: 12 }}>أضف فواتير من صفحة الفواتير والمالية</Text>
              </div>
            ) : (
              <Table
                dataSource={dayInvoices}
                columns={invoiceColumns}
                rowKey="id"
                size="small"
                pagination={false}
                summary={() => (
                  <Table.Summary.Row style={{ background: '#f0f0ff', fontWeight: 700 }}>
                    <Table.Summary.Cell index={0}>المجموع</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} />
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: '#0f172a' }}>{totalRevenue.toLocaleString()} ج.م</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: '#059669' }}>{totalPaid.toLocaleString()} ج.م</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      {totalPending > 0
                        ? <Text strong style={{ color: '#dc2626' }}>{totalPending.toLocaleString()} ج.م</Text>
                        : <Tag color="green">مكتمل</Tag>
                      }
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} />
                  </Table.Summary.Row>
                )}
              />
            )}
          </Card>

          {/* Appointments Table */}
          <Card
            style={{ borderRadius: 12, border: '1px solid #e0e7ff' }}
            title={
              <Space>
                <Calendar size={15} color="#4338ca" />
                <Text strong>مواعيد اليوم</Text>
                <Tag color="blue">{dayAppointments.length} موعد</Tag>
              </Space>
            }
            extra={
              <Space size={4}>
                <Tag color="green" icon={<CheckCircle2 size={11} />}>{completedAppts} مكتملة</Tag>
                <Tag color="red">{cancelledAppts} ملغاة</Tag>
              </Space>
            }
          >
            {dayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <Calendar size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>لا توجد مواعيد لهذا اليوم</div>
              </div>
            ) : (
              <Table
                dataSource={dayAppointments}
                columns={appointmentColumns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>

          {/* Low Stock Alerts */}
          {lowStockCount > 0 && (
            <Card
              style={{ borderRadius: 12, border: '2px solid #fde68a', background: '#fffbeb' }}
              title={
                <Space>
                  <AlertTriangle size={15} color="#d97706" />
                  <Text strong style={{ color: '#d97706' }}>تنبيهات انخفاض المخزن</Text>
                  <Tag color="orange">{lowStockCount} صنف</Tag>
                </Space>
              }
            >
              <Table
                dataSource={inventory.filter((i) => i.currentStock <= i.reorderLevel)}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'الصنف', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
                  { title: 'الرصيد', dataIndex: 'currentStock', key: 'currentStock', render: (v: number, r: any) => <Text style={{ color: '#dc2626', fontWeight: 700 }}>{v} {r.unit}</Text> },
                  { title: 'الحد الأدنى', dataIndex: 'reorderLevel', key: 'reorderLevel', render: (v: number, r: any) => <Text>{v} {r.unit}</Text> },
                  { title: 'الفئة', dataIndex: 'category', key: 'category', render: (v: string) => <Tag color="orange">{v}</Tag> },
                  {
                    title: 'تاريخ الانتهاء',
                    dataIndex: 'expiryDate',
                    key: 'expiryDate',
                    render: (v: string) => {
                      if (!v) return '—';
                      const days = dayjs(v).diff(dayjs(), 'day');
                      return <Tag color={days < 0 ? 'red' : days < 30 ? 'orange' : 'green'}>{v}</Tag>;
                    }
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
