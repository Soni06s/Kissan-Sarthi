import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { schemeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Direct Financial Support',
  'Crop Insurance',
  'Irrigation',
  'Soil & Nutrient',
  'Machinery & Equipment',
  'Organic Farming',
];

export default function SchemesPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [bookmarkingId, setBookmarkingId] = useState(null);

  // Custom filter criteria (prefilled with user's profile)
  const [farmSize, setFarmSize] = useState(user?.farmSize || '');
  const [userState, setUserState] = useState(user?.state || '');
  const [primaryCrop, setPrimaryCrop] = useState(user?.primaryCrop || '');

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (onlyEligible) params.onlyEligible = 'true';
      if (farmSize) params.landSize = farmSize;
      if (userState) params.state = userState;
      if (primaryCrop) params.crop = primaryCrop;

      const res = await schemeAPI.getSchemes(params);
      if (res.data?.success) {
        let list = res.data.data || [];
        if (onlyBookmarked) {
          list = list.filter((s) => s.isBookmarked);
        }
        setSchemes(list);
      }
    } catch (err) {
      console.error('Failed to fetch government schemes:', err);
      toast.error('Unable to load government schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [selectedCategory, onlyEligible, onlyBookmarked]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSchemes();
  };

  const handleToggleBookmark = async (schemeId) => {
    try {
      setBookmarkingId(schemeId);
      const res = await schemeAPI.toggleBookmark(schemeId);
      if (res.data?.success) {
        const isBookmarked = res.data.data?.isBookmarked;
        toast.success(isBookmarked ? 'Scheme saved to bookmarks!' : 'Removed from bookmarks');
        // Update local state
        setSchemes((prev) =>
          prev.map((s) => (s._id === schemeId ? { ...s, isBookmarked } : s))
        );
      }
    } catch (err) {
      toast.error('Could not save scheme');
    } finally {
      setBookmarkingId(null);
    }
  };

  // Get localized title
  const getSchemeTitle = (scheme) => {
    if (i18n.language === 'hi' && scheme.titleHi) return scheme.titleHi;
    if (i18n.language === 'gu' && scheme.titleGu) return scheme.titleGu;
    return scheme.title;
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60 }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #1565C0 100%)',
          borderRadius: 20,
          padding: '34px 28px',
          color: '#fff',
          boxShadow: '0 10px 30px rgba(27, 94, 32, 0.25)',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          <Icon name="badgeCheck" size={16} /> Central & State Agricultural Welfare Schemes
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Government Scheme & Subsidy Hub
        </h1>
        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 15, maxWidth: 640, lineHeight: 1.5 }}>
          Discover central government subsidies, direct benefit transfers (DBT), crop insurance plans, and solar pump schemes personalized to your landholding size and region.
        </p>
      </div>

      {/* Filter & Profile Matcher Box */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search scheme name (e.g. PM-KISAN, Tractor subsidy, Drip irrigation)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px 12px 38px',
                borderRadius: 10,
                border: '1px solid #CFD8DC',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: 12, color: '#78909C' }}>
              <Icon name="search" size={16} />
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setOnlyEligible(!onlyEligible);
                setOnlyBookmarked(false);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: onlyEligible ? '1px solid #2E7D32' : '1px solid #CFD8DC',
                background: onlyEligible ? '#E8F5E9' : '#fff',
                color: onlyEligible ? '#1B5E20' : '#455A64',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="badgeCheck" size={16} />
              {onlyEligible ? 'Showing Eligible For You' : 'Filter by My Eligibility'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyBookmarked(!onlyBookmarked);
                setOnlyEligible(false);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: onlyBookmarked ? '1px solid #F9A825' : '1px solid #CFD8DC',
                background: onlyBookmarked ? '#FFFDE7' : '#fff',
                color: onlyBookmarked ? '#F57F17' : '#455A64',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ⭐ {onlyBookmarked ? 'Showing Saved Schemes' : 'Saved Shortlist'}
            </button>

            <button
              type="submit"
              style={{
                background: COLORS.primary,
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: selectedCategory === cat ? `1px solid ${COLORS.primary}` : '1px solid #CFD8DC',
                background: selectedCategory === cat ? '#E8F5E9' : '#fff',
                color: selectedCategory === cat ? COLORS.primaryDark : '#455A64',
                fontWeight: selectedCategory === cat ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, color: COLORS.textMuted, fontWeight: 600 }}>Filtering verified government schemes...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : schemes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏛️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: COLORS.text }}>No Government Schemes Found</h3>
          <p style={{ margin: '0 0 16px', color: COLORS.textMuted, fontSize: 14 }}>
            Try resetting your eligibility filter or search query to see all agricultural schemes.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setOnlyEligible(false);
              setOnlyBookmarked(false);
            }}
            style={{
              background: COLORS.primary,
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Show All Schemes
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {schemes.map((scheme) => (
            <div
              key={scheme._id}
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: 22,
                boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                border: scheme.isEligible ? '2px solid #A5D6A7' : '1px solid #E0E0E0',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.05)';
              }}
            >
              {/* Top Tags & Bookmark Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: '#E8F5E9', color: '#1B5E20', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    {scheme.category}
                  </span>
                  {scheme.isEligible && (
                    <span style={{ background: '#2E7D32', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="badgeCheck" size={13} /> You Qualify
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleBookmark(scheme._id)}
                  disabled={bookmarkingId === scheme._id}
                  title={scheme.isBookmarked ? 'Remove bookmark' : 'Save scheme'}
                  style={{
                    background: scheme.isBookmarked ? '#FFF8E1' : '#F5F5F5',
                    border: 'none',
                    borderRadius: '50%',
                    width: 34,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    cursor: 'pointer',
                    color: scheme.isBookmarked ? '#F57F17' : '#9E9E9E',
                    transition: 'all 0.15s',
                  }}
                >
                  {scheme.isBookmarked ? '★' : '☆'}
                </button>
              </div>

              {/* Title & Ministry */}
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: COLORS.text, lineHeight: 1.3 }}>
                {getSchemeTitle(scheme)}
              </h3>
              <div style={{ fontSize: 12, color: '#78909C', marginBottom: 14 }}>
                🏛️ {scheme.ministry}
              </div>

              {/* Benefit Highlight Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 100%)',
                  border: '1px solid #C8E6C9',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Financial Benefit / Subsidy
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20', marginTop: 3, lineHeight: 1.3 }}>
                  {scheme.benefitAmount}
                </div>
              </div>

              {/* Description */}
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#455A64', lineHeight: 1.5, flex: 1 }}>
                {scheme.description}
              </p>

              {/* Eligibility Criteria box */}
              <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 12, fontSize: 12, color: '#555', marginBottom: 16, border: '1px solid #EEE' }}>
                <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
                  📋 Who Can Apply:
                </div>
                <div>{scheme.eligibility?.summary}</div>
                {scheme.eligibility?.documentsRequired?.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#78909C' }}>
                    <strong>Required Docs:</strong> {scheme.eligibility.documentsRequired.join(', ')}
                  </div>
                )}
              </div>

              {/* Action Button: Apply Online */}
              <a
                href={scheme.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: COLORS.primary,
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  transition: 'background 0.2s',
                }}
              >
                Apply on Official Portal ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
