import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import { openRazorpayCheckout } from '../utils/razorpay';
import { isProUser, getProExpiryDate } from '../utils/subscription';

export default function PricingPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  const isPro = isProUser(user);
  const proExpiresAt = getProExpiryDate(user);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Please login or register to subscribe to KissanSarthi Pro.');
      navigate('/login?redirect=/pricing');
      return;
    }

    const amount = billingCycle === 'yearly' ? 499 : 49;
    setLoading(true);

    try {
      // 1. Create order on backend
      const orderRes = await paymentAPI.createOrder({
        purpose: 'pro_subscription',
        amount,
        currency: 'INR',
        metadata: {
          billingCycle,
          plan: 'pro',
        },
      });

      const { orderId, keyId, amount: amountPaise, currency } = orderRes.data.data;

      // 2. Open Razorpay Checkout modal
      await openRazorpayCheckout({
        keyId,
        orderId,
        amount: amountPaise,
        currency,
        name: 'KissanSarthi Pro Membership',
        description: `${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Subscription (Test Mode)`,
        prefill: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        onSuccess: async (rzpResponse) => {
          try {
            toast.loading('Verifying secure payment on server...', { id: 'rzp-verify' });

            // 3. Server-side signature verification
            const verifyRes = await paymentAPI.verifyPayment({
              razorpayOrderId: rzpResponse.razorpayOrderId,
              razorpayPaymentId: rzpResponse.razorpayPaymentId,
              razorpaySignature: rzpResponse.razorpaySignature,
            });

            // 4. Update auth state across the whole app
            const refreshed = await refreshUser();
            setPaymentSuccessData(verifyRes.data?.data);

            if (isProUser(refreshed) || verifyRes.data?.data?.fulfillment?.plan === 'pro') {
              toast.success("You're now a Pro member! 🎉 Unlimited agricultural advisory unlocked.", { id: 'rzp-verify', duration: 5000 });
            } else {
              toast.success('Payment verified! Welcome to KissanSarthi Pro 💎', { id: 'rzp-verify' });
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            toast.error(
              verifyErr.response?.data?.message || 'Payment verification failed on server.',
              { id: 'rzp-verify' }
            );
          } finally {
            setLoading(false);
          }
        },
        onError: (err) => {
          console.error('Payment failed or cancelled:', err);
          toast.error(err?.description || err?.message || 'Payment was not completed.');
          setLoading(false);
        },
        onDismiss: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize payment gateway.');
      setLoading(false);
    }
  };

  // Feature item component with SVG icon
  const FeatureItem = ({ included, text, highlight = false }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: included ? '#E8F5E9' : '#F5F5F5',
          color: included ? '#2E7D32' : '#9E9E9E',
        }}
      >
        {included ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <span
        style={{
          fontSize: 14,
          color: included ? (highlight ? '#1B5E20' : '#263238') : '#90A4AE',
          fontWeight: highlight ? 700 : included ? 500 : 400,
          textDecoration: included ? 'none' : 'line-through',
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </div>
  );

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 24,
            background: '#E8F5E9',
            border: '1px solid #A5D6A7',
            color: '#1B5E20',
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 16,
          }}
        >
          <span>💎</span> Razorpay Test Mode Active • Zero Real Money Moved
        </div>

        <h1 style={{ margin: '0 0 10px', fontSize: 36, fontWeight: 900, color: COLORS.text, fontFamily: 'Georgia, serif' }}>
          Affordable, Farmer-Friendly <span style={{ color: COLORS.primary }}>Plans</span>
        </h1>
        <p style={{ margin: '0 auto', color: COLORS.textMuted, fontSize: 16, maxWidth: 640, lineHeight: 1.5 }}>
          Empower your harvest with advanced AI crop recommendations, certified expert agronomist consultations, direct produce trading, and real-time mandi alerts.
        </p>

        {/* Current Pro Status Badge if Active */}
        {isPro && (
          <div
            style={{
              marginTop: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              background: '#FFFDE7',
              border: '1.5px solid #FBC02D',
              padding: '12px 24px',
              borderRadius: 16,
              boxShadow: '0 4px 14px rgba(251, 192, 45, 0.2)',
            }}
          >
            <span style={{ fontSize: 24 }}>👑</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, color: '#F57F17', fontSize: 14 }}>
                You are currently an active KissanSarthi Pro Member!
              </div>
              <div style={{ fontSize: 12, color: '#757575' }}>
                Subscription active until <strong>{proExpiresAt || 'Active'}</strong>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile?tab=payments')}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.primaryDark,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginLeft: 10,
              }}
            >
              View Invoices &rarr;
            </button>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: billingCycle === 'monthly' ? 800 : 500, color: billingCycle === 'monthly' ? COLORS.text : COLORS.textMuted }}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))}
            style={{
              width: 54,
              height: 28,
              borderRadius: 14,
              background: billingCycle === 'yearly' ? COLORS.primary : '#CFD8DC',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.25s',
            }}
            aria-label="Toggle billing cycle"
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: '#fff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transform: billingCycle === 'yearly' ? 'translateX(26px)' : 'translateX(0px)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </button>
          <span style={{ fontSize: 14, fontWeight: billingCycle === 'yearly' ? 800 : 500, color: billingCycle === 'yearly' ? COLORS.text : COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
            Yearly
            <span
              style={{
                background: '#FEF08A',
                color: '#854D0E',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 10,
                border: '1px solid #FDE047',
              }}
            >
              Save 15% (2 Months Free)
            </span>
          </span>
        </div>
      </div>

      {/* Two Side-by-Side Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'stretch',
          marginBottom: 32,
        }}
      >
        {/* Free Plan Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 24,
            padding: 32,
            border: '1.5px solid #E0E0E0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.text }}>Free Baseline</h3>
              <span style={{ background: '#F5F5F5', color: '#616161', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                Standard
              </span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: COLORS.textMuted, lineHeight: 1.4 }}>
              Essential agricultural information tools for every farmer starting out.
            </p>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #EEEEEE' }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: COLORS.text }}>₹0</span>
              <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 600 }}>/ forever</span>
            </div>

            {/* Features */}
            <div>
              <FeatureItem included={true} text="Live Soil & IoT Sensor Telemetry" />
              <FeatureItem included={true} text="5 Crop Recommendations / month" />
              <FeatureItem included={true} text="Real-time APMC Mandi Price Trends" />
              <FeatureItem included={true} text="5-Day Weather & Spray Forecasts" />
              <FeatureItem included={true} text="Farmer Community & Discussion Forum" />
              <FeatureItem included={false} text="Unlimited Crop Rotation Recommendations" />
              <FeatureItem included={false} text="Priority KissanBot AI Responses" />
              <FeatureItem included={false} text="Verified PRO Member Gold Badge" />
              <FeatureItem included={false} text="Real-time Mandi Surge WhatsApp Alerts" />
            </div>
          </div>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #EEEEEE' }}>
            <button
              disabled={!isPro}
              onClick={() => toast('You are on the baseline free plan.')}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 14,
                border: '1.5px solid #B0BEC5',
                background: !isPro ? '#ECEFF1' : '#fff',
                color: !isPro ? '#546E7A' : COLORS.text,
                fontWeight: 800,
                fontSize: 14,
                cursor: !isPro ? 'default' : 'pointer',
              }}
            >
              {!isPro ? '✓ Current Baseline Plan' : 'Switch to Free Tier'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#90A4AE' }}>
              No credit card or payment required
            </div>
          </div>
        </div>

        {/* Pro Plan Card (Highlighted) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F8E9 100%)',
            borderRadius: 24,
            padding: 32,
            border: '2.5px solid #2E7D32',
            boxShadow: '0 12px 36px rgba(46, 125, 50, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Recommended Badge Ribbon */}
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
              color: '#fff',
              padding: '4px 18px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 12px rgba(27, 94, 32, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>★</span> Recommended For High Yield <span>★</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: COLORS.text }}>KissanSarthi Pro</h3>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                  }}
                >
                  PRO
                </span>
              </div>
              <span style={{ background: '#E8F5E9', color: '#1B5E20', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                Demo Safe
              </span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#37474F', lineHeight: 1.4 }}>
              Unlimited AI diagnoses, instant answers, boosted produce sales, and direct expert agronomist access.
            </p>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #C8E6C9' }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#1B5E20' }}>
                ₹{billingCycle === 'yearly' ? '499' : '49'}
              </span>
              <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 700 }}>
                / {billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
              {billingCycle === 'yearly' && (
                <span style={{ fontSize: 13, color: '#9E9E9E', textDecoration: 'line-through', marginLeft: 4 }}>
                  ₹588
                </span>
              )}
            </div>

            {/* Features */}
            <div>
              <FeatureItem included={true} text="Unlimited AI Crop & Soil Recommendations" highlight={true} />
              <FeatureItem included={true} text="Zero Marketplace Selling Commission" highlight={true} />
              <FeatureItem included={true} text="Priority KissanBot Responses (Instant Queue)" />
              <FeatureItem included={true} text="Gold PRO Member Badge on Posts & Profile" highlight={true} />
              <FeatureItem included={true} text="Real-time Mandi Price Surge SMS & Alerts" />
              <FeatureItem included={true} text="Discounted Expert 1-on-1 Consultations" />
              <FeatureItem included={true} text="Instant Downloadable GST/Tax Payment Invoices" />
              <FeatureItem included={true} text="100% Ad-Free Clean Farmer Experience" />
            </div>
          </div>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #C8E6C9' }}>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #43A047 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(46, 125, 50, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Connecting to Razorpay...</span>
                </>
              ) : isPro ? (
                <>
                  <span>Extend Pro Membership</span>
                  <span>&rarr;</span>
                </>
              ) : (
                <>
                  <span>Subscribe with Razorpay — ₹{billingCycle === 'yearly' ? '499' : '49'}</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>

            {/* Subtle Trust Row */}
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#546E7A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>🔒 256-Bit SSL Encryption</span>
              <span>•</span>
              <span>Server-side HMAC-SHA256</span>
              <span>•</span>
              <span>Powered by Razorpay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Examiner / Viva Test Mode Section */}
      <details
        style={{
          background: '#FFF8E1',
          border: '1px solid #FFE082',
          borderRadius: 16,
          padding: '16px 20px',
          color: '#5D4037',
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        <summary
          style={{
            fontWeight: 800,
            fontSize: 14,
            color: '#E65100',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            userSelect: 'none',
          }}
        >
          <span>💡</span>
          <span>For Examiner: Test Payment & Viva Demo Instructions (Click to expand)</span>
        </summary>

        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: '#4E342E' }}>
          <p style={{ margin: '0 0 10px' }}>
            This system runs Razorpay in <strong>Test Mode</strong>. The secret key sits exclusively in <code>backend/.env</code> and never leaks to the browser.
            For live examination demonstration, use Razorpay's official sandbox test credentials:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginTop: 10,
            }}
          >
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #FFE082' }}>
              <div style={{ fontSize: 11, color: '#8D6E63', fontWeight: 600 }}>Test Card Number</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#1B5E20' }}>
                4111 1111 1111 1111
              </div>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #FFE082' }}>
              <div style={{ fontSize: 11, color: '#8D6E63', fontWeight: 600 }}>Expiry & CVV</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3E2723' }}>
                Any future date / Any 3 digits
              </div>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #FFE082' }}>
              <div style={{ fontSize: 11, color: '#8D6E63', fontWeight: 600 }}>SMS / OTP</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3E2723' }}>
                Any 4 or 6 digits
              </div>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6D4C41' }}>
            Note: If Razorpay keys are left as placeholders in <code>.env</code>, our backend simulation engine seamlessly permits testing the complete order creation and signature verification loop without throwing network errors.
          </p>
        </div>
      </details>

      {/* Success Modal */}
      {paymentSuccessData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: 32,
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              border: '2px solid #4CAF50',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#E8F5E9',
                color: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                margin: '0 auto 16px',
              }}
            >
              🎉
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900, color: COLORS.text }}>
              Payment Verified!
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: COLORS.textMuted }}>
              Congratulations! You are now an active <strong>KissanSarthi Pro</strong> member.
            </p>

            <div
              style={{
                background: '#F9FAFB',
                borderRadius: 14,
                padding: 16,
                textAlign: 'left',
                fontSize: 12,
                fontFamily: 'monospace',
                marginBottom: 24,
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6B7280' }}>Order ID:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{paymentSuccessData.payment?.razorpayOrderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6B7280' }}>Payment ID:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{paymentSuccessData.payment?.razorpayPaymentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Expires On:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {paymentSuccessData.user?.subscription?.expiresAt
                    ? new Date(paymentSuccessData.user.subscription.expiresAt).toLocaleDateString()
                    : '30 Days'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  navigate('/dashboard');
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: COLORS.primary,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  navigate('/profile?tab=payments');
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #CFD8DC',
                  background: '#fff',
                  color: COLORS.text,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Invoices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
