import { ThemeConfig } from 'antd';

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '').trim();
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
};

const relLum = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const contrastRatio = (a: string, b: string) => {
  const la = relLum(toRgb(a));
  const lb = relLum(toRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/**
 * The brand colour is used as an accent (buttons, borders) but also as *text*
 * (active tab labels, selected menu items, links). Pink/magenta brands sit
 * around 3.5:1 on white — below the 4.5:1 WCAG AA floor — so the labels look
 * washed out. This returns progressively darker shades until the text passes.
 */
export function readableTextColor(color: string, on: string = '#FFFFFF', min = 4.6): string {
  const [r, g, b] = toRgb(color);
  let cur: [number, number, number] = [r, g, b];
  const asHex = (c: [number, number, number]) =>
    '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  for (let i = 0; i < 14; i += 1) {
    if (contrastRatio(asHex(cur), on) >= min) break;
    cur = [cur[0] * 0.88, cur[1] * 0.88, cur[2] * 0.88];
  }
  return asHex(cur);
}

export function getAppTheme(primaryColor: string = '#2563EB', isRtl: boolean = false): ThemeConfig {
  const fontFamily = isRtl
    ? "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Readable variant of the brand colour for anything rendered as text.
  const accentText = readableTextColor(primaryColor, '#FFFFFF');
  const accentTextOnSoft = readableTextColor(primaryColor, '#F1F5F9');
  // Filled surfaces (primary buttons, selected chips) put white text on the
  // brand colour, so the fill itself has to clear 4.5:1 against white.
  const primarySurface = readableTextColor(primaryColor, '#FFFFFF', 4.5);

  return {
    token: {
      colorPrimary: primarySurface,
      colorInfo: primarySurface,
      colorLink: accentText,
      colorSuccess: '#047857',
      colorWarning: '#B45309',
      colorError: '#B91C1C',
      colorBgBase: '#FFFFFF',
      colorBgLayout: '#F8FAFC',
      colorTextBase: '#0F172A',
      colorTextSecondary: '#475569',
      // Was #64748B (≈2.6:1 on white) — secondary captions, patient numbers and
      // phone numbers were practically unreadable.
      colorTextTertiary: '#64748B',
      colorTextDescription: '#64748B',
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
        itemSelectedColor: accentTextOnSoft,
        itemHoverColor: accentTextOnSoft,
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
        itemColor: '#475569',
        // Pink at full strength was ≈3.5:1 — the active tab read as "faded".
        itemSelectedColor: accentText,
        itemHoverColor: accentText,
        itemActiveColor: accentText,
        inkBarColor: accentText,
      },
      Tag: {
        defaultColor: '#334155',
      },
      Statistic: {
        contentFontSize: 26,
      },
    },
  };
}
