import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { Card } from '../components/common/Card';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync form data with user context
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        pincode: user.pincode || '',
        address: user.address || '',
        farmSize: user.farmSize || 0,
        gender: user.gender || '',
        dob: user.dob ? user.dob.split('T')[0] : '', // Format for date input
      });
    }
  }, [user, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      const submitData = new FormData();
      submitData.append('profileImage', file);
      
      const { data } = await authAPI.updateProfile(submitData);
      updateUser(data.data.user);
      setSuccess('Profile photo updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      const { data } = await authAPI.updateProfile(submitData);
      updateUser(data.data.user);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-transition" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, fontFamily: 'Georgia, serif', color: COLORS.text }}>{t('profile.title')}</h1>
          <p style={{ margin: '6px 0 0', color: COLORS.textMuted, fontSize: 16 }}>{t('profile.subtitle')}</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setError(''); setSuccess(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 14,
              background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color: 'white', border: 'none',
              fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)'
            }}
          >
            <Icon name="edit" size={18} color="white" />
            {t('navbar.editProfile')}
          </button>
        )}
      </div>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="bell" size={16} /> {error}</div>}
      {success && <div style={{ background: '#dcfce7', border: '1px solid #4ade80', color: '#15803d', padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={16} /> {success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: AVATAR & QUICK STATS */}
        <Card style={{ padding: 32, textAlign: 'center', position: 'sticky', top: 24 }}>
          <div style={{ 
            width: 140, height: 140, borderRadius: '50%', margin: '0 auto 20px', 
            background: `${COLORS.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `4px solid ${COLORS.primary}33`, overflow: 'hidden', position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
          }}>
            {user.profileImage ? (
              <img src={`http://localhost:5000${user.profileImage}`} alt="profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (
              <Icon name="user" size={70} color={COLORS.primary} />
            )}
            
            {/* Hover overlay for changing photo */}
            <div 
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '6px 0', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="camera" size={18} color="white" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />
          </div>
          
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: COLORS.text }}>{user.name}</h2>
          <div style={{ color: COLORS.primary, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', marginBottom: 24, letterSpacing: '1px' }}>
            {user.role}
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, textAlign: 'left', border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="shield" size={14} /> Status</span>
              <span style={{ color: user.isVerified ? COLORS.primary : COLORS.orange, fontSize: 13, fontWeight: 800, background: user.isVerified ? '#dcfce7' : '#ffedd5', padding: '4px 10px', borderRadius: 20 }}>
                {user.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={14} /> Joined</span>
              <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 800 }}>
                {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN: DETAILS FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <Card style={{ padding: 32 }}>
                <SectionHeader icon="user" title={t('profile.personalInformation')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <InputGroup label={t('profile.fullName')} name="name" value={formData.name} onChange={handleChange} required />
                  <InputGroup label={t('profile.gender')} name="gender" type="select" value={formData.gender} onChange={handleChange} options={[t('auth.male'), t('auth.female'), t('auth.other')]} />
                  <InputGroup label={t('profile.dateOfBirth')} name="dob" type="date" value={formData.dob} onChange={handleChange} />
                </div>
              </Card>

              <Card style={{ padding: 32 }}>
                <SectionHeader icon="mail" title={t('profile.contactInformation')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <InputGroup label={t('profile.phoneNumber')} name="phone" value={formData.phone} onChange={handleChange} required />
                  <InputGroup label={t('profile.emailAddressReadOnly')} value={user.email} disabled />
                </div>
              </Card>

              <Card style={{ padding: 32 }}>
                <SectionHeader icon="map-pin" title={t('profile.locationDetails')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                    <InputGroup label={t('profile.pinCode')} name="pincode" value={formData.pincode} onChange={handleChange} required />
                    <InputGroup label={t('profile.cityDistrict')} name="city" value={formData.city} onChange={handleChange} required />
                    <InputGroup label={t('profile.state')} name="state" value={formData.state} onChange={handleChange} required />
                  </div>
                  <InputGroup label={t('profile.addressVillage')} name="address" value={formData.address} onChange={handleChange} required />
                  <InputGroup label={t('profile.country')} name="country" value={formData.country} onChange={handleChange} required />
                </div>
              </Card>
              
              <Card style={{ padding: 32 }}>
                <SectionHeader icon="crop" title={t('profile.farmInformation')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <InputGroup label={t('profile.farmSize')} name="farmSize" type="number" value={formData.farmSize} onChange={handleChange} />
                </div>
              </Card>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 8 }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{
                  background: 'white', color: COLORS.text, border: `1.5px solid ${COLORS.border}`,
                  padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{
                  background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, 
                  color: 'white', border: 'none', padding: '14px 32px', borderRadius: 14, 
                  fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)'
                }}>
                  {loading ? t('notifications.loading') : t('profile.saveChanges')}
                </button>
              </div>

            </form>
          ) : (
            <>
              <Card style={{ padding: 32 }}>
                <SectionHeader icon="user" title={t('profile.personalInformation')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                  <InfoItem label={t('profile.fullName')} value={user.name} />
                  <InfoItem label={t('profile.gender')} value={user.gender} />
                  <InfoItem label={t('profile.dateOfBirth')} value={user.dob ? new Date(user.dob).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'}) : ''} />
                </div>
              </Card>

              <Card style={{ padding: 32 }}>
                <SectionHeader icon="mail" title={t('profile.contactInformation')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                  <InfoItem label={t('profile.phoneNumber')} value={user.phone} />
                  <InfoItem label={t('profile.emailAddress')} value={user.email} />
                </div>
              </Card>

              <Card style={{ padding: 32 }}>
                <SectionHeader icon="map-pin" title={t('profile.locationDetails')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30 }}>
                    <InfoItem label="PIN Code" value={user.pincode} />
                    <InfoItem label="City / District" value={user.city} />
                    <InfoItem label="State" value={user.state} />
                  </div>
                  <InfoItem label={t('profile.addressVillage')} value={user.address} />
                  <InfoItem label={t('profile.country')} value={user.country} />
                </div>
              </Card>

              <Card style={{ padding: 32 }}>
                <SectionHeader icon="crop" title={t('profile.farmInformation')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                  <InfoItem label={t('profile.farmSize')} value={user.farmSize ? `${user.farmSize} Acres` : ''} />
                </div>
              </Card>

              <Card style={{ padding: 32 }}>
                <SectionHeader icon="community" title={t('profile.communityProfile')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30 }}>
                  <InfoItem label={t('profile.totalPosts')} value={user.totalPosts || 0} />
                  <InfoItem label={t('profile.followers')} value={user.followersCount || 0} />
                  <InfoItem label={t('profile.following')} value={user.followingCount || 0} />
                </div>
                {user.badges && user.badges.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Badges</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {user.badges.map(badge => (
                        <div key={badge} style={{ padding: '6px 12px', background: COLORS.primary + '20', color: COLORS.primary, borderRadius: 12, fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
                          🏆 {badge}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

const SectionHeader = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${COLORS.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={16} color={COLORS.primary} />
    </div>
    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>{title}</h3>
  </div>
);

const InputGroup = ({ label, name, type = 'text', value, onChange, disabled, required, options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{label}</label>
    {type === 'select' ? (
      <select name={name} value={value} onChange={onChange} disabled={disabled} required={required} style={{...inputStyle, background: disabled ? '#F8FAFC' : 'white', opacity: disabled ? 0.7 : 1, color: value ? COLORS.text : COLORS.textMuted}}>
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} required={required} style={{...inputStyle, background: disabled ? '#F8FAFC' : 'white', opacity: disabled ? 0.7 : 1}} />
    )}
  </div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 16, color: COLORS.text, fontWeight: 700 }}>{value || <span style={{opacity: 0.4, fontWeight: 500}}>Not specified</span>}</div>
  </div>
);

const inputStyle = {
  padding: '14px 16px',
  borderRadius: 14,
  border: `1.5px solid #E2E8F0`,
  fontSize: 15,
  fontWeight: 600,
  color: COLORS.text,
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box'
};

export default ProfilePage;
