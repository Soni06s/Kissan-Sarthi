import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { availableLanguages } from '../../i18n';

const LanguageSwitcher = React.memo(() => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const switcherRef = useRef(null);

  const currentLanguage = useMemo(
    () => availableLanguages.find((item) => item.code === i18n.language) || availableLanguages[0],
    [i18n.language]
  );

  const handleLanguageChange = useCallback(async (code) => {
    setOpen(false);
    await i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  }, [i18n]);

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
          gap: 8,
          borderRadius: 999,
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'white',
          padding: '10px 14px',
          cursor: 'pointer',
          fontWeight: 700,
          color: '#1f2937',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <span style={{ fontSize: 18 }}>{currentLanguage.emoji}</span>
        <span>{currentLanguage.native}</span>
        <Icon name="chevron-down" size={16} color="#111827" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('navbar.languageSelector')}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            minWidth: 220,
            background: 'white',
            borderRadius: 18,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
            padding: 8,
            zIndex: 1002,
            animation: 'scaleIn 140ms ease-out',
          }}
        >
          <style>{`
            @keyframes scaleIn {
              from { opacity: 0; transform: translateY(-10px) scale(0.96); }
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
                padding: '12px 14px',
                background: lang.code === currentLanguage.code ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderRadius: 14,
                cursor: 'pointer',
                fontWeight: 700,
                color: '#111827',
                marginBottom: 6,
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{lang.emoji}</span>
                <span>{lang.native}</span>
              </span>
              {lang.code === currentLanguage.code && <Icon name="check" size={16} color="#16a34a" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default LanguageSwitcher;
