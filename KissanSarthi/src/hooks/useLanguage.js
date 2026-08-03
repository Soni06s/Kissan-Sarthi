import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const localeMap = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const locale = localeMap[i18n.language] || localeMap.en;

  return useMemo(() => {
    const formatDate = (value, options = {}) => {
      if (!value) return '';
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(locale, options).format(date);
    };

    const formatNumber = (value, options = {}) => {
      if (value === null || value === undefined) return '';
      return new Intl.NumberFormat(locale, options).format(value);
    };

    const formatCurrency = (value, currency = 'INR', options = {}) => {
      if (value === null || value === undefined) return '';
      return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, ...options }).format(value);
    };

    const formatPercent = (value, options = {}) => {
      if (value === null || value === undefined) return '';
      return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, ...options }).format(value);
    };

    return {
      t,
      locale,
      formatDate,
      formatNumber,
      formatCurrency,
      formatPercent,
      currentLanguage: i18n.language,
      changeLanguage: (lng) => i18n.changeLanguage(lng),
    };
  }, [i18n, locale, t]);
};
