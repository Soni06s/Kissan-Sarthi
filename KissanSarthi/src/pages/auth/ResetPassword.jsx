import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants/theme';
import { Icon } from '../../components/common/Icon';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: localStorage.getItem('resetEmail') || '', otp: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!form.email) {
      navigate('/forgot-password');
    }
  }, [form.email, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    
    // Auto populate OTP if missing but we're in this step (though normally we'd need it from previous step, assuming backend requires it)
    // Actually the backend endpoint requires email, otp, password. We need to pass the OTP from the previous step.
    // Wait, the previous step just verified the OTP, but didn't pass it here. Let's prompt for OTP if empty, or better, the user should provide it.
    // Since this is ResetPassword, let's keep OTP input hidden or if required, show it.
    if (!form.otp) {
      toast.error('Please enter the OTP you received.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await authAPI.resetPassword(form);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('pendingEmail');
      toast.success('Password reset successfully! Logging you in...');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
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
        <h2 style={styles.title}>Create New Password</h2>
        <p style={styles.subtitle}>Your new password must be different from previously used passwords.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <div style={styles.inputIcon}><Icon name="mail" size={18} /></div>
              <input name="email" type="email" value={form.email} readOnly style={{...styles.input, opacity: 0.7}} />
            </div>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Verification Code (OTP)</label>
            <div style={styles.inputWrapper}>
              <div style={styles.inputIcon}><Icon name="check-circle" size={18} /></div>
              <input name="otp" type="text" placeholder="Enter 6-digit code" value={form.otp} onChange={handleChange} maxLength={6} required style={styles.input} />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <div style={styles.inputIcon}><Icon name="lock" size={18} /></div>
              <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Must be at least 6 characters" value={form.password} onChange={handleChange} required style={{...styles.input, paddingRight: 42}} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
              </button>
            </div>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrapper}>
              <div style={styles.inputIcon}><Icon name="lock" size={18} /></div>
              <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your new password" value={form.confirmPassword} onChange={handleChange} required style={{...styles.input, paddingRight: 42}} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={18} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{...styles.button, opacity: loading ? 0.7 : 1}}>
            {loading && <div style={styles.spinner}></div>}
            {loading ? 'Resetting Password...' : 'Reset Password'}
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
  subtitle: { margin: '0 0 32px', color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 1.5 },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: COLORS.text, marginLeft: 4 },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 },
  input: { width: '100%', padding: '14px 16px 14px 42px', border: `1.5px solid #E2E8F0`, borderRadius: 14, fontSize: 15, fontWeight: 500, color: COLORS.text, outline: 'none', transition: 'all 0.2s ease', background: '#F8FAFC', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 0, display: 'flex', alignItems: 'center' },
  button: { width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)' },
  footer: { marginTop: 24, color: COLORS.textMuted },
  link: { color: COLORS.textMuted, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s ease' },
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default ResetPassword;
