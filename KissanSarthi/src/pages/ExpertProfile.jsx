import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { consultationAPI, paymentAPI } from '../services/api';
import { openRazorpayCheckout } from '../utils/razorpay';

export default function ExpertProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intake Booking Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [crop, setCrop] = useState('Wheat');
  const [category, setCategory] = useState('Pest Infestation');
  const [description, setDescription] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('Immediate (Online Consultation)');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchExpert();
  }, [id]);

  const fetchExpert = async () => {
    try {
      setLoading(true);
      const res = await consultationAPI.getExpertById(id);
      if (res.data?.data) {
        setExpert(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching expert:', err);
      toast.error('Could not load expert profile');
      navigate('/experts');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to book a consultation');
      navigate(`/login?redirect=/experts/${id}`);
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe your crop problem or query');
      return;
    }

    setBookingLoading(true);
    const fee = expert.consultationFee || 99;

    try {
      // 1. Create Order
      const orderRes = await paymentAPI.createOrder({
        purpose: 'expert_consultation',
        amount: fee,
        currency: 'INR',
        relatedId: expert._id,
        metadata: {
          expertId: expert._id,
          crop,
          problemCategory: category,
          problemDescription: description.trim(),
          scheduledSlot,
        },
      });

      const { orderId, keyId, amount: amountPaise, currency } = orderRes.data.data;

      // 2. Open Real Razorpay Checkout Modal
      await openRazorpayCheckout({
        keyId,
        orderId,
        amount: amountPaise,
        currency,
        name: `Consultation with ${expert.name}`,
        description: `${category} Advisory (${crop})`,
        prefill: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        onSuccess: async (rzpResponse) => {
          try {
            toast.loading('Confirming consultation booking...', { id: 'verify-cons' });
            const verifyRes = await paymentAPI.verifyPayment({
              razorpayOrderId: rzpResponse.razorpayOrderId,
              razorpayPaymentId: rzpResponse.razorpayPaymentId,
              razorpaySignature: rzpResponse.razorpaySignature,
            });

            toast.success('Consultation confirmed! Opening 1-on-1 session room...', { id: 'verify-cons' });
            setShowBookingModal(false);
            const consultationId = verifyRes.data?.data?.fulfillment?.consultationId;
            if (consultationId) {
              navigate(`/experts?tab=consultations&open=${consultationId}`);
            } else {
              navigate('/experts?tab=consultations');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed on server', { id: 'verify-cons' });
          } finally {
            setBookingLoading(false);
          }
        },
        onError: (err) => {
          setBookingLoading(false);
        },
        onDismiss: () => {
          setBookingLoading(false);
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize booking');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1080, margin: '40px auto', textAlign: 'center', color: COLORS.textMuted }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        Loading certified agronomist profile...
      </div>
    );
  }

  if (!expert) return null;

  const isOnline = expert.availability !== 'offline';
  const specializations = expert.specializations?.length ? expert.specializations : expert.expertise || [];
  const qualifications = expert.qualifications || [];
  const languages = expert.languagesSpoken || ['Hindi', 'English'];
  const reviews = expert.reviews || [];

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', paddingBottom: 60 }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/experts')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          border: `1px solid ${COLORS.border}`,
          padding: '8px 16px',
          borderRadius: 12,
          color: COLORS.text,
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          marginBottom: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        ← Back to All Experts
      </button>

      {/* Main Grid: Left Details & Right Booking Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 28 }}>
        {/* LEFT COLUMN: HERO & CREDENTIALS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Hero Card */}
          <Card style={{ padding: 32, borderRadius: 20 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={expert.avatar || expert.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.name}`}
                  alt={expert.name}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `4px solid #E8F5E9`,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: isOnline ? '#22C55E' : '#94A3B8',
                    border: '3px solid #fff',
                  }}
                  title={isOnline ? 'Online' : 'Offline'}
                />
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: COLORS.text }}>
                    {expert.name}
                  </h1>
                  {expert.isVerified && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <Icon name="badgeCheck" size={14} /> Verified Agronomist
                    </span>
                  )}
                </div>

                <p style={{ margin: '0 0 16px', color: COLORS.textMuted, fontSize: 14, fontWeight: 600 }}>
                  📍 {expert.city ? `${expert.city}, ${expert.state || 'India'}` : 'Agricultural Advisory Board'} • {expert.role?.toUpperCase()}
                </p>

                {/* Stat Badges */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ background: '#F8FAFC', padding: '8px 14px', borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>EXPERIENCE</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.text }}>
                      {expert.experienceYears || expert.yearsExperience || 10}+ Years
                    </div>
                  </div>

                  <div style={{ background: '#FFFBEB', padding: '8px 14px', borderRadius: 12, border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: 11, color: '#B45309', fontWeight: 700 }}>RATING</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#92400E', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ★ {expert.rating || 4.9} <span style={{ fontSize: 12, fontWeight: 600, color: '#B45309' }}>({expert.reviewsCount || reviews.length || 24})</span>
                    </div>
                  </div>

                  <div style={{ background: '#F0FDF4', padding: '8px 14px', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>CONSULTATIONS</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#15803D' }}>
                      {expert.totalConsultations || 120}+ Solved
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialization Tags */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                Fields of Agronomic Expertise
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {specializations.map((spec, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#E8F5E9',
                      color: '#1B5E20',
                      padding: '6px 14px',
                      borderRadius: 16,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    🌾 {spec}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* About / Bio Card */}
          <Card style={{ padding: 28 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: COLORS.text }}>
              About the Specialist
            </h2>
            <p style={{ margin: 0, color: COLORS.text, fontSize: 15, lineHeight: 1.7, opacity: 0.9 }}>
              {expert.bio || 'Experienced agronomy specialist dedicated to boosting farm productivity through scientific soil testing, integrated pest management, and custom fertilizer schedules.'}
            </p>

            <div style={{ marginTop: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>Languages Spoken:</span>
              {languages.map((lang, idx) => (
                <span key={idx} style={{ background: '#F1F5F9', color: '#334155', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  🗣️ {lang}
                </span>
              ))}
            </div>
          </Card>

          {/* Education & Qualifications */}
          <Card style={{ padding: 28 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="badgeCheck" size={20} color={COLORS.primary} /> Educational Credentials & Certifications
            </h2>
            {qualifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {qualifications.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 18 }}>🎓</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{q}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>
                Recognized Agricultural University Degree & ICAR / State Agriculture Board Accreditation.
              </p>
            )}
          </Card>

          {/* Farmer Reviews */}
          <Card style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                Verified Farmer Reviews ({reviews.length})
              </h2>
              <span style={{ color: '#D97706', fontWeight: 800, fontSize: 14 }}>
                ★ {expert.rating || 4.9} / 5.0
              </span>
            </div>

            {reviews.length === 0 ? (
              <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>
                No public reviews submitted yet. Book a session to be the first!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map((rev, idx) => (
                  <div key={idx} style={{ padding: 16, borderRadius: 14, background: '#F8FAFC', border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: COLORS.text }}>
                        🚜 {rev.farmerName || 'Farmer'}
                      </span>
                      <span style={{ color: '#D97706', fontWeight: 800, fontSize: 13 }}>
                        {'★'.repeat(rev.rating || 5)}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: 14, color: COLORS.text, lineHeight: 1.5 }}>
                      "{rev.comment}"
                    </p>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>
                      {new Date(rev.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: BOOKING CARD */}
        <div>
          <div style={{ position: 'sticky', top: 90 }}>
            <Card style={{ padding: 28, borderRadius: 20, boxShadow: '0 12px 35px rgba(0,0,0,0.08)' }}>
              <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase' }}>
                  CONSULTATION FEE
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: '#1B5E20' }}>
                    ₹{expert.consultationFee || 99}
                  </span>
                  <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 600 }}>
                    / complete session
                  </span>
                </div>
              </div>

              {/* Inclusions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                  <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span> 1-on-1 Dedicated Consultation Room
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                  <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span> Photo Upload & Symptom Analysis
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                  <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span> Chemical & Organic Dosage Plan
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                  <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span> Official Razorpay Invoice Receipt
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(27, 94, 32, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Icon name="phone" size={18} />
                Book Consultation — ₹{expert.consultationFee || 99}
              </button>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>
                🔒 Secured by Razorpay • Instant Confirmation
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* STRUCTURED INTAKE BOOKING MODAL */}
      {showBookingModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 540,
              width: '100%',
              padding: 28,
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: COLORS.text }}>
                  Consultation Intake
                </h3>
                <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 13 }}>
                  Booking session with <strong>{expert.name}</strong> (₹{expert.consultationFee})
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: COLORS.textMuted }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Target Crop
                </label>
                <input
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder="e.g. Wheat, Paddy, Tomato, Cotton, Sugarcane"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Problem Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14 }}
                >
                  <option value="Pest Infestation">Pest Infestation (Aphids, Caterpillars, Borers)</option>
                  <option value="Crop Disease & Blight">Crop Disease & Blight (Yellowing, Spotting, Mildew)</option>
                  <option value="Soil Deficiency & Nutrients">Soil Deficiency & Nutrients (NPK, Zinc, pH)</option>
                  <option value="Irrigation & Water Management">Irrigation & Water Management</option>
                  <option value="Organic Farming Practices">Organic / Bio-fertilizer Advisory</option>
                  <option value="General Advisory">General Farm & Yield Advisory</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Detailed Description of Issue
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe leaf symptoms, crop age, recent chemical sprays, or soil conditions..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Preferred Slot / Availability
                </label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14 }}
                >
                  <option value="Immediate (Online Consultation)">Immediate 1-on-1 Consultation</option>
                  <option value="Today, 4:00 PM - 5:00 PM">Today, 4:00 PM - 5:00 PM</option>
                  <option value="Today, 6:00 PM - 7:00 PM">Today, 6:00 PM - 7:00 PM</option>
                  <option value="Tomorrow, 10:00 AM - 11:00 AM">Tomorrow, 10:00 AM - 11:00 AM</option>
                </select>
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Attach Affected Crop / Leaf Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ fontSize: 13 }}
                />
                {imagePreview && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={imagePreview}
                      alt="Crop Preview"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    background: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: COLORS.primary,
                    color: '#fff',
                    fontWeight: 800,
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bookingLoading ? 'Launching Razorpay...' : `Pay ₹${expert.consultationFee || 99} & Open Session`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
