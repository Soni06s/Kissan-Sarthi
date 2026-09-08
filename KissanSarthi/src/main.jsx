import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);