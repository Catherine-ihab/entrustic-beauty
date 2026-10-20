import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Modal,
  Form,
  Typography,
  message,
  Alert,
  DatePicker,
  InputNumber,
  Segmented,
  Card,
  Row,
  Col,
  Popconfirm,
  Select,
} from 'antd';
import {
  Plus,
  Search,
  Download,
  Minus,
  Trash2,
  Edit2,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useLang } from '../../lib/useLang';
import {
  ClinicInventoryItem,
  InventoryCategory,
  INVENTORY_CATEGORIES,
  getClinicInventory,
  saveInventoryItem,
  receiveInventoryStock,
  consumeInventoryStock,
  deleteInventoryItem,
  subscribeToInventory,
} from '../../lib/clinicInventory';

const { Title, Text } = Typography;

function daysUntil(dateStr: string): number {
  return dayjs(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day');
}

function expiryTag(expiry?: string) {
  if (!expiry) return <Tag>بدون صلاحية</Tag>;
  const d = daysUntil(expiry);
  if (d < 0) return <Tag color="red">منتهي الصلاحية ({dayjs(expiry).format('YYYY/MM/DD')})</Tag>;
  if (d <= 45) return <Tag color="error">ينتهي خلال {d} يوم ({dayjs(expiry).format('YYYY/MM/DD')})</Tag>;
  if (d <= 90) return <Tag color="orange">ينتهي خلال {d} يوم</Tag>;
  return <Tag color="green">{dayjs(expiry).format('YYYY/MM/DD')}</Tag>;
}

export function InventoryManager() {
  const [items, setItems] = useState<ClinicInventoryItem[]>(getClinicInventory);
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClinicInventoryItem | null>(null);
  const [recvItem, setRecvItem] = useState<ClinicInventoryItem | null>(null);
  const [consumeItem, setConsumeItem] = useState<ClinicInventoryItem | null>(null);
  const [addForm] = Form.useForm();
  const [recvForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const { tx } = useLang();

  useEffect(() => {
    const unsub = subscribeToInventory(() => {
      setItems(getClinicInventory());
    });
    return () => unsub();
  }, []);

  // Filtered rows
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const search = q.toLowerCase().trim();
      const matchQ =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.nameEn.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        (item.batchLotNumber && item.batchLotNumber.toLowerCase().includes(search));
      return matchCat && matchQ;
    });
  }, [items, selectedCategory, q]);

  // Alerts
  const lowStockItems = useMemo(() => items.filter((i) => i.currentStock <= i.reorderLevel), [items]);

  const handleAddOrEdit = (values: any) => {
    const newItem: ClinicInventoryItem = {
      id: editItem ? editItem.id : `inv-${Date.now()}`,
      name: values.name,
      nameEn: values.nameEn || values.name,
      sku: values.sku || `SKU-${Date.now().toString().slice(-5)}`,
      category: values.category,
      currentStock: Number(values.currentStock) || 0,
      unit: values.unit || 'عبوة',
      reorderLevel: Number(values.reorderLevel) || 5,
      batchLotNumber: values.batchLotNumber || 'LOT-NEW',
      expiryDate: values.expiryDate ? dayjs(values.expiryDate).format('YYYY-MM-DD') : dayjs().add(18, 'month').format('YYYY-MM-DD'),
      unitCostEgp: Number(values.unitCostEgp) || 0,
      clinicPriceEgp: Number(values.clinicPriceEgp) || 0,
      notes: values.notes || '',
    };

    saveInventoryItem(newItem);
    setItems(getClinicInventory());
    setAddOpen(false);
    setEditItem(null);
    addForm.resetFields();
    message.success(editItem ? '✅ تم تحديث بيانات المستحضر والمخزون' : '✅ تم إضافة المستحضر إلى مخزن العيادة بنجاح');
  };

  const handleReceiveStock = (values: any) => {
    if (!recvItem) return;
    const qty = Number(values.quantity) || 1;
    const exp = values.expiryDate ? dayjs(values.expiryDate).format('YYYY-MM-DD') : undefined;
    receiveInventoryStock(recvItem.id, qty, values.batchLotNumber, exp);
    setItems(getClinicInventory());
    setRecvItem(null);
    recvForm.resetFields();
    message.success(`✅ تم استلام وتوريد ${qty} (${recvItem.unit}) وتحديث رصيد المخزون`);
  };

  const handleConsumeStock = (values: any) => {
    if (!consumeItem) return;
    const qty = Number(values.quantity) || 1;
    if (qty > consumeItem.currentStock) {
      message.error('الكمية المطلوبة أكبر من الرصيد المتوفر بالمخزن!');
      return;
    }
    consumeInventoryStock(consumeItem.id, qty, values.reason);
    setItems(getClinicInventory());
    setConsumeItem(null);
    consumeForm.resetFields();
    message.success(`✅ تم صرف ${qty} (${consumeItem.unit}) وخصمها من رصيد المستلزمات`);
  };

  const handleDelete = (id: string) => {
    deleteInventoryItem(id);
    setItems(getClinicInventory());
    message.success('تم حذف الصنف من المخزن');
  };

  const openEdit = (item: ClinicInventoryItem) => {
    setEditItem(item);
    addForm.setFieldsValue({
      ...item,
      expiryDate: item.expiryDate ? dayjs(item.expiryDate) : undefined,
    });
    setAddOpen(true);
  };

  const columns = [
    {
      title: tx('المستحضر / الصنف الطبي', 'Item Name & SKU'),
      key: 'name',
      render: (_: any, r: ClinicInventoryItem) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{r.nameEn}</span>
            <span>•</span>
            <Tag color="default" style={{ fontSize: 11, margin: 0 }}>{r.sku}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: tx('القسم / التخصص', 'Specialty Category'),
      dataIndex: 'category',
      key: 'category',
      width: 170,
      render: (cat: InventoryCategory) => {
        let color = 'purple';
        if (cat === 'حقن وبوتوكس وفيلر') color = 'magenta';
        if (cat === 'عناية بالبشرة وماسكات') color = 'cyan';
        if (cat === 'مراهم وكريمات ما بعد الجلسات') color = 'green';
        if (cat === 'ليزر وتبريد') color = 'blue';
        if (cat === 'عناية بالجسم وسكراب') color = 'gold';
        return <Tag color={color} style={{ fontWeight: 600 }}>{cat}</Tag>;
      },
    },
    {
      title: tx('الرصيد المتاح', 'Current Stock'),
      key: 'stock',
      width: 150,
      render: (_: any, r: ClinicInventoryItem) => {
        const isLow = r.currentStock <= r.reorderLevel;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: isLow ? '#dc2626' : '#059669' }}>
                {r.currentStock}
              </span>
              <span style={{ fontSize: 12, color: '#475569' }}>{r.unit}</span>
            </div>
            {isLow && (
              <Tag color="error" style={{ fontSize: 11, marginTop: 2 }}>
                ⚠️ نقص مخزون (الحد {r.reorderLevel})
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: tx('رقم التشغيلة والصلاحية', 'Lot # & Expiry'),
      key: 'lot',
      width: 180,
      render: (_: any, r: ClinicInventoryItem) => (
        <div>
          <div style={{ fontSize: 12, color: '#334155' }}>
            تشغيلة: <Text code>{r.batchLotNumber || '—'}</Text>
          </div>
          <div style={{ marginTop: 2 }}>{expiryTag(r.expiryDate)}</div>
        </div>
      ),
    },
    {
      title: tx('تكلفة وسعر العيادة', 'Unit Cost & Price'),
      key: 'cost',
      width: 140,
      render: (_: any, r: ClinicInventoryItem) => (
        <div style={{ fontSize: 12 }}>
          <div>تكلفة: <strong style={{ color: '#475569' }}>{r.unitCostEgp.toLocaleString()} ج.م</strong></div>
          {r.clinicPriceEgp && (
            <div style={{ color: '#be185d', fontWeight: 600 }}>سعر: {r.clinicPriceEgp.toLocaleString()} ج.م</div>
          )}
        </div>
      ),
    },
    {
      title: tx('إجراءات', 'Actions'),
      key: 'actions',
      width: 170,
      render: (_: any, r: ClinicInventoryItem) => (
        <Space size={4} wrap>
          <Button
            size="small"
            icon={<Download size={13} />}
            style={{ color: '#059669', borderColor: '#059669', fontSize: 12 }}
            onClick={() => {
              setRecvItem(r);
              recvForm.setFieldsValue({ quantity: 1, batchLotNumber: r.batchLotNumber });
            }}
          >
            توريد
          </Button>
          <Button
            size="small"
            icon={<Minus size={13} />}
            style={{ color: '#be185d', borderColor: '#be185d', fontSize: 12 }}
            onClick={() => {
              setConsumeItem(r);
              consumeForm.setFieldsValue({ quantity: 1 });
            }}
          >
            صرف
          </Button>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEdit(r)} />
          <Popconfirm title="حذف هذا الصنف من المخزن؟" onConfirm={() => handleDelete(r.id)} okText="نعم" cancelText="إلغاء">
            <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Luxury Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          borderRadius: 14,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(6, 78, 59, 0.2)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="center" size={12}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Boxes size={24} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  إدارة المخزن والمستلزمات الطبية التجميلية
                </Title>
                <Text style={{ color: '#a7f3d0', fontSize: 13 }}>
                  تتبع دقيق لأرصدة البوتوكس والفيلر، وماسكات البشرة، ومراهم ما بعد الجلسات (فيوسيكورت/ميبو/بانثينول)، وجل التبريد مع الخصم التلقائي
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'start' }}>
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              style={{
                backgroundColor: '#ffffff',
                color: '#064e3b',
                borderColor: '#ffffff',
                fontWeight: 700,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onClick={() => {
                setEditItem(null);
                addForm.resetFields();
                setAddOpen(true);
              }}
            >
              + إضافة صنف جديد للمخزن
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Summary KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #d1fae5' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>إجمالي الأصناف بالمخزن</Text>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#065f46' }}>{items.length} صنف</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #fbcfe8' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>حقن وفيلر وبوتوكس</Text>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#be185d' }}>
              {items.filter((i) => i.category === 'حقن وبوتوكس وفيلر').reduce((acc, c) => acc + c.currentStock, 0)} وحدة
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #ccfbf1' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>ماسكات البشرة المرطبة</Text>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#0d9488' }}>
              {items.filter((i) => i.category === 'عناية بالبشرة وماسكات').reduce((acc, c) => acc + c.currentStock, 0)} ماسك
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #fed7aa' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>تنبيهات انخفاض الرصيد</Text>
            <div style={{ fontWeight: 800, fontSize: 20, color: lowStockItems.length > 0 ? '#dc2626' : '#059669' }}>
              {lowStockItems.length} أصناف منخفضة
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alert if low stock or expiring */}
      {lowStockItems.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertTriangle size={16} color="#d97706" />}
          message={
            <span>
              <strong>تنبيه نقص المخزون:</strong> يوجد {lowStockItems.length} أصناف وصلت للحد الأدنى (
              {lowStockItems.map((i) => `${i.name} [متبقي ${i.currentStock} ${i.unit}]`).join(' ، ')}).
            </span>
          }
          style={{ borderRadius: 8 }}
        />
      )}

      {/* Filter Tabs and Search Bar */}
      <Card size="small" style={{ borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Segmented
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val as string)}
            options={[
              { value: 'all', label: `جميع المستلزمات (${items.length})` },
              { value: 'حقن وبوتوكس وفيلر', label: '💉 حقن وبوتوكس وفيلر' },
              { value: 'عناية بالبشرة وماسكات', label: '✨ ماسكات وبشرة' },
              { value: 'مراهم وكريمات ما بعد الجلسات', label: '🧴 مراهم وكريمات بعد الجلسة' },
              { value: 'ليزر وتبريد', label: '⚡ ليزر وتبريد' },
              { value: 'عناية بالجسم وسكراب', label: '🌸 سكراب وبودي كير' },
              { value: 'سبا ومساج وحمام', label: '🛁 سبا وحمام مغربي' },
              { value: 'مستهلكات طبية وإبر', label: '🩺 مستهلكات طبية' },
            ]}
          />
          <Input
            allowClear
            prefix={<Search size={14} />}
            placeholder="بحث بالاسم أو SKU أو رقم التشغيلة..."
            style={{ width: 260 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      {/* Main Table */}
      <Card size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredItems}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal: Add / Edit Item */}
      <Modal
        title={editItem ? `تعديل صنف: ${editItem.name}` : 'إضافة صنف جديد لمخزن العيادة'}
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          setEditItem(null);
          addForm.resetFields();
        }}
        onOk={() => addForm.submit()}
        okText="حفظ الصنف بالمخزن"
        cancelText="إلغاء"
        width={680}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddOrEdit}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="name" label="اسم المستحضر (بالعربية)" rules={[{ required: true, message: 'مطلوب' }]}>
                <Input placeholder="مثال: فايل بوتوكس Allergan 100U" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="nameEn" label="الاسم الإنجليزي / العلمي">
                <Input placeholder="e.g. Allergan Botox 100U" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="category" label="القسم / التخصص التابع له" rules={[{ required: true }]} initialValue="حقن وبوتوكس وفيلر">
                <Select
                  options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item name="sku" label="كود الصنف (SKU)">
                <Input placeholder="e.g. BTX-100" />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item name="unit" label="وحدة القياس" initialValue="عبوة">
                <Input placeholder="فايل / سرنجة / ماسك / لتر" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currentStock" label="الرصيد المتاح حالياً" rules={[{ required: true }]} initialValue={10}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reorderLevel" label="حد الأمان (تنبيه النقص)" initialValue={5}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="batchLotNumber" label="رقم التشغيلة (Lot #)" initialValue="LOT-2026-A">
                <Input placeholder="e.g. C38491-02" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="expiryDate" label="تاريخ الصلاحية">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unitCostEgp" label="سعر التكلفة (ج.م)" initialValue={100}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="clinicPriceEgp" label="سعر البيع / الخدمة (ج.م)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="ملاحظات وشروط الحفظ والتخزين">
            <Input.TextArea rows={2} placeholder="مثال: يحفظ مبرداً من 2-8 درجات، أو يوضع بعد الجلسة مباشرة" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Receive Stock */}
      <Modal
        title={`توريد واستلام شحنة — ${recvItem?.name || ''}`}
        open={!!recvItem}
        onCancel={() => setRecvItem(null)}
        onOk={() => recvForm.submit()}
        okText="تأكيد التوريد وإضافة الرصيد"
        cancelText="إلغاء"
        width={500}
      >
        <Form form={recvForm} layout="vertical" onFinish={handleReceiveStock}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="الكمية الواردة المستلمة" rules={[{ required: true }]} initialValue={5}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchLotNumber" label="رقم التشغيلة للدفعة">
                <Input placeholder="e.g. LOT-NEW-88" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="expiryDate" label="تاريخ الصلاحية للشحنة">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Consume Stock */}
      <Modal
        title={`صرف مستلزمات للعيادة — ${consumeItem?.name || ''}`}
        open={!!consumeItem}
        onCancel={() => setConsumeItem(null)}
        onOk={() => consumeForm.submit()}
        okText="تأكيد الصرف والخصم"
        cancelText="إلغاء"
        width={500}
      >
        <Form form={consumeForm} layout="vertical" onFinish={handleConsumeStock}>
          <Alert
            type="info"
            message={`الرصيد المتاح حالياً بالمخزن: ${consumeItem?.currentStock || 0} ${consumeItem?.unit || ''}`}
            style={{ marginBottom: 14 }}
          />
          <Form.Item name="quantity" label="الكمية المطلوب صرفها" rules={[{ required: true }]} initialValue={1}>
            <InputNumber min={1} max={consumeItem?.currentStock || 100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="جهة الصرف أو اسم الحالة">
            <Input placeholder="مثال: لعيادة البوتوكس / دكتورة سارة / حالة لينا الحسن" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}