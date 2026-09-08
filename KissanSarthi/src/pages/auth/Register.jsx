import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiLock, FiMapPin, FiCalendar } from 'react-icons/fi';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants/theme';
import { Icon } from '../../components/common/Icon';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    address: '',
    postOffice: '',
    gender: '',
    dob: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Pincode autofill states
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [locationError, setLocationError] = useState('');

  // Password strength logic (allows min 6 digits/characters)
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'transparent', width: '0%' };
    if (pass.length < 6) return { label: 'Min 6 digits/chars required', color: '#ef4444', width: '25%' };
    let score = 1; // Valid since length >= 6
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { label: 'Fair (Valid)', color: '#22c55e', width: '50%' };
    if (score <= 4) return { label: 'Good', color: '#16a34a', width: '75%' };
    return { label: 'Strong', color: '#15803d', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(form.password);

  useEffect(() => {
    const fetchLocation = async () => {
      if (form.pincode.length === 6) {
        setFetchingLocation(true);
        setLocationError('');
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
          const data = await response.json();
          
          if (data && data[0] && data[0].Status === 'Success') {
            const offices = data[0].PostOffice;
            const firstOffice = offices[0];
            
            setPostOffices(offices);
            setForm(prev => ({
              ...prev,
              city: firstOffice.District,
              state: firstOffice.State,
              country: 'India',
              postOffice: firstOffice.Name
            }));
          } else {
            setLocationError('Invalid pincode');
            setPostOffices([]);
            setForm(prev => ({
              ...prev,
              city: '',
              state: '',
              postOffice: ''
            }));
          }
        } catch (err) {
          setLocationError('Unable to fetch address');
          setPostOffices([]);
        } finally {
          setFetchingLocation(false);
        }
      } else {
        if (postOffices.length > 0 || locationError) {
          setPostOffices([]);
          setLocationError('');
        }
      }
    };

    const timer = setTimeout(() => {
      fetchLocation();
    }, 400);

    return () => clearTimeout(timer);
  }, [form.pincode]);

  const validate = () => {
      if (form.fullName.length < 3 || form.fullName.length > 50) return 'Name must be between 3 and 50 characters.';
      if (!/^\d{10}$/.test(form.mobile)) return 'Please enter a valid 10-digit mobile number.';
      if (!form.password || form.password.length < 6) return 'Password must be at least 6 digits or characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      if (!/^\d{6}$/.test(form.pincode)) return 'Please enter a valid 6-digit pincode.';
      if (locationError) return 'Please enter a valid pincode.';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pincode' && value !== '' && !/^\d+$/.test(value)) return;
    if (name === 'pincode' && value.length > 6) return;
    if (name === 'mobile' && value !== '' && !/^\d+$/.test(value)) return;
    if (name === 'mobile' && value.length > 10) return;

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fetchingLocation) return;
    
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setLoading(true);
    
    const payload = { ...form };
    if (payload.postOffice && payload.address && !payload.address.includes(payload.postOffice)) {
        payload.address = `${payload.address}, ${payload.postOffice}`;
    } else if (payload.postOffice && !payload.address) {
        payload.address = payload.postOffice;
    }

    try {
      await authAPI.register(payload);
      toast.success('Registration Successful! Redirecting...');
      localStorage.setItem('pendingEmail', payload.email);
      setTimeout(() => navigate('/verify-otp'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ width: 48, height: 48, background: `${COLORS.primary}15`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="user" size={24} color={COLORS.primary} />
          </div>
            <h2 style={styles.title}>Create Your Account</h2>
            <p style={styles.subtitle}>Join KissanSarthi and start your smart farming journey.</p>
          </div>

        <div style={{ marginBottom: 32 }}>
          <GoogleAuthButton actionText="Continue with Google" />
          
          <div style={{ position: 'relative', textAlign: 'center', marginTop: 24 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: COLORS.border }}></div>
            <span style={{ position: 'relative', background: 'white', padding: '0 12px', fontSize: 13, color: COLORS.textMuted, fontWeight: 700 }}>OR REGISTER WITH EMAIL</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* SECTION: PERSONAL INFO */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <FiUser style={styles.icon} />
                <input name="fullName" placeholder="Full Name *" value={form.fullName} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <FiPhone style={styles.icon} />
                <input name="mobile" placeholder="Mobile Number *" value={form.mobile} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <FiCalendar style={styles.icon} />
                <input name="dob" type="date" placeholder="Date of Birth" value={form.dob} onChange={handleChange} style={{...styles.input, color: form.dob ? COLORS.text : COLORS.textMuted}} />
              </div>
              <div style={styles.inputGroup}>
                <FiUser style={styles.icon} />
                <select name="gender" value={form.gender} onChange={handleChange} style={{...styles.input, color: form.gender ? COLORS.text : COLORS.textMuted}}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION: ADDRESS INFO */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Address Information</h3>
            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <FiMapPin style={styles.icon} />
                <input name="pincode" placeholder="Pincode *" value={form.pincode} onChange={handleChange} required style={styles.input} />
                {fetchingLocation && <div style={{...styles.spinner, position: 'absolute', right: 14, width: 16, height: 16, borderWidth: 2, borderColor: COLORS.border, borderTopColor: COLORS.primary}}></div>}
              </div>
              {locationError && <div style={{...styles.errorText, gridColumn: '1 / -1', marginTop: -12}}>{locationError}</div>}
              
              <div style={styles.inputGroup}>
                <FiMapPin style={styles.icon} />
                <input name="city" placeholder="City / District *" value={form.city} onChange={handleChange} required disabled={fetchingLocation} style={{...styles.input, backgroundColor: fetchingLocation ? '#F8FAFC' : '#fff'}} />
              </div>
              <div style={styles.inputGroup}>
                <FiMapPin style={styles.icon} />
                <input name="state" placeholder="State *" value={form.state} onChange={handleChange} required disabled={fetchingLocation} style={{...styles.input, backgroundColor: fetchingLocation ? '#F8FAFC' : '#fff'}} />
              </div>
              <div style={styles.inputGroup}>
                <FiMapPin style={styles.icon} />
                <input name="country" placeholder="Country *" value={form.country} onChange={handleChange} required disabled={fetchingLocation} style={{...styles.input, backgroundColor: fetchingLocation ? '#F8FAFC' : '#fff'}} />
              </div>
              
              {postOffices.length > 0 && (
                <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                  <FiMapPin style={styles.icon} />
                  <select name="postOffice" value={form.postOffice} onChange={handleChange} style={styles.input} disabled={fetchingLocation}>
                    {postOffices.map((po, idx) => (
                      <option key={idx} value={po.Name}>{po.Name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                <FiMapPin style={styles.icon} />
                <input name="address" placeholder="Street Address" value={form.address} onChange={handleChange} style={styles.input} />
              </div>
            </div>
          </div>

          {/* SECTION: ACCOUNT INFO */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Account Information</h3>
            <div style={styles.grid}>
              <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                <FiMail style={styles.icon} />
                <input name="email" type="email" placeholder="Email Address *" value={form.email} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <FiLock style={styles.icon} />
                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters/digits) *" value={form.password} onChange={handleChange} required style={styles.input} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div style={styles.inputGroup}>
                <FiLock style={styles.icon} />
                <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password *" value={form.confirmPassword} onChange={handleChange} required style={styles.input} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            
            {/* Password Strength Indicator */}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontWeight: 600, color: passwordStrength.color }}>
                  <span>Password Strength</span>
                  <span>{passwordStrength.label}</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: passwordStrength.width, background: passwordStrength.color, transition: 'all 0.3s ease' }}></div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || fetchingLocation} style={{...styles.button, opacity: (loading || fetchingLocation) ? 0.7 : 1}}>
            {loading && <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '40px 24px' },
  card: { width: '100%', maxWidth: 760, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', padding: 40, border: '1px solid rgba(255,255,255,0.4)' },
  header: { textAlign: 'center', marginBottom: 32 },
  title: { margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: COLORS.text, fontFamily: 'Georgia, serif' },
  subtitle: { margin: 0, color: COLORS.textMuted, fontSize: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 32 },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.5px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: 16, color: '#94a3b8', fontSize: 18 },
  input: { width: '100%', padding: '14px 16px 14px 44px', border: `1.5px solid #E2E8F0`, borderRadius: 14, fontSize: 15, fontWeight: 500, color: COLORS.text, outline: 'none', transition: 'all 0.2s ease', background: '#F8FAFC', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: 14, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', padding: 0 },
  button: { width: '100%', padding: '16px', border: 'none', borderRadius: 14, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10, boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)', transition: 'all 0.2s ease' },
  footer: { marginTop: 32, color: COLORS.textMuted, textAlign: 'center', fontWeight: 500, fontSize: 15 },
  link: { color: COLORS.primary, fontWeight: 800, textDecoration: 'none' },
  errorText: { color: '#ef4444', fontSize: 13, paddingLeft: 10, fontWeight: 600 },
  spinner: { width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default Register;
