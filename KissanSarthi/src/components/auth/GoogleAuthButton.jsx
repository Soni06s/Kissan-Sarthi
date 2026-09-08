import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export const GoogleAuthButton = ({ actionText }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect result on mount if mobile redirect was used
  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && isMounted) {
          setLoading(true);
          const idToken = await result.user.getIdToken();
          const { data } = await authAPI.googleLogin({ idToken });
          login(data.data.user, data.data.accessToken);
          const from = location.state?.from?.pathname || '/dashboard';
          toast.success('Successfully authenticated!');
          navigate(from, { replace: true });
        }
      } catch (err) {
        console.error('Google Redirect Auth Error:', err);
        handleAuthError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkRedirect();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthError = (err) => {
    if (err.code === 'auth/popup-closed-by-user') {
      // Popup closed by user -> silent, no error toast
      return;
    }
    if (
      err.code === 'auth/network-request-failed' ||
      err.code === 'auth/configuration-not-found' ||
      err.code === 'auth/invalid-api-key' ||
      err.code === 'auth/internal-error'
    ) {
      toast.error('Google sign-in is temporarily unavailable, please use email login.');
      return;
    }
    if (err.response?.status === 401) {
      toast.error('Google token verification failed. Please sign in again.');
      return;
    }
    toast.error(err.response?.data?.message || err.message || 'Google authentication failed.');
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      let result;
      if (isMobile) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.warn('Redirect failed, trying popup fallback', redirectErr);
          result = await signInWithPopup(auth, googleProvider);
        }
      } else {
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupErr) {
          if (popupErr.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupErr;
        }
      }

      const idToken = await result.user.getIdToken();
      const { data } = await authAPI.googleLogin({ idToken });
      login(data.data.user, data.data.accessToken);

      const from = location.state?.from?.pathname || '/dashboard';
      toast.success('Successfully authenticated!');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google Auth Error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '14px',
          borderRadius: 14,
          background: 'white',
          border: `1.5px solid ${COLORS.border}`,
          color: COLORS.text,
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        onMouseOver={(e) => {
          if(!loading) {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }
        }}
        onMouseOut={(e) => {
          if(!loading) {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = COLORS.border;
          }
        }}
      >
        {loading ? (
          <div style={{ width: 20, height: 20, border: '3px solid #f3f3f3', borderTop: `3px solid ${COLORS.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, 39.238998)">
              <path fill="#4285F4" d="M -3.264 -22.565 C -3.264 -23.473 -3.342 -24.18 -3.51 -24.966 L -14.978 -24.966 L -14.978 -20.655 L -8.318 -20.655 C -8.618 -19.231 -9.516 -17.585 -10.963 -16.549 L -10.963 -13.784 L -7.026 -13.784 C -4.73 -15.932 -3.264 -19.068 -3.264 -22.565 Z" />
              <path fill="#34A853" d="M -14.978 -10.957 C -11.684 -10.957 -8.86 -12.062 -6.829 -13.914 L -10.963 -16.713 C -12.054 -15.967 -13.433 -15.589 -14.978 -15.589 C -18.067 -15.589 -20.672 -13.483 -21.603 -10.638 L -25.688 -10.638 L -25.688 -7.42 C -23.702 -3.428 -19.673 -0.663 -14.978 -0.663 C -10.283 -0.663 -6.254 -3.428 -4.269 -7.42 L -8.354 -10.638 C -9.285 -13.483 -11.89 -15.589 -14.978 -15.589 Z" />
              <path fill="#FBBC05" d="M -21.603 -17.202 C -21.845 -16.495 -21.983 -15.756 -21.983 -15.002 C -21.983 -14.248 -21.845 -13.509 -21.603 -12.802 L -21.603 -9.584 L -25.688 -9.584 C -26.54 -11.311 -27.026 -13.238 -27.026 -15.267 C -27.026 -17.296 -26.54 -19.223 -25.688 -20.95 Z" />
              <path fill="#EA4335" d="M -14.978 -29.239 C -12.871 -29.239 -11.393 -28.318 -10.518 -27.476 L -7.143 -30.73 C -9.186 -32.617 -11.843 -33.911 -14.978 -33.911 C -19.673 -33.911 -23.702 -31.146 -25.688 -27.154 L -21.603 -23.936 C -20.672 -26.781 -18.067 -28.887 -14.978 -28.887 Z" />
            </g>
          </svg>
        )}
        {loading ? 'Authenticating...' : actionText || 'Continue with Google'}
      </button>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
