import { useEffect, useState } from 'react';
import {
  Card,
  Input,
  Button,
  Tag,
  Space,
  AutoComplete,
  message,
  Alert,
  Typography,
  Empty,
  Spin,
  Tooltip,
  Popconfirm,
} from 'antd';
import { Save, Trash2, Pill, Star, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { IDrug, PrescriptionWarning } from '@clinic/shared-types';
import dayjs from 'dayjs';
import { PrescriptionPresets, type PresetItem } from './PrescriptionPresets';

const { Text } = Typography;

interface PrescriptionCardProps {
  patientId: string;
  visitId?: string;
}

interface RxItem {
  key: string;
  drugId?: string;
  drugName: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
}

interface FavoriteDrug {
  drugId: string;
  usageCount: number;
  name: string;
  genericName?: string;
  strength?: string;
  commonDoses?: string;
}

interface HistoryRx {
  id: string;
  issuedAt: string;
  status: string;
  notes?: string;
  items: Array<{ drugName: string; dose?: string; frequency?: string; duration?: string; quantity?: number }>;
}

const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'info'> = {
  life_threatening: 'error',
  major: 'error',
  moderate: 'warning',
  minor: 'info',
};

let rxKeyCounter = 0;
const nextKey = () => `rx-${Date.now()}-${rxKeyCounter++}`;

export function PrescriptionCard({ patientId, visitId }: PrescriptionCardProps) {
  const [drugs, setDrugs] = useState<IDrug[]>([]);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<FavoriteDrug[]>([]);
  const [history, setHistory] = useState<HistoryRx[]>([]);
  const [items, setItems] = useState<RxItem[]>([]);
  const [warnings, setWarnings] = useState<PrescriptionWarning[]>([]);
  const [loadingWarn, setLoadingWarn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const applyPreset = (presetItems: PresetItem[]) => {
    const next: RxItem[] = presetItems.map((p) => ({
      key: nextKey(),
      drugName: p.drugName,
      dose: p.dose,
      frequency: p.frequency,
      duration: p.duration,
    }));
    setItems((prev) => {
      const merged = [...prev, ...next];
      recheck(merged);
      return merged;
    });
  };

  const loadFavorites = async () => {
    try {
      const res: any = await apiClient.get('/prescriptions/favorites');
      setFavorites(res.data ?? []);
    } catch {
      setFavorites([]);
    }
  };

  const loadHistory = async () => {
    try {
      const res: any = await apiClient.get(`/prescriptions?patientId=${patientId}`);
      setHistory(res.data ?? []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadFavorites();
    loadHistory();
  }, [patientId]);

  const searchDrugs = async (q: string) => {
    setSearching(true);
    try {
      const res: any = await apiClient.get(`/drugs?q=${encodeURIComponent(q)}`);
      setDrugs(res.data ?? []);
    } catch {
      setDrugs([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchDrugs(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const recheck = async (next: RxItem[]) => {
    if (next.length === 0) {
      setWarnings([]);
      return;
    }
    setLoadingWarn(true);
    try {
      const res: any = await apiClient.post('/prescriptions/check', {
        patientId,
        items: next.map((i) => ({ drugId: i.drugId, drugName: i.drugName })),
      });
      setWarnings(res.data ?? []);
    } catch {
      setWarnings([]);
    } finally {
      setLoadingWarn(false);
    }
  };

  const addItem = (drug: IDrug | FavoriteDrug) => {
    const drugId = 'drugId' in drug ? drug.drugId : drug.id;
    const item: RxItem = {
      key: nextKey(),
      drugId,
      drugName: drug.name,
      dose: 'strength' in drug && drug.strength ? drug.strength : undefined,
      frequency: 'once daily',
      duration: '7 days',
    };
    const next = [...items, item];
    setItems(next);
    recheck(next);
  };

  const updateItem = (key: string, patch: Partial<RxItem>) => {
    const next = items.map((i) => (i.key === key ? { ...i, ...patch } : i));
    setItems(next);
    recheck(next);
  };

  const removeItem = (key: string) => {
    const next = items.filter((i) => i.key !== key);
    setItems(next);
    recheck(next);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      message.warning('Add at least one medication to the prescription');
      return;
    }
    setSaving(true);
    try {
      const res: any = await apiClient.post('/prescriptions', {
        patientId,
        visitId,
        items: items.map((i) => ({
          drugId: i.drugId,
          drugName: i.drugName,
          dose: i.dose,
          frequency: i.frequency,
          duration: i.duration,
          quantity: i.quantity,
        })),
      });
      const found: PrescriptionWarning[] = res.data?.warnings ?? [];
      setWarnings(found);
      setItems([]);
      await loadFavorites();
      await loadHistory();
      if (found.some((w) => w.severity === 'major' || w.severity === 'life_threatening')) {
        message.warning('Prescription saved — review the safety warnings below', 6);
      } else {
        message.success('Prescription issued and saved');
      }
    } catch (e: any) {
      message.error(e?.message ?? 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const options = drugs
    .filter((d) => !items.some((i) => i.drugId === d.id))
    .map((d) => ({
      value: d.name,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span>
            <strong>{d.name}</strong>
            {d.genericName ? <span style={{ color: '#64748B', fontSize: 11 }}> — {d.genericName}</span> : null}
          </span>
          <Tag style={{ margin: 0, fontSize: 10 }}>{d.strength || d.form || d.category}</Tag>
        </div>
      ),
      drug: d,
    }));

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill size={15} color="#2563EB" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Smart Prescription</span>
        </div>
      }
      extra={
        <Space size={6}>
          <PrescriptionPresets onApplyPreset={applyPreset} />
          <Button
            size="small"
            type="primary"
            icon={<Save size={13} />}
            loading={saving}
            onClick={handleSave}
            disabled={items.length === 0}
            style={{ borderRadius: 8 }}
          >
            Issue Rx
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}

    >
      {/* Favorites — 1-click prescribing */}
      {favorites.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Star size={11} color="#F59E0B" /> MOST USED BY YOU
          </Text>
          <Space size={[4, 4]} wrap>
            {favorites.slice(0, 6).map((f) => (
              <Tooltip key={f.drugId} title={f.commonDoses ? `Common: ${f.commonDoses}` : `Used ${f.usageCount}x`}>
                <Button size="small" onClick={() => addItem(f)} style={{ borderRadius: 16, fontSize: 11 }}>
                  {f.name}
                </Button>
              </Tooltip>
            ))}
          </Space>
        </div>
      )}

      {/* Drug search */}
      <AutoComplete
        style={{ width: '100%', marginBottom: 10 }}
        options={options}
        value={search}
        onSelect={(value) => {
          const drug = options.find((o) => o.value === value)?.drug;
          if (drug) {
            addItem(drug);
            setSearch('');
          }
        }}
        onChange={setSearch}
        notFoundContent={searching ? <Spin size="small" /> : search && search.trim() ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No drug found" /> : null}
        placeholder="Search drug catalog (e.g. Amoxil, Paracetamol, Aspirin…)"
      />

      {/* Items */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {items.map((item, idx) => (
            <div
              key={item.key}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 12, color: '#0F172A' }}>{idx + 1}. {item.drugName}</strong>
                  {item.drugId ? null : <Tag color="gold" style={{ marginInlineStart: 6, fontSize: 10 }}>free text</Tag>}
                </div>
                <Popconfirm title="Remove this medication?" onConfirm={() => removeItem(item.key)}>
                  <Button size="small" type="text" icon={<Trash2 size={13} />} danger />
                </Popconfirm>
              </div>
              <Space size={6} wrap style={{ marginTop: 6 }}>
                <Input
                  size="small"
                  placeholder="Dose"
                  value={item.dose}
                  onChange={(e) => updateItem(item.key, { dose: e.target.value })}
                  style={{ width: 110 }}
                />
                <Input
                  size="small"
                  placeholder="Frequency"
                  value={item.frequency}
                  onChange={(e) => updateItem(item.key, { frequency: e.target.value })}
                  style={{ width: 120 }}
                />
                <Input
                  size="small"
                  placeholder="Duration"
                  value={item.duration}
                  onChange={(e) => updateItem(item.key, { duration: e.target.value })}
                  style={{ width: 90 }}
                />
              </Space>
            </div>
          ))}
        </div>
      )}

      {/* Safety warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: warnings.some((w) => w.severity === 'major' || w.severity === 'life_threatening') ? '#DC2626' : '#B45309',
              marginBottom: 6,
            }}
          >
            <ShieldAlert size={12} /> SAFETY ALERTS {loadingWarn ? <Spin size="small" /> : null}
          </Text>
          {warnings.map((w, i) => (
            <Alert
              key={i}
              type={SEVERITY_COLOR[w.severity]}
              showIcon
              message={w.message}
              style={{ marginBottom: 6, fontSize: 11, borderRadius: 8 }}
            />
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 10 }}>
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>PREVIOUS PRESCRIPTIONS</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, maxHeight: 150, overflowY: 'auto' }}>
            {history.map((rx) => (
              <div key={rx.id} style={{ padding: '6px 8px', borderRadius: 6, backgroundColor: '#FFF', border: '1px solid #EEF2F7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>
                    {dayjs(rx.issuedAt).format('DD MMM YYYY')}
                  </Text>
                  <Tag color={rx.status === 'cancelled' ? 'red' : 'blue'} style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>
                    {rx.status}
                  </Tag>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                  {rx.items.map((it, i) => (
                    <span key={i}>
                      {it.drugName}
                      {it.dose ? ` ${it.dose}` : ''}
                      {i < rx.items.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}