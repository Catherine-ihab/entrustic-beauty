import { useCallback, useEffect, useState } from 'react';
import { Button, DatePicker, Modal, Table, Tag, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarClock, RefreshCw, Video } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { TelemedRoomListItem } from '@clinic/shared-types';
import { TelemedRoom } from './TelemedRoom';

const errMsg = (e: any) => e?.errors?.[0]?.message ?? e?.message ?? 'Something went wrong';

const PHASE_TAG: Record<string, { text: string; color: string }> = {
  not_started: { text: 'Not started', color: 'default' },
  waiting: { text: 'Patient waiting', color: 'processing' },
  provider_waiting: { text: 'Clinician waiting', color: 'warning' },
  connected: { text: 'In session', color: 'success' },
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'blue',
  confirmed: 'geekblue',
  in_progress: 'purple',
  completed: 'green',
  cancelled: 'red',
  no_show: 'volcano',
};

export function TelemedicineManager() {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [rooms, setRooms] = useState<TelemedRoomListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState<TelemedRoomListItem | null>(null);

  const load = useCallback(async (day: Dayjs) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/telemedicine/rooms?date=${day.format('YYYY-MM-DD')}`);
      setRooms(res?.data ?? []);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(date);
    const timer = setInterval(() => void load(date), 10000);
    return () => clearInterval(timer);
  }, [date, load]);

  const columns = [
    {
      title: 'Time',
      key: 'time',
      width: 140,
      render: (_: unknown, r: TelemedRoomListItem) => (
        <span style={{ fontFamily: 'monospace' }}>
          {dayjs(r.startTime).format('HH:mm')} – {dayjs(r.endTime).format('HH:mm')}
        </span>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: unknown, r: TelemedRoomListItem) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.patientName}</div>
          {r.patientPhone && <div style={{ fontSize: 12, opacity: 0.6 }}>{r.patientPhone}</div>}
        </div>
      ),
    },
    {
      title: 'Clinician',
      dataIndex: 'providerName',
      key: 'provider',
    },
    {
      title: 'Room',
      dataIndex: 'roomCode',
      key: 'room',
      width: 110,
      render: (code: string | null) => (code ? <Tag color="cyan">{code}</Tag> : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>,
    },
    {
      title: 'Room state',
      dataIndex: 'phase',
      key: 'phase',
      width: 150,
      render: (phase: string) => {
        const p = PHASE_TAG[phase] ?? PHASE_TAG.not_started;
        return <Tag color={p.color}>{p.text}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      render: (_: unknown, r: TelemedRoomListItem) => (
        <Button
          type="primary"
          size="small"
          icon={<Video size={14} />}
          disabled={r.status === 'cancelled' || r.status === 'completed' || r.status === 'no_show'}
          onClick={() => setActiveRoom(r)}
        >
          Open room
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <CalendarClock size={22} />
        <h2 style={{ margin: 0 }}>Telemedicine rooms</h2>
        <div style={{ flex: 1 }} />
        <DatePicker
          value={date}
          allowClear={false}
          onChange={(d) => d && setDate(d)}
        />
        <Button icon={<RefreshCw size={14} />} onClick={() => void load(date)} loading={loading}>
          Refresh
        </Button>
      </div>

      <Table<TelemedRoomListItem>
        rowKey="appointmentId"
        loading={loading}
        columns={columns}
        dataSource={rooms}
        pagination={false}
        locale={{
          emptyText: 'No telemedicine visits on this day — book one from the patient portal.',
        }}
      />

      <Modal
        open={!!activeRoom}
        title={null}
        footer={null}
        width={1000}
        destroyOnClose
        onCancel={() => setActiveRoom(null)}
        style={{ top: 20 }}
      >
        {activeRoom && (
          <TelemedRoom
            api={apiClient}
            basePath={`/telemedicine/rooms/${activeRoom.appointmentId}`}
            role="provider"
            title={`Telemedicine visit — ${activeRoom.patientName}`}
            subtitle={`${dayjs(activeRoom.startTime).format('ddd, MMM D · HH:mm')} · ${activeRoom.roomCode ?? ''} · ${activeRoom.providerName}`}
            onBack={() => setActiveRoom(null)}
          />
        )}
      </Modal>
    </div>
  );
}
