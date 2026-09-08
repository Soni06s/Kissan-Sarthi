import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import EmptyState from '../components/common/EmptyState';
import { marketplaceAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { openRazorpayCheckout } from '../utils/razorpay';

const CATEGORIES = [
  'All',
  'Cereals & Grains',
  'Pulses & Legumes',
  'Vegetables',
  'Fruits',
  'Oilseeds',
  'Spices & Commercial',
];

export default function MarketplacePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-listings'
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boostingListingId, setBoostingListingId] = useState(null);
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [revealedContacts, setRevealedContacts] = useState({}); // { [listingId]: phone }
  const [contactLoading, setContactLoading] = useState({});

  // Create Listing Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cropName: '',
    category: 'Cereals & Grains',
    quantity: '',
    unit: 'quintal',
    pricePerUnit: '',
    location: user?.location || '',
    state: user?.state || '',
    district: user?.district || '',
    harvestDate: new Date().toISOString().split('T')[0],
    description: '',
    contactNumber: user?.phone || '',
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Fetch all public listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {
        status: 'active',
      };
      if (searchCrop.trim()) params.crop = searchCrop.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLocation.trim()) params.location = selectedLocation.trim();

      const res = await marketplaceAPI.getListings(params);
      if (res.data?.success) {
        setListings(res.data.data?.listings || []);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace listings:', err);
      toast.error('Unable to load produce listings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch seller's own listings
  const fetchMyListings = async () => {
    try {
      const res = await marketplaceAPI.getMyListings();
      if (res.data?.success) {
        setMyListings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch my listings:', err);
    }
  };

  useEffect(() => {
    fetchListings();
    if (user) {
      fetchMyListings();
    }
  }, [selectedCategory, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  // Reveal Contact Number
  const handleRevealContact = async (listingId) => {
    try {
      setContactLoading((prev) => ({ ...prev, [listingId]: true }));
      const res = await marketplaceAPI.revealContact(listingId);
      if (res.data?.success) {
        const phone = res.data.data?.contactNumber;
        setRevealedContacts((prev) => ({ ...prev, [listingId]: phone }));
        toast.success('Seller contact number revealed!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reveal contact');
    } finally {
      setContactLoading((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  // Update listing status (e.g. Mark as Sold)
  const handleStatusUpdate = async (listingId, newStatus) => {
    try {
      const res = await marketplaceAPI.updateListing(listingId, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Listing updated to ${newStatus}`);
        fetchMyListings();
        fetchListings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update listing');
    }
  };

  // Boost listing for 3 days (Priority placement)
  const handleBoostListing = async (listingId, cropName) => {
    try {
      setBoostingListingId(listingId);
      const orderRes = await paymentAPI.createOrder({
        purpose: 'priority_listing',
        amount: 20,
        currency: 'INR',
        relatedId: listingId,
        metadata: { cropName },
      });

      const { orderId, keyId, amount: amountPaise, currency } = orderRes.data.data;

      await openRazorpayCheckout({
        keyId,
        orderId,
        amount: amountPaise,
        currency,
        name: 'Kissan Marketplace Boost',
        description: `Priority placement for ${cropName} (₹20 for 3 days)`,
        prefill: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        onSuccess: async (rzpResponse) => {
          try {
            toast.loading('Verifying priority boost payment...', { id: 'boost-verify' });
            await paymentAPI.verifyPayment({
              razorpayOrderId: rzpResponse.razorpayOrderId,
              razorpayPaymentId: rzpResponse.razorpayPaymentId,
              razorpaySignature: rzpResponse.razorpaySignature,
            });
            toast.success(`⭐ "${cropName}" is now boosted to the top!`, { id: 'boost-verify' });
            fetchMyListings();
            fetchListings();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to verify boost on server', { id: 'boost-verify' });
          } finally {
            setBoostingListingId(null);
          }
        },
        onError: (err) => {
          toast.error(err?.description || err?.message || 'Boost payment was cancelled');
          setBoostingListingId(null);
        },
        onDismiss: () => {
          setBoostingListingId(null);
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize boost payment');
      setBoostingListingId(null);
    }
  };

  // Image selection handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 3) {
      toast.error('You can upload a maximum of 3 produce photos');
      return;
    }

    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB size limit`);
        return false;
      }
      return true;
    });

    const newImages = [...selectedImages, ...validFiles].slice(0, 3);
    setSelectedImages(newImages);

    // Generate preview URLs
    const previews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImgs = [...selectedImages];
    newImgs.splice(index, 1);
    setSelectedImages(newImgs);

    const newPrev = [...imagePreviews];
    newPrev.splice(index, 1);
    setImagePreviews(newPrev);
  };

  // Submit new produce listing
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cropName || !formData.quantity || !formData.pricePerUnit || !formData.contactNumber) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      selectedImages.forEach((img) => {
        data.append('images', img);
      });

      const res = await marketplaceAPI.createListing(data);
      if (res.data?.success) {
        toast.success('Produce listed successfully for buyers!');
        setShowCreateModal(false);
        // Reset form
        setFormData({
          cropName: '',
          category: 'Cereals & Grains',
          quantity: '',
          unit: 'quintal',
          pricePerUnit: '',
          location: user?.location || '',
          state: user?.state || '',
          district: user?.district || '',
          harvestDate: new Date().toISOString().split('T')[0],
          description: '',
          contactNumber: user?.phone || '',
        });
        setSelectedImages([]);
        setImagePreviews([]);
        fetchListings();
        fetchMyListings();
        setActiveTab('my-listings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating produce listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
          borderRadius: 20,
          padding: '32px 28px',
          color: '#fff',
          boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            <Icon name="cart" size={16} /> Direct Farmer-to-Buyer Marketplace
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Kissan Produce Exchange
          </h1>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 15, maxWidth: 620, lineHeight: 1.5 }}>
            Sell directly to institutional buyers and traders without middleman commission. Compare your price against real-time APMC Mandi rates to secure fair farm profits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FDD835',
              color: '#1B5E20',
              border: 'none',
              padding: '14px 22px',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(253, 216, 53, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            <Icon name="plus" size={18} /> + List Your Produce
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E0E0E0', paddingBottom: 14, marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'browse' ? COLORS.primary : 'transparent',
                color: activeTab === 'browse' ? '#fff' : COLORS.text,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Browse Produce ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('my-listings')}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'my-listings' ? COLORS.primary : 'transparent',
                color: activeTab === 'my-listings' ? '#fff' : COLORS.text,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              My Listings ({myListings.length})
            </button>
          </div>

          <div style={{ fontSize: 13, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={15} /> All listings stay active for 15 days before auto-archiving
          </div>
        </div>

        {activeTab === 'browse' && (
          <div>
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: '1 1 250px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search produce (e.g. Wheat, Basmati, Tomato)..."
                  value={searchCrop}
                  onChange={(e) => setSearchCrop(e.target.value)}
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

              <div style={{ flex: '1 1 200px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Filter by location / district..."
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: COLORS.primary,
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Apply Filters
              </button>
            </form>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
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
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, color: COLORS.textMuted, fontWeight: 600 }}>Fetching fresh farm produce listings...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : activeTab === 'browse' ? (
        listings.length === 0 ? (
          <EmptyState
            type="market"
            title="No Produce Listings Found"
            subtitle="Be the first farmer to list your fresh harvest directly to verified buyers, or try selecting a different category."
            hint="Instant buyer discovery • Real-time Mandi price comparison"
            actionLabel="+ Create First Listing"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {listings.map((item) => {
              const isSeller = user && (user._id === item.sellerId?._id || user._id === item.sellerId);
              const isRevealed = revealedContacts[item._id] || (isSeller && item.contactNumber);
              const isVerifiedSeller = item.sellerId?.verificationStatus === 'verified';
              const imgUrl = item.images?.[0] || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80';

              return (
                <div
                  key={item._id}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                    border: '1px solid #E8F5E9',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(46, 125, 50, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Photo & Badge */}
                  <div style={{ position: 'relative', height: 190, background: '#ECEFF1' }}>
                    <img
                      src={imgUrl}
                      alt={item.cropName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.isBoosted && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
                          color: '#3E2723',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          boxShadow: '0 2px 8px rgba(255, 179, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          ⭐ Featured
                        </div>
                      )}
                      <div style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                        {item.category}
                      </div>
                    </div>
                    {item.images?.length > 1 && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                        📷 {item.images.length} Photos
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Title & Quantity */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: COLORS.text }}>
                        {item.cropName}
                      </h3>
                      <span style={{ background: '#E8F5E9', color: COLORS.primaryDark, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>

                    {/* Price in big font */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 12px' }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: COLORS.primaryDark }}>
                        ₹{item.pricePerUnit.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 600 }}>
                        per {item.unit}
                      </span>
                    </div>

                    {/* Mandi Benchmark comparison banner */}
                    {item.mandiBenchmark ? (
                      <div
                        style={{
                          background: item.mandiBenchmark.diffFromMandi <= 0 ? '#E8F5E9' : '#FFF8E1',
                          border: `1px solid ${item.mandiBenchmark.diffFromMandi <= 0 ? '#C8E6C9' : '#FFE082'}`,
                          borderRadius: 10,
                          padding: '8px 12px',
                          fontSize: 12,
                          marginBottom: 14,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: item.mandiBenchmark.diffFromMandi <= 0 ? '#1B5E20' : '#E65100', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="market" size={14} />
                          {item.mandiBenchmark.diffFromMandi <= 0
                            ? `₹${Math.abs(item.mandiBenchmark.diffFromMandi)} below APMC Mandi modal price`
                            : `₹${item.mandiBenchmark.diffFromMandi} above Mandi benchmark (High Grade/Cleaned)`}
                        </div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                          {item.mandiBenchmark.mandiMarket}: ₹{item.mandiBenchmark.modalPrice}/{item.unit}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#F5F5F5', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#777', marginBottom: 14 }}>
                        ⚖️ Direct farm gate price • No mandi commission
                      </div>
                    )}

                    {/* Description excerpt */}
                    {item.description && (
                      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#546E7A', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ borderTop: '1px solid #ECEFF1', paddingTop: 12, marginTop: 'auto' }}>
                      {/* Seller info & Verification badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8E6C9', color: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                            {item.sellerId?.name?.[0]?.toUpperCase() || 'F'}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {item.sellerId?.name || 'Farmer Seller'}
                              {isVerifiedSeller && (
                                <span title="Verified Farmer (Land/KCC Verified)" style={{ display: 'inline-flex', color: '#2E7D32' }}>
                                  <Icon name="badgeCheck" size={15} />
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                              📍 {item.location || item.district || 'India'}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: 11, color: '#90A4AE' }}>
                          👁️ {item.views || 0} views
                        </div>
                      </div>

                      {/* Contact Reveal / Call button */}
                      {isRevealed ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a
                            href={`tel:${isRevealed}`}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              background: '#1B5E20',
                              color: '#fff',
                              textDecoration: 'none',
                              padding: '10px 14px',
                              borderRadius: 10,
                              fontSize: 14,
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          >
                            <Icon name="phone" size={16} /> Call {isRevealed}
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRevealContact(item._id)}
                          disabled={contactLoading[item._id]}
                          style={{
                            width: '100%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            background: COLORS.primary,
                            color: '#fff',
                            border: 'none',
                            padding: '10px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                        >
                          <Icon name="phone" size={15} />
                          {contactLoading[item._id] ? 'Connecting...' : 'Contact Seller (Direct Call)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* My Listings Tab */
        <div>
          {myListings.length === 0 ? (
            <EmptyState
              type="market"
              title="You Have No Active Produce Listings"
              subtitle="List your harvested crops, set your expected price per quintal, and get direct calls from wholesale buyers."
              hint="Zero platform commission • 100% direct farmer payout"
              actionLabel="+ List Produce Now"
              onAction={() => setShowCreateModal(true)}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {myListings.map((item) => (
                <div key={item._id} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{item.cropName}</h4>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        background: item.status === 'active' ? '#E8F5E9' : item.status === 'sold' ? '#E3F2FD' : '#FFEBEE',
                        color: item.status === 'active' ? '#2E7D32' : item.status === 'sold' ? '#1565C0' : '#C62828',
                      }}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 6 }}>
                    Quantity: <strong>{item.quantity} {item.unit}</strong>
                  </div>
                  <div style={{ fontSize: 15, color: COLORS.primaryDark, fontWeight: 800, marginBottom: 12 }}>
                    ₹{item.pricePerUnit} / {item.unit}
                  </div>
                  <div style={{ fontSize: 12, color: '#78909C', marginBottom: 14 }}>
                    👁️ {item.views || 0} interested buyer views • Phone: {item.contactNumber}
                  </div>

                  {item.isBoosted && (
                    <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#E65100', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⭐ Boosted (Featured Priority until {item.boostedUntil ? new Date(item.boostedUntil).toLocaleDateString() : 'Active'})
                    </div>
                  )}

                  {item.status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        onClick={() => handleBoostListing(item._id, item.cropName)}
                        disabled={boostingListingId === item._id}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #FFB300',
                          background: item.isBoosted ? '#FFF8E1' : 'linear-gradient(135deg, #FFB300 0%, #FFA000 100%)',
                          color: item.isBoosted ? '#E65100' : '#3E2723',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: item.isBoosted ? 'none' : '0 2px 8px rgba(255, 179, 0, 0.3)',
                        }}
                      >
                        {boostingListingId === item._id
                          ? 'Connecting Razorpay...'
                          : item.isBoosted
                          ? '⚡ Extend Boost (₹20 for 3 days)'
                          : '🚀 Boost Listing — ₹20 for 3 days'}
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(item._id, 'sold')}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #4CAF50',
                          background: '#E8F5E9',
                          color: '#2E7D32',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        ✅ Mark as Sold
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Produce Listing */}
      {showCreateModal && (
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
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #ECEFF1', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.primaryDark }}>
                🌾 List Produce for Direct Sale
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#90A4AE' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Crop / Commodity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharbati Wheat, Basmati Rice"
                    value={formData.cropName}
                    onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Quantity Available *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  >
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ton">Ton (1000 kg)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Expected Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="₹ per unit"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Farm Location / Tehsil *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bikaner, Mandore"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                    Direct Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Produce Photos (up to 3) */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                  Produce Photos (Max 3, Cloudinary Auto-Optimized)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={selectedImages.length >= 3}
                  style={{ fontSize: 13, marginBottom: 8 }}
                />

                {imagePreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {imagePreviews.map((prev, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 75, height: 75, borderRadius: 8, overflow: 'hidden', border: '1px solid #CFD8DC' }}>
                        <img src={prev} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            fontSize: 10,
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>
                  Produce Quality / Additional Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Harvested 3 days ago, sun-dried, moisture < 11%, sorted and bagged in 50kg sacks."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #CFD8DC', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: COLORS.primary,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                  }}
                >
                  {submitting ? 'Publishing Listing...' : 'Publish Produce Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
