import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { Icon } from '../../components/common/Icon';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await authAPI.login(form);
      if (data.data?.requiresVerification) {
        localStorage.setItem('pendingEmail', form.email);
        toast.error('Email verification required.');
        navigate('/verify-otp');
        return;
      }

      login(data.data.user, data.data.accessToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F8FAFC' }}>
      
      {/* LEFT SIDE: ILLUSTRATION */}
      <div style={{
        flex: 1,
        display: 'none',
        '@media (min-width: 900px)': { display: 'flex' },
        background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="hide-on-mobile">
        <div style={{ zIndex: 2, textAlign: 'center', maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
            <div style={{ width: 48, height: 48, background: 'white', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              <Icon name="crop" size={28} color={COLORS.primary} />
            </div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, fontFamily: 'Georgia, serif' }}>KissanSarthi</h1>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>Empowering Modern<br/>Agriculture</h2>
          <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.6 }}>Access real-time mandi prices, weather forecasts, AI crop advice, and connect with a community of progressive farmers.</p>
        </div>
        {/* Abstract background elements */}
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: 50, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 100, right: 100 }}>
           <Icon name="leaf" size={120} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'transparent'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 450,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          padding: 40,
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: COLORS.text }}>Welcome Back 👋</h2>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 15 }}>Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginLeft: 4 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                  <FiMail size={18} />
                </div>
                <input 
                  name="email" type="email" placeholder="Enter your email address" 
                  value={form.email} onChange={handleChange} required 
                  style={{ ...inputStyle, paddingLeft: 42 }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                  <FiLock size={18} /> 
                </div>
                <input 
                  name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" 
                  value={form.password} onChange={handleChange} required 
                  style={{ ...inputStyle, paddingLeft: 42, paddingRight: 42 }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 0 }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
              <input type="checkbox" id="remember" style={{ width: 16, height: 16, accentColor: COLORS.primary, cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: COLORS.textMuted, cursor: 'pointer', fontWeight: 500 }}>Remember me for 30 days</label>
            </div>

            <button type="submit" disabled={loading} style={{
              background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color: 'white', border: 'none', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)',
              opacity: loading ? 0.7 : 1, marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
            }}>
              {loading && <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ position: 'relative', textAlign: 'center', margin: '10px 0' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: COLORS.border }}></div>
              <span style={{ position: 'relative', background: 'white', padding: '0 12px', fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>OR</span>
            </div>

            <GoogleAuthButton actionText="Continue with Google" />

            <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: 14, color: COLORS.textMuted, fontWeight: 500 }}>
              Don't have an account? <Link to="/register" style={{ color: COLORS.primary, fontWeight: 800, textDecoration: 'none' }}>Create Account</Link>
            </p>
          </form>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hide-on-mobile { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: `1.5px solid #E2E8F0`,
  fontSize: 15,
  fontWeight: 500,
  color: COLORS.text,
  outline: 'none',
  transition: 'all 0.2s ease',
  background: '#F8FAFC',
  boxSizing: 'border-box'
};

export default Login;
