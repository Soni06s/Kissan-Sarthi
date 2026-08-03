import React from 'react';
import { COLORS } from '../../constants/theme';
import { Icon } from './Icon';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: COLORS.bg,
          color: COLORS.text,
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <Icon name="warning" size={48} color="#ef4444" />
            <h1 style={{ marginTop: '20px', fontSize: '24px', fontWeight: '800' }}>Something went wrong</h1>
            <p style={{ marginTop: '12px', color: COLORS.textMuted, fontSize: '14px', lineHeight: '1.6' }}>
              We're sorry, but the application encountered an unexpected error. Our team has been notified.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: COLORS.primary,
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  background: COLORS.bg,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
