import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';
import { Icon } from '../common/Icon';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Navbar = ({ onToggleSidebar, sidebarOpen, onLogin }) => {
  const [time, setTime] = useState(new Date());
  const [isFocused, setIsFocused] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // High-Precision Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
  };

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 72,
        background: "rgba(255,255,255,0.85)",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", zIndex: 1000,
        backdropFilter: "blur(20px) saturate(180%)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)"
      }}>

        {/* ─── LEFT: BRANDING ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: '240px' }}>
          <button
            onClick={onToggleSidebar}
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: '10px',
              cursor: "pointer",
              display: "flex",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
          >
            <Icon name={sidebarOpen ? "close" : "menu"} size={20} color={COLORS.primary} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 8px 16px ${COLORS.primary}33`,
              overflow: 'hidden'
            }}>
              <img
                src="https://play-lh.googleusercontent.com/vqzU2KZDlcjS6dONFjSZjgfKqpwDoZsyrrse6ZAKeb1FejH_hQ4-VZbt6Ljkrnqs2UX1=w480-h960-rw"
                alt="logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div style="color:white;font-weight:bold;font-size:22px">K</div>';
                }}
              />
            </div>
            <div style={{
              fontWeight: 900, fontSize: 20,
              color: COLORS.text,
              fontFamily: "Georgia, serif",
              letterSpacing: "-0.5px"
            }}>
              Kissan<span style={{ color: COLORS.primary }}>Sarthi</span>
            </div>
          </div>
        </div>

        {/* ─── CENTER: PRO COMMAND SEARCH ────────────────────────────── */}
        <div style={{
          flex: 1,
          maxWidth: 550,
          position: 'relative',
          margin: '0 40px',
          transition: 'all 0.3s'
        }}>
          <div style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            zIndex: 1, opacity: isFocused ? 1 : 0.4
          }}>
            <Icon name="search" size={18} color={isFocused ? COLORS.primary : COLORS.text} />
          </div>
          <input
            type="text"
            placeholder={t('navbar.searchPlaceholder')}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: 16,
              border: `2px solid ${isFocused ? COLORS.primary : COLORS.bg}`,
              background: isFocused ? 'white' : COLORS.bg,
              fontSize: 14,
              fontWeight: 600,
              outline: 'none',
              transition: 'all 0.25s ease',
              boxShadow: isFocused ? '0 12px 24px rgba(0,0,0,0.06)' : 'none',
              color: COLORS.text
            }}
          />
          <div style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 8,
            padding: '3px 8px', fontSize: 10, fontWeight: 800, color: COLORS.textMuted,
            display: isFocused ? 'none' : 'block',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            K S
          </div>
        </div>

        {/* ─── RIGHT: ACTIONS & PROFILE ──────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* LIVE TIME CLOCK */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{
              fontSize: 15,
              fontWeight: 900,
              color: COLORS.text,
              fontFamily: 'monospace',
              letterSpacing: '0.5px'
            }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 10, color: COLORS.primary, fontWeight: 800, textTransform: 'uppercase' }}>
              {t('navbar.currentTime')}
            </div>
          </div>

          <div style={{ width: 1, height: 28, background: COLORS.border }} />
          <LanguageSwitcher />

          {/* PROFILE TRIGGER / AUTH GATEWAY */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              onClick={() => {
                if (!isAuthenticated) setShowAuth(true);
                else setShowDropdown(!showDropdown);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "4px 4px 4px 14px",
                borderRadius: 16,
                background: 'white',
                border: `1.5px solid ${COLORS.primary}22`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.1)';
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                e.currentTarget.style.borderColor = `${COLORS.primary}22`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, lineHeight: 1.2 }}>
                  {isAuthenticated ? user?.name : t('navbar.guestFarmer')}
                </div>
                <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 700, marginTop: 2 }}>
                  {isAuthenticated ? `${user?.city || 'Unknown'}, ${user?.state || 'Location'}` : t('navbar.clickToSignUp')}
                </div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: isAuthenticated ? COLORS.primary + '12' : COLORS.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${isAuthenticated ? COLORS.primary + '22' : COLORS.border}`,
                overflow: 'hidden'
              }}>
                {isAuthenticated && user?.profileImage ? (
                   <img src={`http://localhost:5000${user.profileImage}`} alt="profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <Icon name="user" size={22} color={isAuthenticated ? COLORS.primary : COLORS.textMuted} />
                )}
              </div>
            </div>

            {/* DROPDOWN MENU */}
            {showDropdown && isAuthenticated && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 220,
                background: 'white',
                borderRadius: 16,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                border: `1px solid ${COLORS.border}`,
                padding: '8px',
                zIndex: 1001,
                animation: 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <style>{`
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .dropdown-item {
                    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
                    border-radius: 10px; cursor: pointer; color: ${COLORS.text};
                    text-decoration: none; font-weight: 600; font-size: 14px;
                    transition: all 0.2s;
                  }
                  .dropdown-item:hover {
                    background: ${COLORS.bg};
                    color: ${COLORS.primary};
                  }
                  .dropdown-item-danger:hover {
                    background: #fee2e2;
                    color: #dc2626;
                  }
                `}</style>
                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  👤 {t('navbar.myProfile')}
                </Link>
                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  ✏️ {t('navbar.editProfile')}
                </Link>
                <div style={{ height: 1, background: COLORS.border, margin: '4px 0' }} />
                <div className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                  🚪 {t('navbar.logout')}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── MODAL OVERLAY ─── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginSuccess={() => {
            if(onLogin) onLogin();
            setShowAuth(false);
          }}
        />
      )}
    </>
  );
};

export default Navbar;