import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants/theme';
import { Icon } from '../../components/common/Icon';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetMode, setResetMode] = useState('link'); // 'link' or 'otp'
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email, resetMode);
      if (resetMode === 'link') {
        setLinkSent(true);
        toast.success(res.data?.message || 'Password reset link sent to your email.');
      } else {
        localStorage.setItem('resetEmail', email);
        localStorage.setItem('pendingEmail', email);
        toast.success(res.data?.message || 'Reset OTP sent to your email.');
        navigate('/verify-reset-otp');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to process reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Icon name="lock" size={28} color={COLORS.primary} />
        </div>
        <h2 style={styles.title}>Forgot Password?</h2>
        <p style={styles.subtitle}>
          Choose how you would like to reset your password.
        </p>

        {/* Choice between Link and OTP */}
        <div style={styles.modeToggle}>
          <button
            type="button"
            onClick={() => setResetMode('link')}
            style={{
              ...styles.toggleBtn,
              background: resetMode === 'link' ? COLORS.primary : 'transparent',
              color: resetMode === 'link' ? '#fff' : COLORS.textMuted,
              fontWeight: resetMode === 'link' ? 800 : 600,
            }}
          >
            🔗 Send Reset Link
          </button>
          <button
            type="button"
            onClick={() => setResetMode('otp')}
            style={{
              ...styles.toggleBtn,
              background: resetMode === 'otp' ? COLORS.primary : 'transparent',
              color: resetMode === 'otp' ? '#fff' : COLORS.textMuted,
              fontWeight: resetMode === 'otp' ? 800 : 600,
            }}
          >
            🔢 Send OTP Instead
          </button>
        </div>

        {linkSent && resetMode === 'link' ? (
          <div style={styles.successBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
            <h3 style={{ margin: '0 0 8px', color: COLORS.text, fontSize: 18, fontWeight: 800 }}>Check Your Inbox</h3>
            <p style={{ margin: '0 0 16px', color: COLORS.textMuted, fontSize: 14, lineHeight: 1.5 }}>
              If an account exists for <strong>{email}</strong>, we've sent a secure password reset link valid for 15 minutes.
            </p>
            <button
              onClick={() => setLinkSent(false)}
              style={{ ...styles.button, background: COLORS.bg, color: COLORS.primary, border: `1px solid ${COLORS.primary}` }}
            >
              Try Another Email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Registered Email Address</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <Icon name="mail" size={18} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}>
              {loading && <div style={styles.spinner}></div>}
              {loading ? 'Processing...' : resetMode === 'link' ? 'Send Reset Link' : 'Send Reset OTP'}
            </button>
          </form>
        )}

        <p style={styles.footer}>
          <Link to="/login" style={styles.link}>
            <Icon name="arrow-left" size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24 },
  card: { width: '100%', maxWidth: 450, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', padding: '40px 36px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  iconContainer: { width: 60, height: 60, background: `${COLORS.primary}18`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: COLORS.text, textAlign: 'center', fontFamily: 'Georgia, serif' },
  subtitle: { margin: '0 0 24px', color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 1.5 },
  modeToggle: { display: 'flex', background: '#F1F5F9', borderRadius: 12, padding: 4, width: '100%', marginBottom: 24 },
  toggleBtn: { flex: 1, padding: '10px 8px', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: COLORS.text, marginLeft: 4 },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 },
  input: { width: '100%', padding: '14px 16px 14px 42px', border: `1.5px solid #CBD5E1`, borderRadius: 14, fontSize: 15, fontWeight: 500, color: COLORS.text, outline: 'none', transition: 'all 0.2s ease', background: '#F8FAFC', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4, boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)' },
  successBox: { width: '100%', textAlign: 'center', padding: '16px', background: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0' },
  footer: { marginTop: 28, color: COLORS.textMuted },
  link: { color: COLORS.textMuted, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 },
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default ForgotPassword;
