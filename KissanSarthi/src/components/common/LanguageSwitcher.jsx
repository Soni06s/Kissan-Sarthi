import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { availableLanguages } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const LANGUAGE_LABELS = {
  en: 'EN',
  hi: 'हिं',
  gu: 'ગુજ',
};

const LanguageSwitcher = React.memo(() => {
  const { i18n, t } = useTranslation();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const switcherRef = useRef(null);

  const activeLangCode = (i18n.language || 'en').slice(0, 2);

  const currentLanguage = useMemo(
    () => availableLanguages.find((item) => item.code === activeLangCode) || availableLanguages[0],
    [activeLangCode]
  );

  // Sync with user's preferredLanguage on login/profile load
  useEffect(() => {
    if (user?.preferredLanguage && user.preferredLanguage !== activeLangCode) {
      i18n.changeLanguage(user.preferredLanguage);
      localStorage.setItem('i18nextLng', user.preferredLanguage);
    }
  }, [user?.preferredLanguage, activeLangCode, i18n]);

  const handleLanguageChange = useCallback(async (code) => {
    setOpen(false);
    await i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);

    // Save to user profile if logged in
    if (isAuthenticated) {
      try {
        await authAPI.updateProfile({ preferredLanguage: code });
        if (user) {
          updateUser({ ...user, preferredLanguage: code });
        }
      } catch (err) {
        console.warn('Could not sync preferredLanguage to profile', err);
      }
    }
  }, [i18n, isAuthenticated, user, updateUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={switcherRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          borderRadius: 999,
          border: '1.5px solid rgba(46, 125, 50, 0.2)',
          background: 'white',
          padding: '8px 14px',
          cursor: 'pointer',
          fontWeight: 700,
          color: '#1f2937',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: 16 }}>{currentLanguage.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1B5E20' }}>
          {LANGUAGE_LABELS[currentLanguage.code] || currentLanguage.code.toUpperCase()}
        </span>
        <span style={{ fontSize: 13, color: '#4B5563' }}>({currentLanguage.native})</span>
        <Icon name="chevron-down" size={14} color="#111827" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('navbar.languageSelector')}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: 200,
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 16px 36px rgba(15,23,42,0.14)',
            padding: 6,
            zIndex: 1002,
            animation: 'scaleIn 140ms ease-out',
          }}
        >
          <style>{`
            @keyframes scaleIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              role="menuitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                background: lang.code === activeLangCode ? '#E8F5E9' : 'transparent',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: lang.code === activeLangCode ? 800 : 600,
                color: lang.code === activeLangCode ? '#1B5E20' : '#111827',
                marginBottom: 4,
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 16 }}>{lang.emoji}</span>
                <span style={{ fontSize: 13 }}>{lang.native}</span>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>
                  [{LANGUAGE_LABELS[lang.code]}]
                </span>
              </span>
              {lang.code === activeLangCode && <Icon name="check" size={15} color="#16a34a" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default LanguageSwitcher;
