import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { Mail, Lock, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { apiClient } from '../../lib/api-client';
import { useLang } from '../../lib/useLang';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginViewProps {
  clinicName: string;
  clinicColor: string;
  clinicInitial: string;
  onLoggedIn: () => void;
}

export function LoginView({ clinicName, clinicColor, clinicInitial, onLoggedIn }: LoginViewProps) {
  const { setAuth } = useAuthStore();
  const { tx } = useLang();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const res: any = await apiClient.post('/auth/login', {
        email: values.email,
        password: values.password,
      });

      const payload: any = res?.data ?? res;
      const account = payload?.user;
      const token = payload?.accessToken ?? payload?.access_token;

      if (!account || !token) {
        setError(tx('اسم المستخدم أو كلمة المرور غير صحيحة', 'Invalid username or password'));
        return;
      }

      setAuth(
        {
          id: account.id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          clinicId: account.clinicId,
          status: account.status,
          isPlatformAdmin: account.isPlatformAdmin ?? false,
          roles: account.roles ?? [],
          permissions: account.permissions ?? [],
        },
        token,
      );
      onLoggedIn();
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      if (status === 401 || status === 403) {
        setError(tx('اسم المستخدم أو كلمة المرور غير صحيحة', 'Invalid username or password'));
      } else {
        const raw = err?.message ?? err;
        const text = Array.isArray(raw) ? raw.join(' ') : typeof raw === 'string' ? raw : '';
        setError(
          text ||
            tx(
              'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
              'Could not reach the server. Check your connection and try again.',
            ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 40%, #F8FAFC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Decorative background blobs */}
      <div
        style={{
          position: 'fixed',
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `${clinicColor}18`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -60,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: `${clinicColor}12`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Clinic Brand Card Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              backgroundColor: clinicColor,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 28,
              margin: '0 auto 16px',
              boxShadow: `0 8px 24px ${clinicColor}40`,
            }}
          >
            {clinicInitial}
          </div>
          <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 700 }}>
            {clinicName}
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>
            {tx('سجّل دخولك إلى نظام العيادة', 'Sign in to your clinic workspace')}
          </Text>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '36px 40px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0',
          }}
        >
          <Title level={5} style={{ marginBottom: 24, color: '#0F172A', fontWeight: 600 }}>
            {tx('مرحباً بعودتك', 'Welcome back')} 👋
          </Title>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ marginBottom: 20, borderRadius: 10 }}
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
            <Form.Item
              label="اسم المستخدم أو الإيميل (Username or Email)"
              name="email"
              rules={[{ required: true, message: 'برجاء إدخال اسم المستخدم أو البريد الإلكتروني' }]}
            >
              <Input
                prefix={<Mail size={16} color="#94A3B8" />}
                placeholder="dr_ahmed أو you@clinic.com"
                style={{ borderRadius: 10, height: 46 }}
                autoFocus
              />
            </Form.Item>

            <Form.Item
              label={tx('كلمة المرور', 'Password')}
              name="password"
              rules={[{ required: true, message: tx('برجاء إدخال كلمة المرور', 'Please enter your password') }]}
              style={{ marginBottom: 24 }}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                prefix={<Lock size={16} color="#94A3B8" />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                  </button>
                }
                placeholder={tx('كلمة المرور الخاصة بك', 'Your password')}
                style={{ borderRadius: 10, height: 46 }}
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 48,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                background: clinicColor,
                borderColor: clinicColor,
                boxShadow: `0 4px 12px ${clinicColor}40`,
              }}
            >
              {tx('تسجيل الدخول إلى النظام', 'Sign In to Workspace')}
            </Button>
          </Form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Stethoscope size={13} color="#94A3B8" />
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>
              {tx('نظام سحابي مشفر وآمن لإدارة العيادات والمراكز الطبية', 'Secure Clinical Workspace — All sessions are encrypted and logged')}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
