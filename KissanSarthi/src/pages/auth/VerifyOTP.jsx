import { useEffect, useState } from 'react';
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
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);

    try {
      const { data } = await authAPI.verifyOtp({ email, otp });
      login(data.data.user, data.data.accessToken);
      localStorage.removeItem('pendingEmail');
      toast.success('Email verified successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOtp({ email });
      toast.success('A new OTP has been sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to resend OTP. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Icon name="check-circle" size={28} color={COLORS.primary} />
        </div>
        <h2 style={styles.title}>Check your email</h2>
        <p style={styles.subtitle}>We sent a verification code to <br/><strong style={{color: COLORS.text}}>{email}</strong></p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Verification Code</label>
            <input 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
              placeholder="Enter 6-digit code" 
              maxLength={6} 
              required 
              style={{...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: 18}} 
            />
          </div>
          
          <button type="submit" disabled={loading} style={{...styles.button, opacity: loading ? 0.7 : 1}}>
            {loading && <div style={styles.spinner}></div>}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div style={styles.resendContainer}>
          <span style={styles.resendText}>Didn't receive the code?</span>
          <button onClick={handleResend} disabled={resending} style={styles.resendButton}>
            {resending ? 'Sending...' : 'Click to resend'}
          </button>
        </div>

        <p style={styles.footer}>
          <Link to="/login" style={styles.link}>
            <Icon name="arrow-left" size={14} /> Back to log in
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
  card: { width: '100%', maxWidth: 440, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', padding: 40, border: '1px solid rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  iconContainer: { width: 56, height: 56, background: `${COLORS.primary}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: COLORS.text, textAlign: 'center' },
  subtitle: { margin: '0 0 32px', color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 1.5 },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' },
  label: { fontSize: 13, fontWeight: 700, color: COLORS.text, textAlign: 'center' },
  input: { width: '100%', padding: '16px', border: `1.5px solid #E2E8F0`, borderRadius: 14, fontWeight: 700, color: COLORS.text, outline: 'none', transition: 'all 0.2s ease', background: '#F8FAFC', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8, boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)' },
  resendContainer: { marginTop: 24, display: 'flex', gap: 6, fontSize: 14 },
  resendText: { color: COLORS.textMuted, fontWeight: 500 },
  resendButton: { background: 'none', border: 'none', color: COLORS.primary, fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 14 },
  footer: { marginTop: 32, color: COLORS.textMuted },
  link: { color: COLORS.textMuted, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s ease' },
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default VerifyOTP;
