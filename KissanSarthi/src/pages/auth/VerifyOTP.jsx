import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { Icon } from '../../components/common/Icon';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(localStorage.getItem('pendingEmail') || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next box
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const otpCode = otpDigits.join('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp({ email, otp: otpCode });
      login(data.data.user, data.data.accessToken);
      localStorage.removeItem('pendingEmail');
      toast.success('Email verified successfully! Welcome to KissanSarthi.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await authAPI.resendOtp({ email });
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
      toast.success('A fresh OTP has been sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to resend OTP. Please wait before retrying.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Icon name="check-circle" size={32} color={COLORS.primary} />
        </div>
        <h2 style={styles.title}>Verify Your Email</h2>
        <p style={styles.subtitle}>
          We sent a 6-digit verification code to <br />
          <strong style={{ color: COLORS.text, fontWeight: 700 }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.boxesContainer} onPaste={handlePaste}>
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  ...styles.boxInput,
                  borderColor: digit ? COLORS.primary : '#CBD5E1',
                  background: digit ? '#F0FDF4' : '#F8FAFC',
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            style={{
              ...styles.button,
              opacity: loading || otpCode.length !== 6 ? 0.6 : 1,
              cursor: loading || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading && <div style={styles.spinner}></div>}
            {loading ? 'Verifying Code...' : 'Verify & Continue'}
          </button>
        </form>

        <div style={styles.resendContainer}>
          <span style={styles.resendText}>Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            style={{
              ...styles.resendButton,
              color: countdown > 0 ? COLORS.textMuted : COLORS.primary,
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              opacity: countdown > 0 ? 0.7 : 1,
            }}
          >
            {resending
              ? 'Sending...'
              : countdown > 0
              ? `Resend in ${countdown}s`
              : 'Resend OTP'}
          </button>
        </div>

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
  card: { width: '100%', maxWidth: 460, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', padding: '40px 36px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  iconContainer: { width: 64, height: 64, background: `${COLORS.primary}18`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: COLORS.text, textAlign: 'center', fontFamily: 'Georgia, serif' },
  subtitle: { margin: '0 0 28px', color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 1.6 },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 24 },
  boxesContainer: { display: 'flex', justifyContent: 'center', gap: 10, width: '100%' },
  boxInput: { width: 50, height: 58, fontSize: 24, fontWeight: 800, textAlign: 'center', borderRadius: 14, border: '2px solid #CBD5E1', outline: 'none', color: COLORS.text, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing: 'border-box' },
  button: { width: '100%', padding: '15px', border: 'none', borderRadius: 14, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(46, 125, 50, 0.25)' },
  resendContainer: { marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  resendText: { color: COLORS.textMuted, fontWeight: 500 },
  resendButton: { background: 'none', border: 'none', fontWeight: 800, padding: 0, fontSize: 14, transition: 'all 0.2s' },
  footer: { marginTop: 28, color: COLORS.textMuted },
  link: { color: COLORS.textMuted, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 },
  spinner: { width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default VerifyOTP;
