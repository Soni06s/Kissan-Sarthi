import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';
import { Icon } from '../common/Icon';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const SEARCH_CATALOG = [
  { title: "Farmer Marketplace", subtitle: "Direct produce sale with Mandi price benchmark", category: "Marketplace", icon: "cart", path: "/marketplace" },
  { title: "Government Schemes", subtitle: "PM-KISAN, PMFBY & subsidy eligibility matcher", category: "Schemes", icon: "badgeCheck", path: "/schemes" },
  { title: "Wheat Commodity", subtitle: "Mandi price trend & active arrivals", category: "Market", icon: "wheat", path: "/market-prices" },
  { title: "Rice / Paddy", subtitle: "Kharif staple commodity prices", category: "Market", icon: "rice", path: "/market-prices" },
  { title: "Mustard", subtitle: "Oilseed mandi prices & demand", category: "Market", icon: "mustard", path: "/market-prices" },
  { title: "Tomato & Vegetables", subtitle: "High-volatility fresh produce", category: "Market", icon: "tomato", path: "/market-prices" },
  { title: "Crop Intelligence AI", subtitle: "Soil & climate recommendation engine", category: "AI Advisor", icon: "crop", path: "/crop-advisor" },
  { title: "Fertilizer Prescription", subtitle: "NPK diagnostic & nutrient plan", category: "Nutrients", icon: "fertilizer", path: "/fertilizer" },
  { title: "Weather Forecast", subtitle: "Microclimate outlook & spray windows", category: "Weather", icon: "weather", path: "/weather" },
  { title: "KissanSarthi Pro Pricing", subtitle: "Subscription plans, zero commission & premium features", category: "Membership", icon: "badgeCheck", path: "/pricing" },
  { title: "Expert Consultation", subtitle: "1-on-1 advice from agricultural scientists", category: "Advisory", icon: "user", path: "/experts" },
  { title: "Admin Operations", subtitle: "Farmer registry & system telemetry", category: "Admin", icon: "admin", path: "/admin" },
];

const Navbar = ({ onToggleSidebar, sidebarOpen, onLogin }) => {
  const [time, setTime] = useState(new Date());
  const [isFocused, setIsFocused] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Keyboard shortcut (Cmd/Ctrl + K) for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const currentRole = user?.role || 'farmer';
  const filteredResults = searchQuery.trim()
    ? SEARCH_CATALOG
        .filter(item => item.category !== 'Admin' || currentRole === 'admin')
        .filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  const handleSelectSearchResult = (item) => {
    navigate(item.path);
    setSearchQuery("");
    setIsFocused(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredResults.length > 0) {
      handleSelectSearchResult(filteredResults[0]);
    }
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

          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 8px 16px ${COLORS.primary}33`,
              color: 'white',
            }}>
              <Icon name="crop" size={24} color="white" />
            </div>
            <div>
              <div style={{
                fontWeight: 900, fontSize: 20,
                color: COLORS.text,
                fontFamily: "Georgia, serif",
                letterSpacing: "-0.5px",
                lineHeight: 1.1
              }}>
                Kissan<span style={{ color: COLORS.primary }}>Sarthi</span>
              </div>
              <div style={{ fontSize: 10, color: COLORS.primaryDark, fontWeight: 800, letterSpacing: '0.5px' }}>
                SMART AGRI SYSTEM
              </div>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('navbar.searchPlaceholder')}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
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
            ⌘ K
          </div>

          {/* Quick Search Results Dropdown */}
          {isFocused && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`,
              boxShadow: '0 16px 36px rgba(0,0,0,0.12)', zIndex: 1002, overflow: 'hidden',
              maxHeight: 380, overflowY: 'auto'
            }}>
              {filteredResults.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
                  No matching farm insights or commodities found for "{searchQuery}".
                </div>
              ) : (
                filteredResults.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => handleSelectSearchResult(item)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}55`,
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, background: COLORS.primary + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon name={item.icon} size={16} color={COLORS.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{item.subtitle}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      padding: '4px 8px', borderRadius: 8, background: COLORS.bg, color: COLORS.primary
                    }}>
                      {item.category}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: ACTIONS & PROFILE TOOLBAR ──────────────────────── */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 14,
          background: "rgba(248, 250, 252, 0.8)",
          padding: "6px 10px",
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          {/* LIVE TIME CLOCK */}
          <div style={{ 
            padding: "2px 10px",
            textAlign: 'right', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            minWidth: 85
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: COLORS.text,
              fontFamily: 'monospace',
              letterSpacing: '0.5px'
            }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('navbar.currentTime')}
            </div>
          </div>

          <div style={{ width: 1, height: 26, background: COLORS.border }} />

          {/* ACTION PILLS: GO PRO (SHIMMER CTA) & EXPERTS */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              to="/pricing"
              className={user?.subscription?.plan === 'pro' ? "" : "btn-pro"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 12,
                background: user?.subscription?.plan === 'pro'
                  ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
                  : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                border: user?.subscription?.plan === 'pro'
                  ? '1px solid #FCD34D'
                  : '1px solid #F59E0B',
                color: user?.subscription?.plan === 'pro' ? '#92400E' : '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 12,
                boxShadow: user?.subscription?.plan === 'pro'
                  ? '0 2px 6px rgba(245, 158, 11, 0.2)'
                  : '0 4px 14px rgba(217, 119, 6, 0.35)',
                transition: 'all 0.2s',
                letterSpacing: "0.02em"
              }}
            >
              <span>{user?.subscription?.plan === 'pro' ? '👑' : '✨'}</span>
              <span>{user?.subscription?.plan === 'pro' ? 'Pro Member' : 'Go Pro'}</span>
            </Link>

            <Link
              to="/experts"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px',
                borderRadius: 12,
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 12,
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.color = COLORS.primaryDark;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.color = '#334155';
              }}
            >
              <Icon name="user" size={14} color={COLORS.primary} />
              <span>Experts</span>
            </Link>
          </div>

          <div style={{ width: 1, height: 26, background: COLORS.border }} />

          <LanguageSwitcher />

          <div style={{ width: 1, height: 26, background: COLORS.border }} />

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
                <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <span>{isAuthenticated ? user?.name : t('navbar.guestFarmer')}</span>
                  {isAuthenticated && user?.subscription?.plan === 'pro' && (
                    <span
                      title="KissanSarthi Pro Member"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: 4,
                        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      PRO
                    </span>
                  )}
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
                   <img src={user.profileImage.startsWith('http') ? user.profileImage : `${API_ORIGIN}${user.profileImage}`} alt="profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
                width: 230,
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
                    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
                    border-radius: 10px; cursor: pointer; color: ${COLORS.text};
                    text-decoration: none; font-weight: 600; font-size: 13px;
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
                <Link to="/pricing" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  💎 KissanSarthi Pro
                </Link>
                <Link to="/experts" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  👨‍🔬 Expert Consultation
                </Link>
                <Link to="/profile?tab=payments" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  🧾 Invoices & Receipts
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