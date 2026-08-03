import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants/theme';
import { Icon } from '../../components/common/Icon';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      localStorage.setItem('pendingEmail', email);
      toast.success('Reset OTP sent to your email.');
      navigate('/verify-reset-otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Icon name="lock" size={24} color={COLORS.primary} />
        </div>
        <h2 style={styles.title}>Forgot Password?</h2>
        <p style={styles.subtitle}>No worries, we'll send you reset instructions.</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <div style={styles.inputIcon}>
                <Icon name="mail" size={18} />
              </div>
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={styles.input} 
              />
            </div>
          </div>
          
          <button type="submit" disabled={loading} style={{...styles.button, opacity: loading ? 0.7 : 1}}>
            {loading && <div style={styles.spinner}></div>}
            {loading ? 'Sending OTP...' : 'Reset Password'}
          </button>
        </form>
        
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
  subtitle: { margin: '0 0 32px', color: COLORS.textMuted, fontSize: 15, textAlign: 'center' },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: COLORS.text, marginLeft: 4 },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 },
  input: { width: '100%', padding: '14px 16px 14px 42px', border: `1.5px solid #E2E8F0`, borderRadius: 14, fontSize: 15, fontWeight: 500, color: COLORS.text, outline: 'none', transition: 'all 0.2s ease', background: '#F8FAFC', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8, boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)' },
  footer: { marginTop: 24, color: COLORS.textMuted },
  link: { color: COLORS.textMuted, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s ease' },
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default ForgotPassword;
