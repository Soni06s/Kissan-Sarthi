import React, { useState, useEffect } from "react";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { PostCard } from "../components/community/PostCard";
import { TrendingSidebar } from "../components/community/TrendingSidebar";
import { CreatePostModal } from "../components/community/CreatePostModal";
import { CommentSection } from "../components/community/CommentSection";
import { Skeleton } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { communityAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useSocket } from "../hooks/useSocket";

const CATEGORY_ICONS = {
  'General Discussion': 'community',
  'Crop Advice': 'crop',
  'Question': 'chat',
  'Disease Alert': 'warning',
  'Market Information': 'market',
  'Success Story': 'star',
  'Government Scheme': 'document',
  'Weather Alert': 'weather',
  'Equipment': 'settings',
  'Organic Farming': 'leaf'
};

const CommunityPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalPosts: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, post: null, reason: 'Violated community guidelines' });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [feedMode, setFeedMode] = useState('newest');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [trendingTags, setTrendingTags] = useState(['WheatHarvest', 'OrganicFarming', 'MSPUpdates', 'DripAgri']);
  const [topFarmers, setTopFarmers] = useState([
    { name: "Harpreet Singh", state: "Punjab", totalPosts: 14 },
    { name: "Priya Patel", state: "Gujarat", totalPosts: 11 },
    { name: "Ramesh Sharma", state: "Haryana", totalPosts: 9 }
  ]);

  const { socket } = useSocket();

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const res = await communityAPI.getTrending();
        const data = res.data?.data;
        if (data?.trendingTags?.length) setTrendingTags(data.trendingTags);
        if (data?.topFarmers?.length) setTopFarmers(data.topFarmers);
      } catch (err) {
        console.warn('Could not load trending community sidebar', err);
      }
    };
    fetchSidebarData();
  }, []);

  useEffect(() => {
    fetchPosts(1, true);
  }, [activeCategory, searchQuery, feedMode]);

  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      if (!newPost) return;
      setPosts((prev) => [newPost, ...prev.filter((p) => (p.id || p._id) !== (newPost.id || newPost._id))]);
    };

    const handlePostLiked = ({ postId, likes }) => {
      if (!postId) return;
      setPosts((prev) =>
        prev.map((p) => ((p.id || p._id) === postId ? { ...p, likes: typeof likes === "number" ? likes : p.likes } : p))
      );
    };

    socket.on("post_new", handleNewPost);
    socket.on("post_liked", handlePostLiked);

    return () => {
      socket.off("post_new", handleNewPost);
      socket.off("post_liked", handlePostLiked);
    };
  }, [socket]);

  const fetchPosts = async (pageNum, reset = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 10 };
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;

      if (feedMode === 'popular') params.sort = 'popular';
      if (feedMode === 'trending') params.sort = 'trending';
      if (feedMode === 'pinned') params.sort = 'pinned';

      const res = feedMode === 'mine'
        ? await communityAPI.getMyPosts(params)
        : await communityAPI.getPosts(params);
      const newPosts = res.data.data.posts || [];
      
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(res.data.data.currentPage < res.data.data.totalPages);
      setPage(pageNum);
      setStats({ totalPosts: res.data.data.totalPosts || newPosts.length });
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setStats(prev => ({ ...prev, totalPosts: (prev.totalPosts || 0) + 1 }));
    showToast(newPost.status === 'draft' ? 'Draft saved' : 'Post published');
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
    setEditingPost(null);
    showToast('Post updated');
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentAdded = (postId, comment) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments + 1,
          commentList: [...(p.commentList || []), comment]
        };
      }
      return p;
    }));
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleDelete = (post) => {
    setDeleteModal({
      isOpen: true,
      post,
      reason: user?.role === 'admin' ? 'Violated community guidelines' : '',
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.post) return;
    const post = deleteModal.post;
    const reason = deleteModal.reason;
    setDeleting(true);
    try {
      await communityAPI.deletePost(post.id, { reason });
      setPosts(prev => prev.filter(item => item.id !== post.id));
      setStats(prev => ({ ...prev, totalPosts: Math.max((prev.totalPosts || 1) - 1, 0) }));
      showToast(user?.role === 'admin' ? 'Post deleted (Moderation action logged)' : 'Post deleted');
      setDeleteModal({ isOpen: false, post: null, reason: '' });
    } catch (err) {
      console.error('Failed to delete post:', err);
      showToast('Could not delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleModerate = async (post, data) => {
    try {
      const res = await communityAPI.moderatePost(post.id, data);
      if (data.status === 'hidden') {
        setPosts(prev => prev.filter(item => item.id !== post.id));
        showToast('Post hidden');
      } else {
        setPosts(prev => prev.map(item => item.id === post.id ? res.data.data.post : item));
        showToast('Moderation saved');
      }
    } catch (err) {
      console.error('Failed to moderate post:', err);
      showToast('Moderation failed');
    }
  };

  const openDetails = async (post) => {
    setSelectedPost({ post, comments: [] });
    setDetailLoading(true);
    try {
      const res = await communityAPI.getPost(post.id);
      setSelectedPost(res.data.data);
    } catch (err) {
      console.error('Failed to load post details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closePostModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  return (
    <div className="page-transition">
      {toast && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1300, background: COLORS.primary, color: 'white', padding: '10px 16px', borderRadius: 12, fontWeight: 700, boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>Farmer Community</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>Connect, share, and grow together with farmers across India.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder={t('community.searchPosts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 16px 10px 40px', borderRadius: 20, border: `1px solid ${COLORS.border}`, outline: 'none', width: 250 }}
            />
            <div style={{ position: 'absolute', left: 14, top: 12, opacity: 0.5 }}>
              <Icon name="search" size={16} />
            </div>
          </div>
          <button 
            onClick={() => { setEditingPost(null); setIsModalOpen(true); }}
            style={{ background: COLORS.primary, color: "white", border: "none", borderRadius: 20, padding: "10px 24px", cursor: "pointer", fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <Icon name="plus" size={18} color="white" /> {t('community.newPost')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          ['newest', 'Newest Posts'],
          ['popular', 'Popular Posts'],
          ['trending', 'Trending Posts'],
          ['pinned', 'Pinned Posts'],
          ['mine', 'My Posts'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setFeedMode(id)} style={{ padding: '9px 14px', borderRadius: 14, border: `1px solid ${feedMode === id ? COLORS.primary : COLORS.border}`, background: feedMode === id ? COLORS.primary : COLORS.cardBg, color: feedMode === id ? 'white' : COLORS.text, cursor: 'pointer', fontWeight: 700 }}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', color: COLORS.textMuted, fontWeight: 700, fontSize: 13, alignSelf: 'center' }}>
          {stats.totalPosts || 0} posts
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 16, scrollbarWidth: 'none' }}>
        {['All', ...Object.keys(CATEGORY_ICONS)].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              whiteSpace: 'nowrap',
              padding: '8px 16px', 
              borderRadius: 20, 
              border: cat === activeCategory ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              background: cat === activeCategory ? COLORS.primary + '15' : COLORS.cardBg,
              color: cat === activeCategory ? COLORS.primary : COLORS.text,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              gap: 6,
              alignItems: 'center'
            }}
          >
            {cat !== 'All' && <Icon name={CATEGORY_ICONS[cat] || 'document'} size={14} color={cat === activeCategory ? COLORS.primary : COLORS.textMuted} />}
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 24 }} className="grid-split">

        {/* ─── FEED SECTION ────────────────────────────────────────── */}
        <div>
          {/* Post Feed */}
          {posts.map(post => (
            <div key={post.id} style={{ marginBottom: 16 }}>
              <PostCard 
                post={post} 
                onComment={() => toggleComments(post.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onModerate={handleModerate}
                onOpenDetails={openDetails}
              />
              {expandedComments[post.id] && (
                <div style={{ padding: '0 20px 20px', marginTop: -20, background: COLORS.cardBg, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, border: `1px solid ${COLORS.border}`, borderTop: 'none' }}>
                  <CommentSection post={post} onCommentAdded={(c) => handleCommentAdded(post.id, c)} />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'grid', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <Card key={i} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <div>
                      <Skeleton width={120} height={14} style={{ marginBottom: 8 }} />
                      <Skeleton width={80} height={10} />
                    </div>
                  </div>
                  <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
                  <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
                  <Skeleton width="60%" height={14} style={{ marginBottom: 16 }} />
                  <Skeleton width="100%" height={200} borderRadius={12} />
                </Card>
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <EmptyState
              type="community"
              title="No Discussions Found in this Channel"
              subtitle="Be the first farmer to share advice, ask questions, or discuss field challenges with the community."
              hint="Farmer-to-farmer knowledge exchange • Verified agronomist answers"
              actionLabel="+ Start a Discussion"
              onAction={() => { setEditingPost(null); setIsModalOpen(true); }}
            />
          )}

          {!loading && hasMore && posts.length > 0 && (
            <button 
              onClick={() => fetchPosts(page + 1)}
              style={{ width: '100%', padding: 16, background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 16, color: COLORS.primary, fontWeight: 700, cursor: 'pointer' }}
            >
              Load More
            </button>
          )}
        </div>

        {/* ─── SIDEBAR SECTION ──────────────────────────────────────── */}
        <div>
          {user?.role === 'admin' && (
            <Card style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: COLORS.text }}>Admin Community Panel</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['All Posts', 'Reports', 'Pinned', 'Featured'].map(label => (
                  <button key={label} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.text, fontWeight: 700, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
              <p style={{ margin: '12px 0 0', color: COLORS.textMuted, fontSize: 12 }}>
                Admins can edit, hide, pin, feature, and delete any post from each post menu.
              </p>
            </Card>
          )}
          <TrendingSidebar 
            trendingTags={trendingTags} 
            topFarmers={topFarmers}
          />
        </div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={closePostModal} 
        onPostCreated={handlePostCreated} 
        onPostUpdated={handlePostUpdated}
        editingPost={editingPost}
      />
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.post && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(10, 30, 10, 0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 'min(500px, 100%)', background: '#FFFFFF', borderRadius: 20, border: `1px solid ${COLORS.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontSize: 20 }}>
                🗑️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                  {user?.role === 'admin' ? 'Moderate & Delete Post' : 'Delete Post'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: COLORS.textMuted }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 15, color: COLORS.text, lineHeight: 1.5 }}>
                Are you sure you want to delete this post by <strong>{deleteModal.post.user || 'Unknown User'}</strong>? All comments and bookmarks will also be removed.
              </p>

              {deleteModal.post.content && (
                <div style={{ padding: '10px 14px', background: COLORS.bg, borderRadius: 10, fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 16, borderLeft: `3px solid ${COLORS.primary}`, maxHeight: 80, overflowY: 'auto' }}>
                  "{deleteModal.post.content.slice(0, 140)}{deleteModal.post.content.length > 140 ? '...' : ''}"
                </div>
              )}

              {user?.role === 'admin' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                    Moderation Reason (Logged)
                  </label>
                  <select
                    value={deleteModal.reason}
                    onChange={(e) => setDeleteModal(prev => ({ ...prev, reason: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${COLORS.border}`, background: '#FFFFFF', fontSize: 14, color: COLORS.text, outline: 'none', marginBottom: 8 }}
                  >
                    <option value="Violated community guidelines">Violated community guidelines</option>
                    <option value="Spam / Advertisements / Promotional">Spam / Advertisements / Promotional</option>
                    <option value="Misleading or unsafe farming advice">Misleading or unsafe farming advice</option>
                    <option value="Abusive or inappropriate behavior">Abusive or inappropriate behavior</option>
                    <option value="Duplicate or low-quality content">Duplicate or low-quality content</option>
                    <option value="Other">Other (custom)</option>
                  </select>
                  {deleteModal.reason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom reason..."
                      onChange={(e) => setDeleteModal(prev => ({ ...prev, reason: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, marginTop: 4 }}
                    />
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', background: '#F9FAFB', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal({ isOpen: false, post: null, reason: '' })}
                style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${COLORS.border}`, background: '#FFFFFF', color: COLORS.text, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 700, fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {deleting ? 'Deleting...' : (user?.role === 'admin' ? 'Delete as Admin' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(10, 30, 10, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 'min(860px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(255,255,255,0.96)', borderRadius: 22, border: `1px solid ${COLORS.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
            <div style={{ padding: 22, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: COLORS.text }}>{selectedPost.post?.title || selectedPost.post?.content?.slice(0, 60) || 'Post Details'}</h2>
                <p style={{ margin: '6px 0 0', color: COLORS.textMuted, fontSize: 13 }}>
                  {selectedPost.post?.user} • {selectedPost.post?.views || 0} views • {selectedPost.post?.shares || 0} shares • {selectedPost.post?.bookmarks || 0} bookmarks • {selectedPost.post?.reports || 0} reports
                </p>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ border: 'none', background: COLORS.bg, borderRadius: 12, width: 38, height: 38, cursor: 'pointer' }}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div style={{ padding: 22 }}>
              {detailLoading ? (
                <div style={{ color: COLORS.textMuted, fontWeight: 700 }}>Loading details...</div>
              ) : (
                <>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 0 }}>{selectedPost.post?.content}</p>
                  {selectedPost.post?.editHistory?.length > 0 && (
                    <div style={{ marginBottom: 18, padding: 14, background: COLORS.bg, borderRadius: 14, color: COLORS.textMuted, fontSize: 13 }}>
                      Edit history: {selectedPost.post.editHistory.length} update(s)
                    </div>
                  )}
                  <CommentSection post={{ ...selectedPost.post, commentList: selectedPost.comments || [] }} onCommentAdded={(comment) => {
                    setSelectedPost(prev => ({ ...prev, comments: [...(prev.comments || []), comment] }));
                    handleCommentAdded(selectedPost.post.id, comment);
                  }} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
