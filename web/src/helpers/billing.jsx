import { API } from './api';
import { renderNumber, YYC_SYMBOL } from './render';

export const YYC_DISPLAY_CODE = 'YYC';
export const DEFAULT_FIAT_DISPLAY_CODE = 'USD';

export const normalizeDisplayCurrencyCode = (value) =>
  (value || '').toString().trim().toUpperCase();

export const getFallbackUSDYYCPerUnit = () => {
  if (typeof window === 'undefined') {
    return 0;
  }
  const raw = Number(window.localStorage.getItem('quota_per_unit') || '');
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return raw;
};

export const buildPublicDisplayCurrencyIndex = (
  rows,
  fallbackUsdYYCPerUnit = getFallbackUSDYYCPerUnit(),
) => {
  const next = {
    [YYC_DISPLAY_CODE]: {
      code: YYC_DISPLAY_CODE,
      name: 'Yeying Coin',
      symbol: YYC_SYMBOL,
      minor_unit: 0,
      yyc_per_unit: 1,
    },
  };

  if (Number.isFinite(fallbackUsdYYCPerUnit) && fallbackUsdYYCPerUnit > 0) {
    next[DEFAULT_FIAT_DISPLAY_CODE] = {
      code: DEFAULT_FIAT_DISPLAY_CODE,
      name: 'US Dollar',
      symbol: '$',
      minor_unit: 2,
      yyc_per_unit: fallbackUsdYYCPerUnit,
    };
  }

  (Array.isArray(rows) ? rows : []).forEach((item) => {
    const code = normalizeDisplayCurrencyCode(item?.code);
    const status = Number(item?.status ?? 1);
    const rate = Number(item?.yyc_per_unit || 0);
    if (!code || status !== 1 || !Number.isFinite(rate) || rate <= 0) {
      return;
    }
    next[code] = {
      ...item,
      code,
      minor_unit: Number(item?.minor_unit ?? 2),
      yyc_per_unit: rate,
    };
  });

  return next;
};

export const resolvePreferredDisplayCurrency = (
  currencyIndex,
  preferred = DEFAULT_FIAT_DISPLAY_CODE,
) => {
  const candidates = [
    normalizeDisplayCurrencyCode(preferred),
    DEFAULT_FIAT_DISPLAY_CODE,
    'CNY',
    YYC_DISPLAY_CODE,
  ];
  const availableCodes = Object.keys(currencyIndex || {}).sort((a, b) =>
    a.localeCompare(b),
  );
  candidates.push(...availableCodes);
  for (const code of candidates) {
    if (code && currencyIndex?.[code]) {
      return code;
    }
  }
  return YYC_DISPLAY_CODE;
};

export const listDisplayCurrencies = (currencyIndex) =>
  Object.values(currencyIndex || {})
    .filter((item) => item?.code)
    .sort((a, b) => {
      if (a.code === DEFAULT_FIAT_DISPLAY_CODE) return -1;
      if (b.code === DEFAULT_FIAT_DISPLAY_CODE) return 1;
      if (a.code === YYC_DISPLAY_CODE) return 1;
      if (b.code === YYC_DISPLAY_CODE) return -1;
      return `${a.code}`.localeCompare(`${b.code}`);
    });

export const convertYYCToDisplayAmount = (
  yycAmount,
  displayUnit,
  currencyIndex,
) => {
  const normalizedAmount = Number(yycAmount || 0);
  if (!Number.isFinite(normalizedAmount)) {
    return NaN;
  }
  const normalizedUnit = normalizeDisplayCurrencyCode(displayUnit);
  if (normalizedUnit === YYC_DISPLAY_CODE) {
    return normalizedAmount;
  }
  const rate = Number(currencyIndex?.[normalizedUnit]?.yyc_per_unit || 0);
  if (!Number.isFinite(rate) || rate <= 0) {
    return NaN;
  }
  return normalizedAmount / rate;
};

export const formatCompactDisplayAmount = (
  amount,
  {
    fractionDigits = 4,
    compactThreshold = 10000,
    compactDivisor = 10000,
    compactFractionDigits = 2,
    compactLabel = '',
  } = {},
) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount)) {
    return '0.0000';
  }
  const abs = Math.abs(normalizedAmount);
  if (compactLabel && abs >= compactThreshold) {
    const display = (normalizedAmount / compactDivisor).toFixed(
      compactFractionDigits,
    );
    return `${display}${compactLabel}`;
  }
  return normalizedAmount.toFixed(fractionDigits);
};

export const formatQuotaForDisplay = (
  quota,
  displayUnit,
  currencyIndex,
  {
    fractionDigits = 6,
    includeSymbol = false,
    yycMode = 'fixed',
    invalidValue = '-',
  } = {},
) => {
  const yycValue = Number(quota || 0);
  if (!Number.isFinite(yycValue)) {
    return invalidValue;
  }

  const normalizedUnit = normalizeDisplayCurrencyCode(displayUnit);
  if (normalizedUnit === YYC_DISPLAY_CODE) {
    if (yycMode === 'compact') {
      return renderNumber(yycValue);
    }
    return Number(yycValue).toFixed(fractionDigits);
  }

  const amount = convertYYCToDisplayAmount(
    yycValue,
    normalizedUnit,
    currencyIndex,
  );
  if (!Number.isFinite(amount)) {
    return invalidValue;
  }
  const text = Number(amount).toFixed(fractionDigits);
  if (!includeSymbol) {
    return text;
  }
  const symbol = (currencyIndex?.[normalizedUnit]?.symbol || '').toString().trim();
  if (symbol) {
    return `${symbol}${text}`;
  }
  return text;
};

export const loadPublicDisplayCurrencyCatalog = async () => {
  const fallbackUsdYYCPerUnit = getFallbackUSDYYCPerUnit();
  try {
    const res = await API.get('/api/v1/public/billing/currencies');
    const { success, data } = res.data || {};
    if (!success) {
      throw new Error('load public billing currencies failed');
    }
    const index = buildPublicDisplayCurrencyIndex(
      Array.isArray(data?.items) ? data.items : data,
      fallbackUsdYYCPerUnit,
    );
    return {
      currencyIndex: index,
      defaultCurrency: resolvePreferredDisplayCurrency(
        index,
        data?.default_currency || DEFAULT_FIAT_DISPLAY_CODE,
      ),
    };
  } catch {
    const index = buildPublicDisplayCurrencyIndex([], fallbackUsdYYCPerUnit);
    return {
      currencyIndex: index,
      defaultCurrency: resolvePreferredDisplayCurrency(index),
    };
  }
};
