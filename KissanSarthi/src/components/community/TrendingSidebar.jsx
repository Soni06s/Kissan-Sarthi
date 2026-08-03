import React from 'react';
import { COLORS } from '../../constants/theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icon';

export const TrendingSidebar = ({ trendingTags = [], topFarmers = [] }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Farmers Card */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: COLORS.text }}>Top Contributors</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topFarmers.length > 0 ? topFarmers.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: COLORS.bg, borderRadius: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: i === 0 ? COLORS.primary : COLORS.border, color: i === 0 ? 'white' : COLORS.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{f.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{f.district || f.state || 'India'}</div>
              </div>
              <Badge text={`${f.totalPosts} Posts`} color={COLORS.primary} />
            </div>
          )) : (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No top contributors yet. Be the first!
            </div>
          )}
        </div>
      </Card>

      {/* Trending Topics */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: COLORS.text }}>Trending Topics</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {trendingTags.length > 0 ? trendingTags.map((tag, i) => (
            <div key={i} style={{ padding: '8px 14px', background: COLORS.primary + '10', borderRadius: 12, fontSize: 12, fontWeight: 700, color: COLORS.primary, cursor: 'pointer', border: `1px solid ${COLORS.primary}22` }}>
              #{tag}
            </div>
          )) : (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0', width: '100%' }}>
              No trending topics right now.
            </div>
          )}
        </div>
      </Card>

      {/* Pro Tip Card */}
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Icon name="star" size={24} color="white" />
          <h4 style={{ margin: 0 }}>Community Guidelines</h4>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, margin: 0 }}>
          Be respectful, share verified farming information, and help fellow farmers grow together.
        </p>
      </Card>
    </div>
  );
};
