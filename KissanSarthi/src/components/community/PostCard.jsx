import React, { useState } from 'react';
import { COLORS } from '../../constants/theme';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';
import { communityAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const PostCard = ({ post, onComment, onEdit, onDelete, onOpenDetails, onModerate, onBookmark }) => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const isOwner = String(post.author?._id || post.author?.id || post.authorId || '') === String(currentUserId || '');
  const isAdmin = user?.role === 'admin';
  const [isLiked, setIsLiked] = useState((post.likedBy || []).some(id => String(id) === String(currentUserId)));
  const [likesCount, setLikesCount] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');

  const handleLike = async () => {
    try {
      // Optimistic UI update
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      const res = await communityAPI.likePost(post.id);
      setLikesCount(res.data.data.post.likes);
    } catch (err) {
      // Revert on failure
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Failed to like post:', err);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await communityAPI.bookmarkPost(post.id);
      setBookmarked(res.data.data.bookmarked);
      setToast(res.data.message);
      setTimeout(() => setToast(''), 1800);
      if (onBookmark) onBookmark(post.id);
    } catch (err) {
      console.error('Failed to bookmark:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title || 'KissanSarthi community post', text: post.content, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast('Link copied');
      }
      const res = await communityAPI.sharePost(post.id);
      setSharesCount(res.data.data.post.shares);
      setTimeout(() => setToast(''), 1800);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to share post:', err);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('Report reason: Spam, Fake Information, Abuse, Violence, Other', 'Spam');
    if (!reason) return;
    try {
      await communityAPI.reportPost(post.id, reason);
      setToast('Report submitted');
      setTimeout(() => setToast(''), 1800);
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to report post:', err);
    }
  };

  return (
    <Card style={{ marginBottom: 16, padding: 20 }}>
      {toast && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1200, background: COLORS.primary, color: 'white', padding: '10px 16px', borderRadius: 12, fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: COLORS.bg, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {post.author?.profileImage ? (
              <img src={post.author.profileImage} alt={post.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon name="user" size={24} color={COLORS.primary} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{post.user}</span>
              {post.verified && <Icon name="check" size={14} color={COLORS.primary} />}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              📍 {post.district || 'India'} • {post.time}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Post menu">
            <Icon name="menu" size={18} color={COLORS.textMuted} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: 28, width: 180, background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12, boxShadow: '0 14px 35px rgba(0,0,0,0.12)', padding: 8, zIndex: 20 }}>
              <button onClick={() => { onOpenDetails?.(post); setMenuOpen(false); }} style={menuButtonStyle}>View Details</button>
              {(isOwner || isAdmin) && <button onClick={() => { onEdit?.(post); setMenuOpen(false); }} style={menuButtonStyle}>Edit Post</button>}
              {isAdmin && <button onClick={() => { onModerate?.(post, { pinned: !post.pinned }); setMenuOpen(false); }} style={menuButtonStyle}>{post.pinned ? 'Unpin Post' : 'Pin Post'}</button>}
              {isAdmin && <button onClick={() => { onModerate?.(post, { featured: !post.featured }); setMenuOpen(false); }} style={menuButtonStyle}>{post.featured ? 'Unfeature Post' : 'Feature Post'}</button>}
              {isAdmin && <button onClick={() => { onModerate?.(post, { status: 'hidden' }); setMenuOpen(false); }} style={menuButtonStyle}>Hide Post</button>}
              {(isOwner || isAdmin) && <button onClick={() => { onDelete?.(post); setMenuOpen(false); }} style={{ ...menuButtonStyle, color: COLORS.red }}>Delete Post</button>}
              <button onClick={handleReport} style={menuButtonStyle}>Report</button>
            </div>
          )}
        </div>
      </div>

      {post.title && <h3 onClick={() => onOpenDetails?.(post)} style={{ margin: '0 0 8px', fontSize: 18, color: COLORS.text, cursor: 'pointer' }}>{post.title} {post.edited && <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>(Edited)</span>}</h3>}
      <p onClick={() => onOpenDetails?.(post)} style={{ fontSize: 15, color: COLORS.text, lineHeight: 1.6, margin: '0 0 16px', whiteSpace: 'pre-wrap', cursor: 'pointer' }}>
        {post.content}
      </p>

      {/* Media Rendering */}
      {post.images && post.images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {post.images.map((img, idx) => (
            <img key={idx} src={img} alt="Post" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 300 }} />
          ))}
        </div>
      )}

      {(post.videos || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: post.videos.length === 1 ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {post.videos.map((video, idx) => (
            <video key={idx} src={video} controls preload="metadata" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 320 }} />
          ))}
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {post.tags.map((tag, idx) => (
            <span key={idx} style={{ color: COLORS.blue, fontSize: 13, fontWeight: 500 }}>#{tag}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? COLORS.primary : COLORS.text, fontWeight: 600, fontSize: 14, transition: 'color 0.2s' }}>
          <Icon name="like" size={18} color={isLiked ? COLORS.primary : COLORS.textMuted} /> {likesCount}
        </button>
        <button onClick={() => onComment && onComment(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
          <Icon name="comment" size={18} color={COLORS.textMuted} /> {post.comments}
        </button>
        <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, fontWeight: 600, fontSize: 14 }}>
          <Icon name="send" size={18} color={COLORS.textMuted} /> {sharesCount || 'Share'}
        </button>
        <button onClick={handleBookmark} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: bookmarked ? COLORS.primary : COLORS.textMuted, fontWeight: 600, fontSize: 14, marginLeft: 'auto' }}>
          <Icon name="bookmark" size={18} color={bookmarked ? COLORS.primary : COLORS.textMuted} />
        </button>
      </div>
    </Card>
  );
};

const menuButtonStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  padding: '10px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  color: COLORS.text,
};
