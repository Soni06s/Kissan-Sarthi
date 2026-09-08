import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { COLORS } from "./constants/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout Components
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Chatbot from "./components/chat/Chatbot";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Page Components
import DashboardPage from "./pages/Dashboard";
import WeatherPage from "./pages/Weather";
import CropPage from "./pages/CropPage";
import MarketPage from "./pages/Market";
import FertilizerPage from "./pages/Fertilizer";
import CommunityPage from "./pages/Community";
import AdminPage from "./pages/Admin";
import RegisterPage from "./pages/auth/Register";
import VerifyOTPPage from "./pages/auth/VerifyOTP";
import LoginPage from "./pages/auth/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import VerifyResetOTPPage from "./pages/auth/VerifyResetOTP";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import ProfilePage from "./pages/Profile";
import MarketplacePage from "./pages/Marketplace";
import SchemesPage from "./pages/Schemes";
import PricingPage from "./pages/Pricing";
import ExpertsPage from "./pages/Experts";
import ExpertProfilePage from "./pages/ExpertProfile";

const AuthLayout = ({ children }) => <div>{children}</div>;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role, user } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ marginTop: 16, color: COLORS.textMuted, fontWeight: 600 }}>Loading secure session...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = role || user?.role || 'farmer';
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setSidebarOpen(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div
          style={{
            background: COLORS.bg,
            minHeight: "100vh",
            color: COLORS.text,
            transition: "background 0.3s ease",
          }}
        >
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#333',
                fontWeight: '600',
                padding: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
            <Route path="/verify-otp" element={<AuthLayout><VerifyOTPPage /></AuthLayout>} />
            <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
            <Route path="/verify-reset-otp" element={<AuthLayout><VerifyResetOTPPage /></AuthLayout>} />
            <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
            <Route path="/reset-password/:token" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
                    <Sidebar open={sidebarOpen} />
                    <main style={{ marginLeft: sidebarOpen && !isMobile ? "220px" : "0px", padding: !isMobile ? "30px" : "15px", marginTop: "62px", transition: "margin-left 0.3s ease", minHeight: "calc(100vh - 62px)" }}>
                      <div className="page-transition">
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<DashboardPage />} />
                          <Route path="/marketplace" element={<MarketplacePage />} />
                          <Route path="/pricing" element={<PricingPage />} />
                          <Route path="/experts" element={<ExpertsPage />} />
                          <Route path="/experts/:id" element={<ExpertProfilePage />} />
                          <Route path="/weather" element={<WeatherPage />} />
                          <Route path="/crop-advisor" element={<CropPage />} />
                          <Route path="/market-prices" element={<MarketPage />} />
                          <Route path="/fertilizer" element={<FertilizerPage />} />
                          <Route path="/schemes" element={<SchemesPage />} />
                          <Route path="/community" element={<CommunityPage />} />
                          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
                          <Route path="/profile" element={<ProfilePage />} />
                        </Routes>
                      </div>
                    </main>
                    <Chatbot />
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}