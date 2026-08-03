import React, { useState } from 'react';
import { COLORS } from '../../constants/theme';
import { Icon } from '../common/Icon';
import { communityAPI } from '../../services/api';

export const CommentSection = ({ post, onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.commentList || []);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await communityAPI.commentPost(post.id, newComment, replyTo);
      const comment = { ...res.data.data.comment, parentComment: replyTo };
      setComments(prev => [...prev, comment]);
      if (onCommentAdded) onCommentAdded(comment);
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editingText.trim()) return;
    const res = await communityAPI.updateComment(commentId, editingText);
    setComments(prev => prev.map(comment => comment.id === commentId ? res.data.data.comment : comment));
    setEditingId(null);
    setEditingText('');
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await communityAPI.deleteComment(post.id, commentId);
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleLike = async (commentId) => {
    const res = await communityAPI.likeComment(commentId);
    setComments(prev => prev.map(comment => comment.id === commentId ? res.data.data.comment : comment));
  };

  const roots = comments.filter(comment => !comment.parentComment);
  const repliesFor = (id) => comments.filter(comment => String(comment.parentComment) === String(id));

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} style={{ display: 'flex', gap: 12, marginLeft: isReply ? 42 : 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <Icon name="user" size={16} color={COLORS.textMuted} />
      </div>
      <div style={{ flex: 1, background: COLORS.bg, padding: '12px', borderRadius: '0 12px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.text }}>{comment.author}</span>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{comment.time}{comment.edited ? ' • Edited' : ''}</span>
        </div>
        {editingId === comment.id ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={editingText} onChange={e => setEditingText(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 10, border: `1px solid ${COLORS.border}` }} />
            <button onClick={() => handleUpdate(comment.id)} style={actionButtonStyle}>Save</button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: COLORS.text }}>{comment.text}</p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => handleLike(comment.id)} style={linkButtonStyle}>Like {comment.likes || ''}</button>
          {!isReply && <button onClick={() => setReplyTo(comment.id)} style={linkButtonStyle}>Reply</button>}
          <button onClick={() => { setEditingId(comment.id); setEditingText(comment.text); }} style={linkButtonStyle}>Edit</button>
          <button onClick={() => handleDelete(comment.id)} style={{ ...linkButtonStyle, color: COLORS.red }}>Delete</button>
        </div>
        {repliesFor(comment.id).map(reply => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 20, border: `1px solid ${COLORS.border}`, outline: 'none', background: COLORS.bg, fontSize: 14 }}
        />
        <button type="submit" disabled={loading} style={{ background: COLORS.primary, color: 'white', border: 'none', borderRadius: 20, padding: '0 20px', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : 'Send'}
        </button>
      </form>

      {replyTo && (
        <div style={{ margin: '-10px 0 14px', color: COLORS.textMuted, fontSize: 12 }}>
          Replying to a comment <button onClick={() => setReplyTo(null)} style={linkButtonStyle}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {roots.map(comment => renderComment(comment))}
      </div>
    </div>
  );
};

const linkButtonStyle = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  color: COLORS.primary,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const actionButtonStyle = {
  border: 'none',
  background: COLORS.primary,
  color: 'white',
  borderRadius: 10,
  padding: '0 12px',
  fontWeight: 700,
  cursor: 'pointer',
};
