import { ThemeConfig } from 'antd';

export function getAppTheme(primaryColor: string = '#2563EB', isRtl: boolean = false): ThemeConfig {
  const fontFamily = isRtl
    ? "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return {
    token: {
      colorPrimary: primaryColor,
      colorInfo: primaryColor,
      colorSuccess: '#059669',
      colorWarning: '#D97706',
      colorError: '#DC2626',
      colorBgBase: '#FFFFFF',
      colorBgLayout: '#F8FAFC',
      colorTextBase: '#0F172A',
      colorTextSecondary: '#475569',
      colorTextTertiary: '#94A3B8',
      colorBorder: '#E2E8F0',
      colorBorderSecondary: '#F1F5F9',
      fontFamily,
      fontSize: 14,
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    },
    components: {
      Layout: {
        bodyBg: '#F8FAFC',
        headerBg: '#FFFFFF',
        headerPadding: '0 24px',
        siderBg: '#FFFFFF',
      },
      Menu: {
        itemBg: 'transparent',
        itemColor: '#475569',
        itemSelectedColor: primaryColor,
        itemHoverColor: primaryColor,
        itemSelectedBg: '#F1F5F9',
        itemHoverBg: '#F8FAFC',
        itemBorderRadius: 8,
        itemMarginInline: 8,
      },
      Card: {
        headerBg: '#FFFFFF',
        headerFontSize: 16,
        colorBorderSecondary: '#E2E8F0',
        boxShadowTertiary: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
      },
      Table: {
        headerBg: '#F8FAFC',
        headerColor: '#475569',
        headerSplitColor: 'transparent',
        rowHoverBg: '#F8FAFC',
        borderColor: '#E2E8F0',
      },
      Button: {
        fontWeight: 500,
        borderRadius: 8,
        defaultBorderColor: '#E2E8F0',
        defaultColor: '#0F172A',
        defaultBg: '#FFFFFF',
        defaultHoverBg: '#F8FAFC',
        defaultHoverBorderColor: '#CBD5E1',
      },
      Input: {
        colorBorder: '#CBD5E1',
        hoverBorderColor: primaryColor,
        activeBorderColor: primaryColor,
      },
      Select: {
        colorBorder: '#CBD5E1',
      },
      Modal: {
        borderRadiusLG: 16,
        headerBg: '#FFFFFF',
      },
      Tabs: {
        titleFontSize: 14,
        itemColor: '#64748B',
        itemSelectedColor: primaryColor,
        itemHoverColor: primaryColor,
      },
    },
  };
}
