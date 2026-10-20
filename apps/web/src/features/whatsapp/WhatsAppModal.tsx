import { useState, useEffect } from 'react';
import { Modal, Button, Input, Form, Space, Tag, message } from 'antd';
import { Copy, Send, Check, Sparkles } from 'lucide-react';
import {
  sanitizePhoneNumber,
  buildWhatsAppLink,
  templateBotoxPostCare,
  templateFillerPostCare,
  templateLaserPostCare,
} from './whatsapp-helpers';

export interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone?: string;
  defaultMessage?: string;
  title?: string;
  subtitle?: string;
}

export function WhatsAppModal({
  open,
  onClose,
  patientName,
  patientPhone = '',
  defaultMessage = '',
  title = 'Send WhatsApp Message',
  subtitle = 'Review and customize the message before sending to the patient',
}: WhatsAppModalProps) {
  const [form] = Form.useForm();
  const [phone, setPhone] = useState(patientPhone);
  const [content, setContent] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(patientPhone || '');
      setContent(defaultMessage || '');
      form.setFieldsValue({
        phone: patientPhone || '',
        content: defaultMessage || '',
      });
      setCopied(false);
    }
  }, [open, patientPhone, defaultMessage, form]);

  const sanitized = sanitizePhoneNumber(phone);
  const isValidPhone = sanitized.length >= 8;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    message.success('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!isValidPhone) {
      message.error('Please enter a valid patient phone number');
      return;
    }
    const url = buildWhatsAppLink(phone, content);
    window.open(url, '_blank', 'noopener,noreferrer');
    message.success('Opening WhatsApp Web / App...');
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
            }}
          >
            💬
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{subtitle}</div>
          </div>
        </div>
      }
    >
      <div style={{ padding: '12px 0 0' }}>
        <Form form={form} layout="vertical">
          {/* Patient Card */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              marginBottom: 16,
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: '#166534', display: 'block' }}>Patient Name</span>
              <strong style={{ fontSize: 14, color: '#14532D' }}>{patientName}</strong>
            </div>
            <div>
              {isValidPhone ? (
                <Tag color="success" style={{ borderRadius: 6, fontWeight: 600 }}>
                  Ready: +{sanitized}
                </Tag>
              ) : (
                <Tag color="warning" style={{ borderRadius: 6 }}>
                  No phone or invalid
                </Tag>
              )}
            </div>
          </div>

          {/* Phone Number Input */}
          <Form.Item
            label="Patient WhatsApp Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please provide phone number' }]}
            extra="Accepts formats: 010..., +20..., or international numbers"
          >
            <Input
              size="large"
              placeholder="e.g. 01001234567 or +20 100 123 4567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                form.setFieldsValue({ phone: e.target.value });
              }}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* Quick Aesthetic Templates */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              قوالب رسائل تجميل جاهزة (Aesthetic Quick Templates):
            </span>
            <Space wrap size={[6, 6]}>
              <Button
                size="small"
                icon={<Sparkles size={12} color="#ec4899" />}
                onClick={() => {
                  const msg = templateBotoxPostCare({ clinicName: 'عيادة الجلدية والتجميل', patientName });
                  setContent(msg);
                  form.setFieldsValue({ content: msg });
                }}
              >
                تعليمات البوتوكس 💉
              </Button>
              <Button
                size="small"
                icon={<Sparkles size={12} color="#ec4899" />}
                onClick={() => {
                  const msg = templateFillerPostCare({ clinicName: 'عيادة الجلدية والتجميل', patientName });
                  setContent(msg);
                  form.setFieldsValue({ content: msg });
                }}
              >
                تعليمات الفيلر 👄
              </Button>
              <Button
                size="small"
                icon={<Sparkles size={12} color="#ec4899" />}
                onClick={() => {
                  const msg = templateLaserPostCare({ clinicName: 'عيادة الجلدية والتجميل', patientName });
                  setContent(msg);
                  form.setFieldsValue({ content: msg });
                }}
              >
                تعليمات الليزر ⚡
              </Button>
            </Space>
          </div>

          {/* Message Content */}
          <Form.Item
            label="Message Content (WhatsApp Formatted)"
            name="content"
            rules={[{ required: true, message: 'Message cannot be empty' }]}
          >
            <Input.TextArea
              rows={8}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                form.setFieldsValue({ content: e.target.value });
              }}
              style={{
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
          </Form.Item>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <Button
              icon={copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              onClick={handleCopy}
              style={{ borderRadius: 8 }}
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </Button>

            <Space>
              <Button onClick={onClose} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<Send size={14} />}
                onClick={handleSend}
                disabled={!isValidPhone}
                style={{
                  backgroundColor: isValidPhone ? '#25D366' : undefined,
                  borderColor: isValidPhone ? '#25D366' : undefined,
                  borderRadius: 8,
                  fontWeight: 600,
                  boxShadow: isValidPhone ? '0 2px 8px rgba(37, 211, 102, 0.3)' : undefined,
                }}
              >
                Send via WhatsApp
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
