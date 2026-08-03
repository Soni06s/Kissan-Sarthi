import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from './locales/en/common.json';

const resources = {
  en: { common: enCommon },
  hi: { common: {} }, // Falls back to en automatically
  gu: { common: {} }, // Falls back to en automatically
};

const supportedLngs = ['en', 'hi', 'gu'];
const fallbackLng = 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng,
    supportedLngs,
    debug: false,
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },
    react: {
      useSuspense: false, // We're loading synchronously, so no need for suspense blocking
    }
  });

const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
});

// Set initial document properties
document.documentElement.lang = i18n.language || fallbackLng;
document.documentElement.dir = rtlLanguages.includes(i18n.language) ? 'rtl' : 'ltr';

export const availableLanguages = [
  { code: 'en', name: 'English', native: 'English', emoji: '🇺🇸' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', emoji: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', emoji: '🇮🇳' },
];

export default i18n;
