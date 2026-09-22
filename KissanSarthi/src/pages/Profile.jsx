import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI, paymentAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { Card } from '../components/common/Card';
import { isProUser, getProExpiryDate } from '../utils/subscription';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const isPro = isProUser(user);
  const proExpiresAt = getProExpiryDate(user);
  const fileInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'payments' ? 'payments' : 'profile'
  );
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // KYC Verification state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyData, setVerifyData] = useState({
    farmSize: user?.farmSize || '',
    primaryCrop: user?.primaryCrop || '',
  });
  const [verifyFile, setVerifyFile] = useState(null);

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

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await paymentAPI.getHistory();
      setPayments(res.data?.data?.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId, razorpayPaymentId) => {
    try {
      setDownloadingId(paymentId);
      toast.loading('Generating invoice receipt PDF...', { id: 'pdf-receipt' });
      const res = await paymentAPI.downloadReceipt(paymentId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KissanSarthi_Receipt_${razorpayPaymentId || paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice receipt downloaded!', { id: 'pdf-receipt' });
    } catch (err) {
      toast.error('Could not download receipt PDF.', { id: 'pdf-receipt' });
    } finally {
      setDownloadingId(null);
    }
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

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyFile) {
      toast.error('Please upload your Land Record (7/12) or KCC document');
      return;
    }
    try {
      setVerifySubmitting(true);
      const data = new FormData();
      data.append('farmSize', verifyData.farmSize);
      data.append('primaryCrop', verifyData.primaryCrop);
      data.append('document', verifyFile);

      const res = await authAPI.verifyFarmer(data);
      if (res.data?.success) {
        toast.success('Verification submitted! Our team will audit your document shortly.');
        updateUser(res.data.data?.user || { ...user, verificationStatus: 'pending' });
        setShowVerifyModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification submission failed');
    } finally {
      setVerifySubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-transition" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, fontFamily: 'Georgia, serif', color: COLORS.text }}>{t('profile.title')}</h1>
          <p style={{ margin: '6px 0 0', color: COLORS.textMuted, fontSize: 16 }}>{t('profile.subtitle')}</p>
        </div>
        {!isEditing && activeTab === 'profile' && (
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

      {/* TABS SWITCHER */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => { setActiveTab('profile'); setSearchParams({}); }}
          style={{
            padding: '10px 22px',
            borderRadius: 14,
            border: activeTab === 'profile' ? `2px solid ${COLORS.primary}` : '1px solid #CFD8DC',
            background: activeTab === 'profile' ? '#E8F5E9' : '#fff',
            color: activeTab === 'profile' ? COLORS.primaryDark : '#455A64',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <Icon name="user" size={16} /> Profile Details
        </button>

        <button
          onClick={() => { setActiveTab('payments'); setSearchParams({ tab: 'payments' }); }}
          style={{
            padding: '10px 22px',
            borderRadius: 14,
            border: activeTab === 'payments' ? `2px solid ${COLORS.primary}` : '1px solid #CFD8DC',
            background: activeTab === 'payments' ? '#E8F5E9' : '#fff',
            color: activeTab === 'payments' ? COLORS.primaryDark : '#455A64',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <span>🧾</span> Payment History & Invoices
        </button>
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
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: COLORS.text }}>{user.name}</h2>
            {isPro && (
              <span title="KissanSarthi Pro Member" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 900 }}>
                PRO
              </span>
            )}
          </div>
          <div style={{ color: COLORS.primary, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', marginBottom: 20, letterSpacing: '1px' }}>
            {user.role}
          </div>

          {/* Pro Membership Card */}
          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, textAlign: 'left', border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💎</span> Membership
              </span>
              {isPro ? (
                <span style={{ color: '#B45309', fontSize: 11, fontWeight: 900, background: '#FEF3C7', padding: '3px 8px', borderRadius: 16, border: '1px solid #FDE68A' }}>
                  👑 PRO
                </span>
              ) : (
                <span style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, background: '#F3F4F6', padding: '3px 8px', borderRadius: 16 }}>
                  Free
                </span>
              )}
            </div>

            {isPro ? (
              <div style={{ fontSize: 12, color: '#1B5E20', background: '#E8F5E9', padding: '8px 10px', borderRadius: 8, border: '1px solid #C8E6C9' }}>
                🌟 <strong>Unlimited AI Scans & Advice</strong><br />
                Valid till: {proExpiresAt || 'Active'}
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: COLORS.textMuted, lineHeight: 1.3 }}>
                  Free tier: 3 scans/mo, 5 crop recommendations.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>💎 Upgrade to Pro (₹49)</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 18, textAlign: 'left', border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="shield" size={14} /> Verification
              </span>
              {user.verificationStatus === 'verified' ? (
                <span style={{ color: '#15803D', fontSize: 11, fontWeight: 800, background: '#DCFCE7', padding: '4px 10px', borderRadius: 20 }}>
                  ✓ Verified Farmer
                </span>
              ) : user.verificationStatus === 'pending' ? (
                <span style={{ color: '#B45309', fontSize: 11, fontWeight: 800, background: '#FEF3C7', padding: '4px 10px', borderRadius: 20 }}>
                  ⏳ In Review
                </span>
              ) : user.verificationStatus === 'rejected' ? (
                <span style={{ color: '#DC2626', fontSize: 11, fontWeight: 800, background: '#FEE2E2', padding: '4px 10px', borderRadius: 20 }}>
                  ✕ Rejected
                </span>
              ) : (
                <span style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, background: '#F3F4F6', padding: '4px 10px', borderRadius: 20 }}>
                  Unverified
                </span>
              )}
            </div>

            {user.verificationStatus === 'verified' ? (
              <div style={{ fontSize: 12, color: '#15803D', background: '#F0FDF4', padding: '10px 12px', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                🛡️ <strong>Official Verified Badge Active</strong><br />
                Your produce listings and community posts show the green checkmark badge.
              </div>
            ) : user.verificationStatus === 'pending' ? (
              <div style={{ fontSize: 12, color: '#92400E', background: '#FFFBEB', padding: '10px 12px', borderRadius: 10, border: '1px solid #FDE68A' }}>
                ⏳ Document submitted. Our team is auditing your land records.
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: COLORS.textMuted, lineHeight: 1.4 }}>
                  Upload land records (7/12) or KCC to gain buyer trust & get a verified badge.
                </p>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#16A34A',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Icon name="badgeCheck" size={14} /> {user.verificationStatus === 'rejected' ? 'Resubmit Verification' : 'Get Verified Farmer Badge'}
                </button>
              </div>
            )}
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, textAlign: 'left', border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={14} /> Joined</span>
              <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 800 }}>
                {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN: DETAILS FORM OR PAYMENT HISTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeTab === 'payments' ? (
            <Card style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.text }}>
                    Transaction History & Invoices
                  </h3>
                  <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 13 }}>
                    Official Razorpay payment receipts, order IDs, and status tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchPayments}
                  style={{ background: 'none', border: '1px solid #CFD8DC', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  🔄 Refresh
                </button>
              </div>

              {paymentsLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>
                  <div style={{ width: 32, height: 32, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                  Loading payment records...
                </div>
              ) : payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, border: '1px dashed #CFD8DC', borderRadius: 16, background: '#FAFAFA' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div>
                  <h4 style={{ margin: '0 0 6px', color: COLORS.text, fontSize: 16, fontWeight: 700 }}>No Transactions Yet</h4>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>
                    Your subscription receipts, marketplace priority boosts, and expert consultation payments will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/pricing')}
                    style={{ background: COLORS.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    View Pro Plans
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ECEFF1', color: COLORS.textMuted, fontSize: 12, textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 8px' }}>Date</th>
                        <th style={{ padding: '12px 8px' }}>Purpose</th>
                        <th style={{ padding: '12px 8px' }}>Order & Payment ID</th>
                        <th style={{ padding: '12px 8px' }}>Amount</th>
                        <th style={{ padding: '12px 8px' }}>Status</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
                        const purposeLabels = {
                          pro_subscription: '💎 Pro Membership',
                          priority_listing: '🚀 Marketplace Boost',
                          expert_consultation: '👨‍🔬 Expert Consultation',
                          marketplace_listing_fee: '🛒 Listing Fee',
                        };
                        return (
                          <tr key={p._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px 8px', color: COLORS.text, whiteSpace: 'nowrap' }}>
                              {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 700, color: COLORS.text }}>
                              {purposeLabels[p.purpose] || p.purpose}
                            </td>
                            <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
                              <div>Ord: {p.razorpayOrderId}</div>
                              {p.razorpayPaymentId && <div style={{ color: '#0F172A', fontWeight: 600 }}>Pay: {p.razorpayPaymentId}</div>}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                              ₹{p.amount}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: p.status === 'paid' ? '#DCFCE7' : p.status === 'failed' ? '#FEE2E2' : '#FEF3C7',
                                  color: p.status === 'paid' ? '#15803D' : p.status === 'failed' ? '#B91C1C' : '#B45309',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              {p.status === 'paid' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(p._id, p.razorpayPaymentId)}
                                  disabled={downloadingId === p._id}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#F1F5F9',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#334155',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  {downloadingId === p._id ? 'Generating...' : '📥 PDF Receipt'}
                                </button>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: 11 }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ) : isEditing ? (
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

      {/* VERIFICATION MODAL */}
      {showVerifyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 540,
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #ECEFF1', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.primaryDark, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="badgeCheck" size={20} /> Verified Farmer KYC
              </h2>
              <button
                onClick={() => setShowVerifyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#90A4AE' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#546E7A', lineHeight: 1.5 }}>
              Verify your farm ownership with a valid land record (7/12, RoR) or Kisan Credit Card (KCC). Verified farmers get a green badge on produce listings and community discussions.
            </p>

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                  Total Landholding / Farm Size (Acres) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 5.5"
                  value={verifyData.farmSize}
                  onChange={(e) => setVerifyData({ ...verifyData, farmSize: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                  Primary Crops Cultivated *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wheat, Mustard, Soybean"
                  value={verifyData.primaryCrop}
                  onChange={(e) => setVerifyData({ ...verifyData, primaryCrop: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                  Land Record (7/12, RoR) or Kisan Credit Card (KCC) Document *
                </label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setVerifyFile(e.target.files[0])}
                  style={{ fontSize: 13, width: '100%' }}
                />
                <div style={{ fontSize: 11, color: '#78909C', marginTop: 4 }}>
                  🔒 Private & admin-only access. Upload JPG, PNG, or PDF up to 5MB.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #CFD8DC', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: COLORS.primary,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46,125,50,0.25)',
                  }}
                >
                  {verifySubmitting ? 'Uploading to Secure Storage...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
