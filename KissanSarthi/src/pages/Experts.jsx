import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { Card } from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { consultationAPI, paymentAPI } from '../services/api';
import { openRazorpayCheckout } from '../utils/razorpay';
import { useSocket } from '../hooks/useSocket';

export default function ExpertsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'consultations' ? 'consultations' : 'browse');
  const [experts, setExperts] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1-on-1 Chat Session State
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  // Resolution & Rating State
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Booking Intake Modal State
  const [bookingExpert, setBookingExpert] = useState(null);
  const [intakeCrop, setIntakeCrop] = useState('Wheat');
  const [intakeCategory, setIntakeCategory] = useState('Pest Infestation');
  const [intakeDescription, setIntakeDescription] = useState('');
  const [intakeSlot, setIntakeSlot] = useState('Immediate (Online Consultation)');
  const [bookingLoading, setBookingLoading] = useState(false);

  const { socket } = useSocket();
  const isExpert = user?.role === 'expert' || user?.role === 'admin';

  // Fetch experts & consultations
  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, myConsRes] = await Promise.allSettled([
        consultationAPI.getExperts(),
        isAuthenticated ? consultationAPI.getMyConsultations() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (expRes.status === 'fulfilled' && expRes.value.data?.data) {
        setExperts(expRes.value.data.data);
      }
      if (myConsRes.status === 'fulfilled' && myConsRes.value.data?.data) {
        const consList = myConsRes.value.data.data || [];
        setConsultations(consList);

        // Check if query param requests opening a specific consultation
        const openId = searchParams.get('open');
        if (openId) {
          const match = consList.find((c) => String(c._id) === openId);
          if (match) {
            handleOpenConsultation(match);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load expert data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // Handle Socket.IO realtime events
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages in active consultation room
    const handleIncomingMessage = (data) => {
      if (activeConsultation && String(data.consultationId) === String(activeConsultation._id)) {
        setChatMessages((prev) => [...prev, data.message]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💬</span>
            <span>New message from {data.message?.senderName || 'Agronomist'}</span>
          </div>
        ));
      }
    };

    const handleConsultationResolved = (data) => {
      if (activeConsultation && String(data.consultationId) === String(activeConsultation._id)) {
        setActiveConsultation((prev) => ({ ...prev, status: 'resolved', resolvedAt: data.resolvedAt }));
        toast.success('This consultation was marked resolved by the agronomist!');
      }
      fetchData();
    };

    const handleNewConsultation = (data) => {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👨‍🌾</span>
          <span>New consultation booked: {data.crop || 'Crop Advisory'}</span>
        </div>
      ));
      fetchData();
    };

    socket.on('consultation_message', handleIncomingMessage);
    socket.on('consultation_resolved', handleConsultationResolved);
    socket.on('consultation_new', handleNewConsultation);

    return () => {
      socket.off('consultation_message', handleIncomingMessage);
      socket.off('consultation_resolved', handleConsultationResolved);
      socket.off('consultation_new', handleNewConsultation);
    };
  }, [socket, activeConsultation]);

  // Scroll chat to bottom on load
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleOpenConsultation = async (cons) => {
    try {
      setActiveConsultation(cons);
      setChatMessages(cons.messages || []);
      // Join socket room
      if (socket) {
        socket.emit('join_consultation', { consultationId: cons._id });
      }
      // Refresh fresh consultation details
      const res = await consultationAPI.getById(cons._id);
      if (res.data?.data) {
        setActiveConsultation(res.data.data);
        setChatMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.warn('Failed to load consultation thread:', err);
    }
  };

  const handleCloseChat = () => {
    if (socket && activeConsultation) {
      socket.emit('leave_consultation', { consultationId: activeConsultation._id });
    }
    setActiveConsultation(null);
    setChatMessages([]);
  };

  // Send message in 1-on-1 chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConsultation) return;

    setSendingMessage(true);
    const textToSend = inputMessage.trim();
    setInputMessage('');

    try {
      const res = await consultationAPI.sendMessage(activeConsultation._id, {
        text: textToSend,
      });

      if (res.data?.data) {
        setChatMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      toast.error('Failed to deliver message');
      setInputMessage(textToSend);
    } finally {
      setSendingMessage(false);
    }
  };

  // Mark resolved (by expert)
  const handleResolveConsultation = async () => {
    if (!activeConsultation) return;
    try {
      await consultationAPI.resolve(activeConsultation._id);
      toast.success('Consultation marked resolved!');
      setActiveConsultation((prev) => ({ ...prev, status: 'resolved' }));
      fetchData();
    } catch (err) {
      toast.error('Could not mark consultation resolved');
    }
  };

  // Farmer rates the consultation
  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!activeConsultation) return;

    setSubmittingRating(true);
    try {
      await consultationAPI.rate(activeConsultation._id, {
        rating: ratingVal,
        review: reviewComment.trim(),
      });
      toast.success('Thank you for rating your consultation! ⭐');
      setActiveConsultation((prev) => ({
        ...prev,
        rating: ratingVal,
        review: reviewComment.trim(),
      }));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Intake Booking Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to book a consultation');
      navigate('/login?redirect=/experts');
      return;
    }

    if (!intakeDescription.trim()) {
      toast.error('Please describe your crop problem or query');
      return;
    }

    const expert = bookingExpert;
    setBookingLoading(true);
    const fee = expert.consultationFee || 99;

    try {
      const orderRes = await paymentAPI.createOrder({
        purpose: 'expert_consultation',
        amount: fee,
        currency: 'INR',
        relatedId: expert._id,
        metadata: {
          expertId: expert._id,
          crop: intakeCrop,
          problemCategory: intakeCategory,
          problemDescription: intakeDescription.trim(),
          scheduledSlot: intakeSlot,
        },
      });

      const { orderId, keyId, amount: amountPaise, currency } = orderRes.data.data;

      await openRazorpayCheckout({
        keyId,
        orderId,
        amount: amountPaise,
        currency,
        name: `Consultation with ${expert.name}`,
        description: `${intakeCategory} Advisory (${intakeCrop})`,
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

            toast.success('Consultation booked! Opening your 1-on-1 session room...', { id: 'verify-cons' });
            setBookingExpert(null);
            fetchData();

            const newConsId = verifyRes.data?.data?.fulfillment?.consultationId;
            setActiveTab('consultations');
            if (newConsId) {
              const res = await consultationAPI.getById(newConsId);
              if (res.data?.data) {
                handleOpenConsultation(res.data.data);
              }
            }
          } catch (err) {
            toast.error('Verification failed on server', { id: 'verify-cons' });
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
      toast.error('Failed to initialize booking');
      setBookingLoading(false);
    }
  };

  // Filter experts
  const filteredExperts = experts.filter((exp) => {
    const matchesSearch =
      exp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.expertise?.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.specializations?.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      exp.expertise?.includes(selectedSpecialty) ||
      exp.specializations?.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  const SPECIALTIES = [
    'All',
    'Soil Chemistry',
    'Plant Pathology',
    'Drip Irrigation',
    'Organic Farming',
    'Horticulture',
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
          borderRadius: 22,
          padding: '30px 32px',
          color: '#fff',
          boxShadow: '0 12px 30px rgba(27, 94, 32, 0.2)',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            🔬 Certified Agricultural Scientist Network
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: '-0.5px' }}>
            1-on-1 Agri-Expert Consultations
          </h1>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 15, maxWidth: 640, lineHeight: 1.5 }}>
            Connect directly with verified soil scientists, plant pathologists, and irrigation engineers. Get personalized treatment prescriptions, symptom analysis, and official Razorpay receipts.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', padding: 5, borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('browse'); handleCloseChat(); }}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'browse' ? '#fff' : 'transparent',
              color: activeTab === 'browse' ? '#1B5E20' : '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="users" size={16} /> Browse Experts ({experts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consultations')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'consultations' ? '#fff' : 'transparent',
              color: activeTab === 'consultations' ? '#1B5E20' : '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="messageSquare" size={16} /> {isExpert ? 'My Patient Queue' : 'My Consultations'} ({consultations.length})
          </button>
        </div>
      </div>

      {/* TAB 1: BROWSE EXPERTS */}
      {activeTab === 'browse' && (
        <>
          {/* Filters & Search Bar */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SPECIALTIES.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: selectedSpecialty === spec ? COLORS.primary : '#F1F5F9',
                    color: selectedSpecialty === spec ? '#fff' : COLORS.text,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {spec}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name or specialty..."
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Expert Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: COLORS.textMuted }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 1s linear infinite' }} />
              Loading certified agronomists...
            </div>
          ) : filteredExperts.length === 0 ? (
            <EmptyState
              type="expert"
              title="No Certified Agronomists Found"
              subtitle="No agronomists match your current search query or specialty filter."
              hint="Try clearing your search query or selecting 'All' specialties"
              actionLabel="Reset Filters"
              onAction={() => { setSelectedSpecialty('All'); setSearchQuery(''); }}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
              {filteredExperts.map((exp) => {
                const isOnline = exp.availability !== 'offline';
                const specs = exp.specializations?.length ? exp.specializations : exp.expertise || [];

                return (
                  <Card key={exp._id} style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'transform 0.2s', border: `1px solid ${COLORS.border}` }}>
                    <div>
                      {/* Avatar & Online status */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={exp.avatar || exp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.name}`}
                            alt={exp.name}
                            style={{
                              width: 68,
                              height: 68,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: `3px solid #E8F5E9`,
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: isOnline ? '#22C55E' : '#94A3B8',
                              border: '2px solid #fff',
                            }}
                            title={isOnline ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: COLORS.text }}>
                              {exp.name}
                            </h3>
                            {exp.isVerified && (
                              <span title="Verified Expert" style={{ color: '#16A34A', display: 'inline-flex' }}>
                                <Icon name="badgeCheck" size={16} />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, marginTop: 2 }}>
                            {exp.experienceYears || exp.yearsExperience || 8}+ Yrs Experience • {exp.city || 'Agri Board'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 13, fontWeight: 800, color: '#D97706' }}>
                            ★ {exp.rating || 4.9} <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>({exp.reviewsCount || 20} reviews)</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.text, lineHeight: 1.5, opacity: 0.85, height: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {exp.bio || 'Advising farmers on soil fertility restoration, micronutrient balance, and high-yield crop rotation.'}
                      </p>

                      {/* Specialization Tags */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                        {specs.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#E8F5E9',
                              color: '#1B5E20',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Fee & Action Buttons */}
                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>FEE</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#1B5E20' }}>
                          ₹{exp.consultationFee || 99}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/experts/${exp._id}`)}
                          style={{
                            padding: '9px 14px',
                            borderRadius: 10,
                            border: `1px solid ${COLORS.border}`,
                            background: '#fff',
                            color: COLORS.text,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingExpert(exp);
                          }}
                          style={{
                            padding: '9px 16px',
                            borderRadius: 10,
                            border: 'none',
                            background: COLORS.primary,
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(46, 125, 50, 0.25)',
                          }}
                        >
                          Book — ₹{exp.consultationFee || 99}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CONSULTATIONS & 1-ON-1 CHAT */}
      {activeTab === 'consultations' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeConsultation ? '340px 1fr' : '1fr', gap: 24, minHeight: 600 }}>
          {/* LEFT LIST: CONSULTATION SESSIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: COLORS.text }}>
              {isExpert ? 'Assigned Consultations' : 'Your Booked Sessions'}
            </h3>

            {consultations.length === 0 ? (
              <EmptyState
                type="expert"
                title="No Active Consultations"
                subtitle={isExpert ? 'Farmers booking consultations with you will appear here in real time.' : 'Browse our certified expert agronomists and book your first 1-on-1 consultation session.'}
                hint="Live WebSocket chat • Agronomist prescriptions • Razorpay verified"
                actionLabel={!isExpert ? "Browse Experts" : undefined}
                onAction={!isExpert ? () => setActiveTab('browse') : undefined}
              />
            ) : (
              consultations.map((cons) => {
                const otherParty = isExpert ? cons.farmerId : cons.expertId;
                const isSelected = activeConsultation && activeConsultation._id === cons._id;

                return (
                  <div
                    key={cons._id}
                    onClick={() => handleOpenConsultation(cons)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: isSelected ? '#E8F5E9' : '#fff',
                      border: isSelected ? '2px solid #2E7D32' : `1px solid ${COLORS.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: COLORS.text }}>
                        {otherParty?.name || (isExpert ? 'Farmer' : 'Agronomist')}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: cons.status === 'resolved' ? '#DCFCE7' : '#FEF3C7',
                          color: cons.status === 'resolved' ? '#15803D' : '#B45309',
                        }}
                      >
                        {cons.status?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
                      🌾 {cons.crop} • {cons.problemCategory || 'Advisory'}
                    </div>

                    <div style={{ fontSize: 11, color: COLORS.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{new Date(cons.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      <span>₹{cons.amount}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT VIEW: 1-ON-1 CHAT ROOM */}
          {activeConsultation ? (
            <Card style={{ display: 'flex', flexDirection: 'column', height: 680, borderRadius: 20, overflow: 'hidden', padding: 0 }}>
              {/* Chat Header */}
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={
                      (isExpert ? activeConsultation.farmerId?.avatar : activeConsultation.expertId?.avatar) ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=Session`
                    }
                    alt="Participant"
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.text }}>
                      {isExpert ? activeConsultation.farmerId?.name : activeConsultation.expertId?.name}
                    </h3>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      Target Crop: <strong>{activeConsultation.crop}</strong> • Slot: {activeConsultation.scheduledSlot}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isExpert && activeConsultation.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={handleResolveConsultation}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#16A34A',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Mark as Resolved
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseChat}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: COLORS.textMuted }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#FAFAFA' }}>
                {/* Farmer Intake Problem Card (Sticky at top of stream) */}
                <div style={{ padding: 16, background: '#E8F5E9', borderRadius: 16, border: '1px solid #C8E6C9' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 4 }}>
                    🚜 INITIAL CONSULTATION INTAKE
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2E7D32', marginBottom: 6 }}>
                    {activeConsultation.problemCategory || 'Crop Problem'} ({activeConsultation.crop})
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#1E3A1E', lineHeight: 1.5 }}>
                    {activeConsultation.problemDescription}
                  </p>
                  {activeConsultation.imageUrl && (
                    <div style={{ marginTop: 10 }}>
                      <img
                        src={activeConsultation.imageUrl}
                        alt="Crop Problem Leaf"
                        style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #A5D6A7' }}
                      />
                    </div>
                  )}
                </div>

                {/* Messages Bubbles */}
                {chatMessages.map((msg, index) => {
                  const isMe = String(msg.senderId) === String(user?._id) || (isExpert && msg.senderRole === 'expert') || (!isExpert && msg.senderRole === 'farmer');

                  return (
                    <div
                      key={msg._id || index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '12px 18px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? '#2E7D32' : '#fff',
                          color: isMe ? '#fff' : COLORS.text,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>
                          {msg.senderName || (msg.senderRole === 'expert' ? 'Agronomist' : 'Farmer')}
                        </div>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, padding: '0 4px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Resolution Feedback Card (Shown to Farmer when resolved) */}
              {!isExpert && activeConsultation.status === 'resolved' && !activeConsultation.rating && (
                <div style={{ padding: 18, background: '#FFFBEB', borderTop: '1px solid #FDE68A', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E', marginBottom: 6 }}>
                    ⭐ Rate Your Consultation with {activeConsultation.expertId?.name}
                  </div>
                  <form onSubmit={handleRateSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={ratingVal}
                      onChange={(e) => setRatingVal(Number(e.target.value))}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FCD34D', fontSize: 13, fontWeight: 700 }}
                    >
                      <option value={5}>★★★★★ (5 - Excellent)</option>
                      <option value={4}>★★★★☆ (4 - Very Helpful)</option>
                      <option value={3}>★★★☆☆ (3 - Satisfactory)</option>
                      <option value={2}>★★☆☆☆ (2 - Needs Detail)</option>
                      <option value={1}>★☆☆☆☆ (1 - Poor)</option>
                    </select>
                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share a short review of their agronomic advice..."
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FCD34D', fontSize: 13, width: 280 }}
                    />
                    <button
                      type="submit"
                      disabled={submittingRating}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                    >
                      {submittingRating ? 'Saving...' : 'Submit Rating'}
                    </button>
                  </form>
                </div>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} style={{ padding: '14px 20px', background: '#fff', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    activeConsultation.status === 'resolved'
                      ? 'Consultation is resolved. You can still message follow-up queries...'
                      : 'Type your message or diagnostic query...'
                  }
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 14,
                  }}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !inputMessage.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: COLORS.primary,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: sendingMessage || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                    opacity: sendingMessage || !inputMessage.trim() ? 0.6 : 1,
                  }}
                >
                  Send
                </button>
              </form>
            </Card>
          ) : (
            <Card style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600, color: COLORS.textMuted, flexDirection: 'column' }}>
              <div style={{ fontSize: 50, marginBottom: 12 }}>💬</div>
              <h3 style={{ margin: 0, fontWeight: 800, color: COLORS.text }}>Select a Consultation Room</h3>
              <p style={{ margin: '8px 0 0', fontSize: 14 }}>
                Choose a session from the left queue to enter the real-time 1-on-1 discussion thread.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* STRUCTURED INTAKE BOOKING MODAL */}
      {bookingExpert && (
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
                  Booking session with <strong>{bookingExpert.name}</strong> (₹{bookingExpert.consultationFee || 99})
                </p>
              </div>
              <button
                onClick={() => setBookingExpert(null)}
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
                  value={intakeCrop}
                  onChange={(e) => setIntakeCrop(e.target.value)}
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
                  value={intakeCategory}
                  onChange={(e) => setIntakeCategory(e.target.value)}
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
                  value={intakeDescription}
                  onChange={(e) => setIntakeDescription(e.target.value)}
                  placeholder="Describe leaf symptoms, crop age, recent chemical sprays, or soil conditions..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Preferred Consultation Slot
                </label>
                <select
                  value={intakeSlot}
                  onChange={(e) => setIntakeSlot(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14 }}
                >
                  <option value="Immediate (Online Consultation)">Immediate 1-on-1 Consultation</option>
                  <option value="Today, 4:00 PM - 5:00 PM">Today, 4:00 PM - 5:00 PM</option>
                  <option value="Today, 6:00 PM - 7:00 PM">Today, 6:00 PM - 7:00 PM</option>
                  <option value="Tomorrow, 10:00 AM - 11:00 AM">Tomorrow, 10:00 AM - 11:00 AM</option>
                </select>
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setBookingExpert(null)}
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
                  {bookingLoading ? 'Launching Razorpay...' : `Pay ₹${bookingExpert.consultationFee || 99} & Open Session`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
