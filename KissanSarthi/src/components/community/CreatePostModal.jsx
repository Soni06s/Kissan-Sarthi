import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../constants/theme';
import { Icon } from '../common/Icon';
import { communityAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { name: 'General Discussion', icon: 'community' },
  { name: 'Crop Advice', icon: 'crop' },
  { name: 'Question', icon: 'chat' },
  { name: 'Disease Alert', icon: 'warning' },
  { name: 'Market Information', icon: 'market' },
  { name: 'Success Story', icon: 'star' },
  { name: 'Government Scheme', icon: 'document' },
  { name: 'Weather Alert', icon: 'weather' },
  { name: 'Equipment', icon: 'settings' },
  { name: 'Organic Farming', icon: 'leaf' }
];

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public', icon: 'globe', desc: 'Anyone can see this' },
  { id: 'private', label: 'Private', icon: 'user', desc: 'Only you can see this' },
  { id: 'followers', label: 'Followers', icon: 'user-check', desc: 'Only your followers' }
];

export const CreatePostModal = ({ isOpen, onClose, onPostCreated, onPostUpdated, editingPost = null }) => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General Discussion');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState({ state: '', district: '', village: '' });
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // UI States
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(editingPost?.title || '');
    setContent(editingPost?.content || '');
    setCategory(editingPost?.category || 'General Discussion');
    setTags(editingPost?.tags || []);
    setVisibility(editingPost?.visibility || 'public');
    setLocation({
      state: editingPost?.location?.state || '',
      district: editingPost?.location?.district || editingPost?.district || '',
      village: editingPost?.location?.village || '',
    });
    setExistingImages(editingPost?.images || []);
    setExistingVideos(editingPost?.videos || (editingPost?.video ? [editingPost.video] : []));
    setFiles([]);
    setError('');
  }, [isOpen, editingPost]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    // Generate previews when files change
    const previews = files.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.split('/')[0]
    }));
    setFilePreviews(previews);
    
    // Cleanup URLs
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [files]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '180px';
      textareaRef.current.style.height = `${Math.max(180, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen && !isAnimating) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      // Reset state if needed, or keep draft
      onClose();
    }, 300);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(f => {
      const isValidType = f.type.startsWith('image/') || f.type.startsWith('video/');
      const isValidSize = f.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });
    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveExistingImage = (index, direction) => {
    const next = [...existingImages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setExistingImages(next);
  };

  const validateForm = () => {
    if (!content.trim()) {
      setError('Please write something before posting.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // MUST NOT CHANGE BACKEND LOGIC OR API INTEGRATION
      const intent = e.nativeEvent?.submitter?.value || 'active';
      const formData = new FormData();
      if (title) formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      
      // The original code used a single string `tags`, but backend split it.
      // We will append them exactly as the original code did or use the array directly.
      tags.forEach(tag => formData.append('tags[]', tag));
      
      // Also add visibility to match our new UI state, if backend supports it. (Backend schema has it)
      formData.append('visibility', visibility);
      formData.append('status', intent === 'draft' ? 'draft' : 'active');
      formData.append('location[state]', location.state);
      formData.append('location[district]', location.district);
      formData.append('location[village]', location.village);
      formData.append('mediaTouched', editingPost ? 'true' : 'false');
      existingImages.forEach(img => formData.append('existingImages', img));
      existingVideos.forEach(video => formData.append('existingVideos', video));

      files.forEach(f => {
        if (f.type.startsWith('image/')) formData.append('images', f);
        else if (f.type.startsWith('video/')) formData.append('videos', f);
      });

      const res = editingPost
        ? await communityAPI.updatePost(editingPost.id, formData)
        : await communityAPI.createPost(formData);
      if (editingPost) onPostUpdated?.(res.data.data.post);
      else onPostCreated?.(res.data.data.post);
      
      // Reset form
      setTitle('');
      setContent('');
      setCategory('General Discussion');
      setTags([]);
      setFiles([]);
      setExistingImages([]);
      setExistingVideos([]);
      setLocation({ state: '', district: '', village: '' });
      handleClose();
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryIcon = CATEGORIES.find(c => c.name === category)?.icon || 'community';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: isAnimating ? 'rgba(26, 46, 26, 0.4)' : 'rgba(26, 46, 26, 0)',
      backdropFilter: isAnimating ? 'blur(8px)' : 'blur(0px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: '20px 10px'
    }}>
      <div 
        ref={modalRef}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 850,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(46, 125, 50, 0.25), 0 0 0 1px rgba(255,255,255,0.5) inset',
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          opacity: isAnimating ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* HEADER */}
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${COLORS.border}66`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: `linear-gradient(to right, ${COLORS.bg}, white)` }}>
          <div>
            <h2 id="modal-title" style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.text, fontFamily: 'Georgia, serif' }}>
              {editingPost ? 'Edit Community Post' : 'Create Community Post'}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: COLORS.textMuted }}>
              Share your farming experience, ask questions, upload images and help farmers across India.
            </p>
          </div>
          <button 
            onClick={handleClose} 
            style={{ 
              background: COLORS.border + '44', border: 'none', width: 40, height: 40, borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s', color: COLORS.textMuted
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={e => { e.currentTarget.style.background = COLORS.border + '44'; e.currentTarget.style.color = COLORS.textMuted; }}
            aria-label="Close modal"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          
          {/* USER PREVIEW (Facebook style) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: COLORS.bg, overflow: 'hidden', border: `2px solid ${COLORS.border}` }}>
              {user?.profileImage ? (
                <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="user" size={24} color={COLORS.primary} />
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                {user?.name || 'Farmer'} 
                <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textMuted }}>is posting publicly</span>
              </div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                📍 {user?.city || user?.location || 'India'} • Just Now
              </div>
            </div>
          </div>

          <form id="create-post-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {error && (
              <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, animation: 'shake 0.4s' }}>
                <Icon name="warning" size={18} /> {error}
              </div>
            )}

            {/* TITLE & CATEGORY */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Give your post a title (optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ 
                  flex: 2, minWidth: 250, padding: '16px 20px', borderRadius: 16, 
                  border: `2px solid transparent`, background: COLORS.bg, fontSize: 16, 
                  fontWeight: 600, color: COLORS.text, outline: 'none', transition: 'all 0.2s',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={e => e.target.style.borderColor = COLORS.primaryLight}
                onBlur={e => e.target.style.borderColor = 'transparent'}
              />

              {/* PREMIUM CUSTOM DROPDOWN */}
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <div 
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  style={{ 
                    padding: '16px 20px', borderRadius: 16, background: COLORS.bg, 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', border: `2px solid ${showCategoryDropdown ? COLORS.primaryLight : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: COLORS.text, fontSize: 15 }}>
                    <Icon name={selectedCategoryIcon} size={18} color={COLORS.primary} />
                    {category}
                  </div>
                  <Icon name="menu" size={16} color={COLORS.textMuted} />
                </div>

                {showCategoryDropdown && (
                  <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, 
                    background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: `1px solid ${COLORS.border}`, zIndex: 10, maxHeight: 300, overflowY: 'auto',
                    padding: 8
                  }}>
                    {CATEGORIES.map(c => (
                      <div 
                        key={c.name}
                        onClick={() => { setCategory(c.name); setShowCategoryDropdown(false); }}
                        style={{
                          padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500,
                          background: category === c.name ? COLORS.primary + '15' : 'transparent',
                          color: category === c.name ? COLORS.primary : COLORS.text,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { if(category !== c.name) e.currentTarget.style.background = COLORS.bg; }}
                        onMouseOut={e => { if(category !== c.name) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Icon name={c.icon} size={18} color={category === c.name ? COLORS.primary : COLORS.textMuted} />
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CONTENT */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                placeholder="What would you like to share with the farming community today?"
                value={content}
                onChange={e => { setContent(e.target.value); setError(''); }}
                style={{ 
                  width: '100%', minHeight: 180, padding: '20px 20px 40px', borderRadius: 20, 
                  border: `2px solid ${error && !content ? '#ef4444' : 'transparent'}`, 
                  background: COLORS.bg, fontSize: 16, color: COLORS.text, outline: 'none', 
                  resize: 'none', transition: 'all 0.2s', lineHeight: 1.6, boxSizing: 'border-box'
                }}
                onFocus={e => { if(!error) e.target.style.borderColor = COLORS.primaryLight; }}
                onBlur={e => { if(!error) e.target.style.borderColor = 'transparent'; }}
              />
              <div style={{ position: 'absolute', bottom: 16, right: 20, fontSize: 12, fontWeight: 600, color: content.length > 2000 ? '#ef4444' : COLORS.textMuted }}>
                {content.length} / 2000
              </div>
            </div>

            {/* TAG CHIPS */}
            <div style={{ 
              padding: '12px 16px', borderRadius: 16, background: COLORS.bg, 
              display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
              border: '2px solid transparent', transition: 'all 0.2s'
            }}>
              <Icon name="tag" size={18} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
              {tags.map(tag => (
                <div key={tag} style={{ 
                  background: COLORS.primary, color: 'white', padding: '6px 12px', 
                  borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                }}>
                  #{tag}
                  <Icon name="close" size={12} color="white" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)} />
                </div>
              ))}
              <input 
                type="text"
                placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 15, flex: 1, minWidth: 150, padding: 4 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {['state', 'district', 'village'].map(field => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={location[field]}
                  onChange={e => setLocation(prev => ({ ...prev, [field]: e.target.value }))}
                  style={{ padding: '14px 16px', borderRadius: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, outline: 'none', fontSize: 14 }}
                />
              ))}
            </div>

            {/* UPLOAD SECTION (Drag & Drop) */}
            <div>
              {(existingImages.length > 0 || existingVideos.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {existingImages.map((img, idx) => (
                    <div key={img} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                      <img src={img} alt="Existing media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 'auto 4px 4px 4px', display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                        <button type="button" onClick={() => moveExistingImage(idx, -1)} style={{ border: 'none', borderRadius: 8, padding: '4px 7px', cursor: 'pointer' }}>Up</button>
                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))} style={{ border: 'none', borderRadius: 8, padding: '4px 7px', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}>Remove</button>
                      </div>
                    </div>
                  ))}
                  {existingVideos.map((video, idx) => (
                    <div key={video} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                      <video src={video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setExistingVideos(existingVideos.filter((_, i) => i !== idx))} style={{ position: 'absolute', right: 4, bottom: 4, border: 'none', borderRadius: 8, padding: '4px 7px', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <div 
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: `2px dashed ${dragActive ? COLORS.primary : COLORS.border}`, 
                  borderRadius: 20, padding: '40px 20px', textAlign: 'center',
                  background: dragActive ? COLORS.primary + '10' : COLORS.bg,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                }}
              >
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Icon name="image" size={32} color={COLORS.primary} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 16, color: COLORS.text, fontWeight: 700 }}>Upload Photos or Videos</h3>
                  <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Drag & Drop or <span style={{ color: COLORS.primary, fontWeight: 600 }}>Browse Files</span></p>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
                  Supported formats: JPG, PNG, WEBP, MP4 (Max 10MB)
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  multiple 
                  accept="image/jpeg,image/png,image/webp,video/mp4" 
                  style={{ display: 'none' }} 
                  onChange={e => handleFiles(Array.from(e.target.files))}
                />
              </div>

              {/* Previews Grid */}
              {filePreviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginTop: 16 }}>
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                      {preview.type === 'image' ? (
                        <img src={preview.url} alt="preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <video src={preview.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VISIBILITY */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Who can view this post?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {VISIBILITY_OPTIONS.map(opt => (
                  <div 
                    key={opt.id}
                    onClick={() => setVisibility(opt.id)}
                    style={{ 
                      padding: '16px', borderRadius: 16, cursor: 'pointer',
                      border: `2px solid ${visibility === opt.id ? COLORS.primary : COLORS.border}`,
                      background: visibility === opt.id ? COLORS.primary + '10' : 'white',
                      transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: visibility === opt.id ? COLORS.primary : COLORS.text, fontWeight: 700 }}>
                      <Icon name={opt.icon} size={18} /> {opt.label}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW CARD */}
            {(title || content || filePreviews.length > 0 || tags.length > 0) && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <Icon name="eye" size={16} /> Live Preview
                </label>
                <div style={{ padding: 24, borderRadius: 20, background: 'white', border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  
                  <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: COLORS.bg, overflow: 'hidden' }}>
                      {user?.profileImage ? (
                        <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="user" size={24} color={COLORS.primary} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{user?.name || 'Farmer'}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>📍 {user?.city || user?.location || 'India'} • Just Now</div>
                    </div>
                  </div>

                  {title && <h3 style={{ margin: '0 0 8px', fontSize: 18, color: COLORS.text }}>{title}</h3>}
                  {content && <p style={{ fontSize: 15, color: COLORS.text, lineHeight: 1.6, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{content}</p>}

                  {filePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: filePreviews.length === 1 ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 16 }}>
                      {filePreviews.map((preview, idx) => (
                        preview.type === 'image' ? (
                          <img key={idx} src={preview.url} alt="preview" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 300 }} />
                        ) : (
                          <video key={idx} src={preview.url} controls style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 300 }} />
                        )
                      ))}
                    </div>
                  )}

                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {tags.map((tag, idx) => (
                        <span key={idx} style={{ color: '#1565C0', fontSize: 13, fontWeight: 500 }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* FOOTER BUTTONS */}
        <div style={{ padding: '24px 32px', borderTop: `1px solid ${COLORS.border}66`, display: 'flex', justifyContent: 'flex-end', gap: 16, background: '#F8FAFC' }}>
          <button 
            type="button" 
            onClick={handleClose} 
            style={{ 
              padding: '14px 28px', borderRadius: 14, border: `2px solid ${COLORS.border}`, 
              background: 'white', color: COLORS.text, cursor: 'pointer', fontWeight: 700, fontSize: 15,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = COLORS.bg}
            onMouseOut={e => e.currentTarget.style.background = 'white'}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-post-form"
            value="draft"
            disabled={loading || !content.trim()} 
            style={{ 
              padding: '14px 24px', borderRadius: 14, border: `2px solid ${COLORS.border}`, 
              background: 'white', color: COLORS.text, cursor: loading || !content.trim() ? 'not-allowed' : 'pointer', 
              fontWeight: 800, fontSize: 15, opacity: loading || !content.trim() ? 0.6 : 1
            }}
          >
            Save Draft
          </button>
          <button 
            type="submit" 
            form="create-post-form"
            value="active"
            disabled={loading || !content.trim()} 
            style={{ 
              padding: '14px 40px', borderRadius: 14, border: 'none', 
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, 
              color: 'white', cursor: loading || !content.trim() ? 'not-allowed' : 'pointer', 
              fontWeight: 800, fontSize: 15, transition: 'all 0.2s',
              opacity: loading || !content.trim() ? 0.6 : 1,
              boxShadow: loading || !content.trim() ? 'none' : '0 10px 20px -10px rgba(46, 125, 50, 0.6)',
              display: 'flex', alignItems: 'center', gap: 10
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Posting...
              </>
            ) : editingPost ? 'Update Post' : 'Post to Community'}
          </button>
        </div>

      </div>
      
      {/* Global styles for animations injected locally for convenience */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes shake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-5px); } 
          75% { transform: translateX(5px); } 
        }
      `}</style>
    </div>
  );
};
