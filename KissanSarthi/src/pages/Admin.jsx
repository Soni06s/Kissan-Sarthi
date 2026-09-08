import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';
import { adminAPI, communityAPI } from '../services/api';
import toast from 'react-hot-toast';

const defaultStats = [
  { label: "Total Farmers", value: "11", trend: "Active", trendUp: true, sub: "Registered profiles", iconColor: "#16A34A", bgColor: "#DCFCE7" },
  { label: "AI Advisory Queries", value: "384", trend: "Live", trendUp: true, sub: "Gemini sessions today", iconColor: "#D97706", bgColor: "#FEF3C7" },
  { label: "Community Discussions", value: "52", trend: "↑ 8%", trendUp: true, sub: "Shared farm insights", iconColor: "#2563EB", bgColor: "#DBEAFE" },
  { label: "System Health", value: "99.98%", trend: "15ms", trendUp: true, sub: "DB & Telemetry latency", iconColor: "#059669", bgColor: "#D1FAE5" },
];

const defaultSystemItems = [
  { name: "Gemini 2.5 Flash Engine", sub: "Operational · Responsive", status: "on", cpu: 32, latency: 180, rawError: null },
  { name: "MongoDB Atlas Database", sub: "15ms roundtrip · Replica Set Active", status: "on", cpu: 25, latency: 15, rawError: null },
  { name: "Mandi Price Ingestion", sub: "Real-time commodity ticker sync active", status: "on", cpu: 40, latency: 45, rawError: null },
  { name: "Socket.IO Telemetry Engine", sub: "WebSocket connected · Bi-directional stream", status: "on", cpu: 18, latency: 12, rawError: null },
];

const dotColor = { on: "#10B981", warn: "#F59E0B", off: "#EF4444" };

const planBadge = {
  farmer: { bg: "#EAF3DE", color: "#27500A", label: "Farmer" },
  admin: { bg: "#FCEBEB", color: "#A32D2D", label: "Admin" },
  expert: { bg: "#E6F1FB", color: "#0C447C", label: "Expert" },
  default: { bg: "#F1EFE8", color: "#5F5E5A", label: "Active" },
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'moderation' | 'verifications' | 'experts'
  const [stats, setStats] = useState(defaultStats);
  const [systemItems, setSystemItems] = useState(defaultSystemItems);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [expertsList, setExpertsList] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Table filtering and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 8;

  // System health raw error accordion toggle
  const [expandedErrors, setExpandedErrors] = useState({});

  // Moderation delete modal state
  const [deleteReportModal, setDeleteReportModal] = useState({ isOpen: false, report: null, isDeleting: false });

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, usersRes, reportsRes, verifRes, expRes] = await Promise.all([
        adminAPI.getDashboard().catch(() => null),
        adminAPI.getUsers(1).catch(() => null),
        adminAPI.getReports(1).catch(() => null),
        adminAPI.getVerifications('all').catch(() => null),
        adminAPI.getExperts().catch(() => null),
      ]);

      if (expRes?.data?.data) {
        setExpertsList(expRes.data.data);
      }

      if (dashRes?.data?.data?.stats) {
        const received = dashRes.data.data.stats;
        setStats(received.map((s, i) => ({
          ...s,
          iconColor: ["#16A34A", "#D97706", "#2563EB", "#059669"][i] || "#16A34A",
          bgColor: ["#DCFCE7", "#FEF3C7", "#DBEAFE", "#D1FAE5"][i] || "#DCFCE7",
        })));
      }

      if (dashRes?.data?.data?.systemItems) {
        setSystemItems(dashRes.data.data.systemItems);
      }

      if (usersRes?.data?.data?.users) {
        setUsers(usersRes.data.data.users);
      }

      if (reportsRes?.data?.data?.reports) {
        setReports(reportsRes.data.data.reports);
      }

      if (verifRes?.data?.data) {
        setVerifications(verifRes.data.data);
      }
    } catch (err) {
      console.warn('Admin fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.isActive === false ? true : false;
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));
    try {
      await adminAPI.updateUserStatus(user._id, newStatus);
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: newStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      await adminAPI.updateReportStatus(reportId, status);
      toast.success(`Report marked as ${status}`);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    }
  };

  const handleConfirmDeleteReportedPost = async () => {
    if (!deleteReportModal.report) return;
    const r = deleteReportModal.report;
    const postId = r.post?._id || r.post?.id;
    if (!postId) {
      toast.error('Post information not found');
      setDeleteReportModal({ isOpen: false, report: null, isDeleting: false });
      return;
    }

    setDeleteReportModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await communityAPI.deletePost(postId, { reason: r.reason || 'Violated community guidelines' });
      toast.success('Reported post deleted and marked resolved');
      setReports(prev => prev.map(item => item._id === r._id ? { ...item, status: 'resolved' } : item));
      setDeleteReportModal({ isOpen: false, report: null, isDeleting: false });
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeleteReportModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleReviewVerification = async (userId, status, rejectionReason = '') => {
    try {
      await adminAPI.reviewVerification(userId, { status, rejectionReason });
      toast.success(status === 'verified' ? 'Farmer verified! Green checkmark badge issued.' : 'Verification rejected.');
      setVerifications((prev) =>
        prev.map((v) => (v._id === userId ? { ...v, verificationStatus: status, verificationDetails: { ...v.verificationDetails, rejectionReason } } : v))
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, verificationStatus: status } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review verification');
    }
  };

  const handleReviewExpert = async (id, verificationStatus) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await adminAPI.updateExpertStatus(id, { verificationStatus });
      toast.success(`Expert verification updated to ${verificationStatus}`);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update expert verification');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleExpertAvailability = async (id, currentVal) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await adminAPI.updateExpertStatus(id, { availableForConsultation: !currentVal });
      toast.success(!currentVal ? 'Expert listing activated' : 'Expert listing paused');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to toggle expert availability');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const roleMatches = roleFilter === 'all' || (u.role || 'farmer').toLowerCase() === roleFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const searchMatches = !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q)) ||
      (u.state && u.state.toLowerCase().includes(q));
    return roleMatches && searchMatches;
  });

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ paddingBottom: 40 }}
    >
      {/* ─── HEADER ─── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
        background: `linear-gradient(135deg, #FFFFFF 0%, ${COLORS.bg} 100%)`,
        padding: "24px 28px",
        borderRadius: 22,
        borderLeft: `6px solid ${COLORS.primary}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        border: `1px solid ${COLORS.border}`,
        borderLeftWidth: 6,
        borderLeftColor: COLORS.primary,
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>
            Admin Command Center
          </h1>
          <p style={{ color: COLORS.textMuted, margin: "6px 0 0", fontSize: 14, fontWeight: 500 }}>
            Platform Governance • <span style={{ color: COLORS.primary, fontWeight: 700 }}>KissanSarthi Core</span> •{" "}
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={fetchAdminData}
            disabled={refreshing}
            style={{
              background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 12,
              padding: "10px 18px", fontSize: 13, fontWeight: 800,
              color: COLORS.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Icon name="refresh" size={14} color={COLORS.primary} />
            {refreshing ? "Refreshing..." : "Recheck Telemetry"}
          </button>
        </div>
      </div>

      {/* ─── KPI STAT CARDS (Equal Width, Bold Numbers) ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 18,
        marginBottom: 26,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "#FFFFFF",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: "22px 24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: s.bgColor || "#DCFCE7",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={["community", "bot", "crop", "activity"][i] || "community"} size={24} color={s.iconColor || COLORS.primary} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, color: s.iconColor || COLORS.primary,
                background: s.bgColor || "#DCFCE7", padding: "4px 10px", borderRadius: 10,
              }}>
                {s.trend || 'Active'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.text, fontFamily: "Georgia, serif", lineHeight: 1.1 }}>
                {s.value || '0'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text, marginTop: 8 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                {s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { id: 'users', label: '👥 User Directory & Status', count: users.length },
          { id: 'moderation', label: '🛡️ Moderation Queue', count: reports.filter(r => r.status === 'pending').length, alert: reports.filter(r => r.status === 'pending').length > 0 },
          { id: 'verifications', label: '📜 KYC Verifications', count: verifications.filter(v => v.verificationStatus === 'pending').length, alert: verifications.filter(v => v.verificationStatus === 'pending').length > 0 },
          { id: 'experts', label: '🔬 Manage Experts', count: expertsList.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setUserPage(1); }}
              style={{
                padding: '11px 20px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                background: isActive ? COLORS.primary : '#FFFFFF',
                color: isActive ? '#FFFFFF' : COLORS.text,
                boxShadow: isActive ? '0 4px 15px rgba(46,125,50,0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.22)' : tab.alert ? '#FEE2E2' : '#F3F4F6',
                color: isActive ? '#FFFFFF' : tab.alert ? '#DC2626' : COLORS.textMuted,
                padding: '2px 8px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: USERS & SYSTEM HEALTH ─── */}
      {activeTab === 'users' && (
        <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 22 }} className="grid-split">
          
          {/* Registered Farmers & Roles Card */}
          <div style={{
            background: "#FFFFFF",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Card Header & Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                  Registered Farmers & Roles
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                  Manage account access, view full profiles, and inspect credentials
                </p>
              </div>

              {/* Instant Search Box */}
              <div style={{ position: "relative", minWidth: 220 }}>
                <input
                  type="text"
                  placeholder="Filter name, email, district..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1); }}
                  style={{
                    width: "100%",
                    padding: "8px 14px 8px 34px",
                    borderRadius: 10,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 12,
                    color: COLORS.text,
                    outline: "none",
                    background: "#F9FAFB",
                  }}
                />
                <div style={{ position: "absolute", left: 10, top: 9, opacity: 0.45 }}>
                  <Icon name="search" size={15} />
                </div>
              </div>
            </div>

            {/* Role Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { id: 'all', label: 'All Users' },
                { id: 'farmer', label: 'Farmers' },
                { id: 'expert', label: 'Experts' },
                { id: 'admin', label: 'Admins' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => { setRoleFilter(pill.id); setUserPage(1); }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1px solid ${roleFilter === pill.id ? COLORS.primary : COLORS.border}`,
                    background: roleFilter === pill.id ? "#EAF3DE" : "#FFFFFF",
                    color: roleFilter === pill.id ? COLORS.primary : COLORS.textMuted,
                    cursor: "pointer",
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Horizontally Scrollable Table Wrapper */}
            <div style={{
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Farmer", "Contact", "Role", "KYC Status", "Account Action"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", fontSize: 11, fontWeight: 800,
                        color: COLORS.textMuted, letterSpacing: "0.05em",
                        textTransform: "uppercase", padding: "12px 14px",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "36px 16px", color: COLORS.textMuted, fontSize: 13 }}>
                        No farmers match the current filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u, i) => {
                      const badge = planBadge[u.role] || planBadge.default;
                      const isVerified = u.isVerified;
                      const isActive = u.isActive !== false;

                      return (
                        <tr key={u._id || i} style={{ transition: "background 0.15s" }}>
                          {/* User / Name */}
                          <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: badge.bg, color: badge.color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 800, flexShrink: 0,
                              }}>
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                                  📍 {u.city ? `${u.city}${u.state ? `, ${u.state}` : ''}` : 'Location pending'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td style={{ fontSize: 12, color: COLORS.textMuted, padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                            <div style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: COLORS.text, fontWeight: 600 }}>
                              {u.email}
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                              {u.phone || '—'}
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                            <span style={{
                              background: badge.bg, color: badge.color,
                              padding: "3px 9px", borderRadius: 8,
                              fontSize: 11, fontWeight: 800, textTransform: 'capitalize',
                              display: 'inline-block',
                            }}>
                              {u.role || 'farmer'}
                            </span>
                          </td>

                          {/* Verification */}
                          <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                            {(() => {
                              const vStatus = u.verificationStatus || (isVerified ? 'verified' : 'unverified');
                              if (vStatus === 'verified') {
                                return (
                                  <span style={{ background: "#DCFCE7", color: "#16A34A", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                    ✓ Verified
                                  </span>
                                );
                              }
                              if (vStatus === 'pending') {
                                return (
                                  <span style={{ background: "#FEF3C7", color: "#B45309", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                    ⏳ Review
                                  </span>
                                );
                              }
                              return (
                                <span style={{ background: "#F3F4F6", color: "#6B7280", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                                  Standard
                                </span>
                              );
                            })()}
                          </td>

                          {/* Redesigned Compact Action Buttons */}
                          <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {/* Eye button: View full user details */}
                              <button
                                type="button"
                                title="View Profile Details"
                                onClick={() => setSelectedUser(u)}
                                style={{
                                  width: 30, height: 30, borderRadius: 8,
                                  border: `1px solid ${COLORS.border}`,
                                  background: "#FFFFFF",
                                  cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 13,
                                }}
                              >
                                👁️
                              </button>

                              {/* Toggle active / deactivate */}
                              {u.role !== 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={actionLoading[u._id]}
                                  title={isActive ? "Deactivate User Account" : "Reactivate User Account"}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 8,
                                    border: "none",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    cursor: actionLoading[u._id] ? "not-allowed" : "pointer",
                                    background: isActive ? "#FEE2E2" : "#DCFCE7",
                                    color: isActive ? "#DC2626" : "#15803D",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {actionLoading[u._id] ? '...' : (
                                    <>
                                      <span style={{ fontSize: 9 }}>{isActive ? '●' : '○'}</span>
                                      {isActive ? 'Deactivate' : 'Reactivate'}
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>
                                  Protected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Showing {(userPage - 1) * USERS_PER_PAGE + 1}–{Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} farmers
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => Math.max(p - 1, 1))}
                    style={{
                      padding: "4px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: userPage === 1 ? "not-allowed" : "pointer",
                      opacity: userPage === 1 ? 0.5 : 1,
                    }}
                  >
                    ← Prev
                  </button>
                  <span style={{ padding: "4px 8px", fontSize: 12, fontWeight: 800, color: COLORS.text }}>
                    {userPage} / {totalPages}
                  </span>
                  <button
                    disabled={userPage === totalPages}
                    onClick={() => setUserPage(p => Math.min(p + 1, totalPages))}
                    style={{
                      padding: "4px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: userPage === totalPages ? "not-allowed" : "pointer",
                      opacity: userPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── SYSTEM HEALTH CARD (Clean Ops Status Rows + Expandable Details) ─── */}
          <div style={{
            background: "#FFFFFF",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                  System Health & Services
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                  Live microservices, APIs & telemetry ping
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, color: "#16A34A",
                background: "#DCFCE7", padding: "5px 10px", borderRadius: 10,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                Telemetry Live
              </span>
            </div>

            {/* Service Status Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {systemItems.map((s, i) => {
                const isWarn = s.status === 'warn';
                const isOff = s.status === 'off';
                const isExpanded = expandedErrors[s.name];

                return (
                  <div key={i} style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: isOff ? "#FEF2F2" : isWarn ? "#FFFBEB" : "#F9FAFB",
                    border: `1px solid ${isOff ? '#FECACA' : isWarn ? '#FDE68A' : COLORS.border}`,
                    transition: "all 0.2s ease",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        {/* Colored Pulse Dot */}
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: dotColor[s.status] || dotColor.on,
                          boxShadow: `0 0 6px ${dotColor[s.status] || dotColor.on}`,
                          display: "inline-block",
                          flexShrink: 0,
                        }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
                            {s.name}
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "1px 6px",
                              borderRadius: 6,
                              background: isOff ? "#FEE2E2" : isWarn ? "#FEF3C7" : "#DCFCE7",
                              color: isOff ? "#DC2626" : isWarn ? "#B45309" : "#15803D",
                            }}>
                              {isOff ? 'Offline' : isWarn ? 'Degraded' : 'Operational'}
                            </span>
                          </div>
                          {/* Short, Clean Human-Readable Subtext */}
                          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                            {s.sub}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Expand button or Latency */}
                      <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
                        {s.rawError ? (
                          <button
                            type="button"
                            onClick={() => setExpandedErrors(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#FFFFFF",
                              border: `1px solid ${isWarn ? '#F59E0B' : COLORS.border}`,
                              color: isWarn ? '#B45309' : COLORS.text,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? 'Hide ▴' : 'Details ▾'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>
                            {s.latency ? `${s.latency}ms` : 'Healthy'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable Debug Details (Hidden by default, never dumps wall of text) */}
                    {s.rawError && isExpanded && (
                      <div style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        background: "#1E293B",
                        borderRadius: 8,
                        color: "#E2E8F0",
                        fontSize: 11,
                        fontFamily: "monospace",
                        lineHeight: 1.4,
                        wordBreak: "break-all",
                        maxHeight: 110,
                        overflowY: "auto",
                      }}>
                        <div style={{ color: "#FCD34D", fontWeight: 700, marginBottom: 4 }}>
                          Diagnostic Error Payload:
                        </div>
                        {s.rawError}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* System Status Summary Banner */}
            <div style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>
                  Platform Guard Rails Active
                </div>
                <div style={{ fontSize: 11, color: "#15803D" }}>
                  Automatic rate-limit retry and failover routing active.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MODERATION QUEUE (With Direct Delete Action Wired) ─── */}
      {activeTab === 'moderation' && (
        <div style={{ background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                Community Content Moderation Queue
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                Review flagged posts, take administrative action, or permanently delete violating content
              </p>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 800,
              background: reports.filter(r => r.status === 'pending').length > 0 ? '#FEE2E2' : '#DCFCE7',
              color: reports.filter(r => r.status === 'pending').length > 0 ? '#DC2626' : '#15803D',
              padding: '6px 12px', borderRadius: 10,
            }}>
              {reports.filter(r => r.status === 'pending').length} Actionable Items
            </span>
          </div>

          {reports.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: COLORS.textMuted, fontSize: 14 }}>
              🛡️ No pending moderation reports. All community discussions are healthy!
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Reported Post", "Reported By", "Reason & Details", "Status", "Admin Resolution"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", fontSize: 11, fontWeight: 800,
                        color: COLORS.textMuted, letterSpacing: "0.05em",
                        textTransform: "uppercase", padding: "12px 14px",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const postTitle = r.post?.title || 'Community Insight';
                    const postAuthor = r.post?.author?.name || 'Farmer';

                    return (
                      <tr key={r._id}>
                        <td style={{ padding: "14px", borderBottom: `1px solid ${COLORS.border}` }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>
                            {postTitle}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textMuted, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                            "{r.post?.content || 'Content removed or unavailable'}"
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 700, marginTop: 4 }}>
                            Author: {postAuthor}
                          </div>
                        </td>

                        <td style={{ padding: "14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: COLORS.text }}>{r.reportedBy?.name || 'Anonymous Farmer'}</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{r.reportedBy?.email}</div>
                        </td>

                        <td style={{ padding: "14px", borderBottom: `1px solid ${COLORS.border}` }}>
                          <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                            {r.reason}
                          </span>
                          {r.details && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{r.details}</div>}
                        </td>

                        <td style={{ padding: "14px", borderBottom: `1px solid ${COLORS.border}` }}>
                          <span style={{
                            background: r.status === 'resolved' ? '#DCFCE7' : r.status === 'reviewed' ? '#FEF9C3' : '#FEE2E2',
                            color: r.status === 'resolved' ? '#16A34A' : r.status === 'reviewed' ? '#A16207' : '#DC2626',
                            padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'capitalize'
                          }}>
                            {r.status}
                          </span>
                        </td>

                        {/* Admin Action Buttons (Delete Post, Resolve, Review) */}
                        <td style={{ padding: "14px", borderBottom: `1px solid ${COLORS.border}` }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {/* Direct Delete Post Button */}
                            {r.post && (
                              <button
                                type="button"
                                onClick={() => setDeleteReportModal({ isOpen: true, report: r, isDeleting: false })}
                                style={{
                                  padding: '5px 10px',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                🗑️ Delete Post
                              </button>
                            )}

                            {r.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReport(r._id, 'resolved')}
                                  style={{ padding: '5px 10px', background: COLORS.primary, color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  ✓ Resolve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReport(r._id, 'reviewed')}
                                  style={{ padding: '5px 10px', background: '#F3F4F6', color: COLORS.text, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Review
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ─── TAB 3: VERIFICATIONS ─── */}
      {activeTab === 'verifications' && (
        <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24, overflowX: 'auto' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Farmer KYC & Land Verification Queue</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                Inspect land ownership (7/12 records, RoR) and Kisan Credit Card documents to issue official verified farmer credentials.
              </p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, background: '#E8F5E9', color: '#1B5E20', padding: '6px 12px', borderRadius: 12 }}>
              {verifications.filter(v => v.verificationStatus === 'pending').length} Pending Audits
            </span>
          </div>

          {verifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: COLORS.textMuted }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📜</div>
              <p style={{ margin: 0, fontWeight: 600 }}>No verification requests submitted yet.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
              <thead>
                <tr>
                  {["Farmer", "Land & Crops", "Proof Document", "Submitted", "Status", "Audit Decision"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", fontSize: 11, fontWeight: 800,
                      color: COLORS.textMuted, letterSpacing: "0.06em",
                      textTransform: "uppercase", padding: "0 10px 12px",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => {
                  const docUrl = v.verificationDetails?.documentUrl;
                  const fullDocUrl = docUrl?.startsWith('http') ? docUrl : `http://localhost:5000${docUrl}`;
                  return (
                    <tr key={v._id}>
                      <td style={{ padding: "14px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{v.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{v.phone || v.email}</div>
                        <div style={{ fontSize: 11, color: '#78909C' }}>📍 {v.location || 'India'}</div>
                      </td>
                      <td style={{ padding: "14px 10px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                        <div><strong>Farm Size:</strong> {v.verificationDetails?.farmSize || 'Not specified'} Acres</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}><strong>Primary:</strong> {v.verificationDetails?.primaryCrop || 'General Agriculture'}</div>
                      </td>
                      <td style={{ padding: "14px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {docUrl ? (
                          <a
                            href={fullDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#F0FDF4',
                              color: '#15803D',
                              border: '1px solid #BBF7D0',
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            📄 View Land Proof ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>No file attached</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 10px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.textMuted }}>
                        {v.verificationDetails?.submittedAt
                          ? new Date(v.verificationDetails.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Recent'}
                      </td>
                      <td style={{ padding: "14px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 800,
                          background: v.verificationStatus === 'verified' ? '#DCFCE7' : v.verificationStatus === 'pending' ? '#FEF3C7' : '#FEE2E2',
                          color: v.verificationStatus === 'verified' ? '#15803D' : v.verificationStatus === 'pending' ? '#B45309' : '#DC2626',
                        }}>
                          {v.verificationStatus?.toUpperCase() || 'PENDING'}
                        </span>
                        {v.verificationDetails?.rejectionReason && (
                          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                            Reason: {v.verificationDetails.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {v.verificationStatus === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleReviewVerification(v._id, 'verified')}
                              style={{
                                background: '#16A34A',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = window.prompt('Enter rejection reason (e.g. Incomplete document, mismatch in survey number):');
                                if (reason !== null) {
                                  handleReviewVerification(v._id, 'rejected', reason);
                                }
                              }}
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : v.verificationStatus === 'verified' ? (
                          <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
                            ✅ Badge Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReviewVerification(v._id, 'verified')}
                            style={{
                              background: '#F3F4F6',
                              color: '#374151',
                              border: '1px solid #D1D5DB',
                              padding: '5px 10px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Re-approve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── TAB 4: MANAGE EXPERTS ─── */}
      {activeTab === 'experts' && (
        <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24, overflowX: 'auto' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                Certified Agronomist & Expert Directory
              </h3>
              <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 13 }}>
                Review agronomic degree certifications, toggle availability, and approve new expert consultation applications.
              </p>
            </div>
            <button
              onClick={fetchAdminData}
              style={{ background: 'none', border: `1px solid ${COLORS.border}`, padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              🔄 Refresh
            </button>
          </div>

          {expertsList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔬</div>
              <div style={{ fontWeight: 700 }}>No expert accounts registered yet</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 12 }}>
                  <th style={{ padding: "12px 16px" }}>AGRONOMIST</th>
                  <th style={{ padding: "12px 16px" }}>SPECIALIZATIONS</th>
                  <th style={{ padding: "12px 16px" }}>EXP & METRICS</th>
                  <th style={{ padding: "12px 16px" }}>FEE</th>
                  <th style={{ padding: "12px 16px" }}>CREDENTIALS</th>
                  <th style={{ padding: "12px 16px" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {expertsList.map((exp) => {
                  const specs = exp.specializations?.length ? exp.specializations : exp.expertise || [];
                  const isBusy = actionLoading[exp._id];

                  return (
                    <tr key={exp._id} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img
                            src={exp.avatar || exp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.name}`}
                            alt={exp.name}
                            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: COLORS.text }}>{exp.name}</div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{exp.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
                          {specs.slice(0, 2).map((s, i) => (
                            <span key={i} style={{ background: '#E8F5E9', color: '#1B5E20', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: COLORS.text }}>
                          {exp.experienceYears || exp.yearsExperience || 10} Yrs Exp
                        </div>
                        <div style={{ fontSize: 12, color: '#D97706', fontWeight: 800 }}>
                          ★ {exp.rating || 4.9} • {exp.totalConsultations || 0} Consults
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", fontWeight: 800, color: '#1B5E20' }}>
                        ₹{exp.consultationFee || 99}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {exp.credentialDocUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCredential({ name: exp.name, url: exp.credentialDocUrl })}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: '1px solid #93C5FD',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            📄 View Degree
                          </button>
                        ) : (
                          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Self-attested</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 800,
                            background:
                              exp.verificationStatus === 'verified'
                                ? '#DCFCE7'
                                : exp.verificationStatus === 'rejected'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                            color:
                              exp.verificationStatus === 'verified'
                                ? '#15803D'
                                : exp.verificationStatus === 'rejected'
                                ? '#B91C1C'
                                : '#B45309',
                          }}
                        >
                          {(exp.verificationStatus || 'verified').toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                          {exp.verificationStatus !== 'verified' && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleReviewExpert(exp._id, 'verified')}
                              style={{
                                background: '#16A34A',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✓ Approve
                            </button>
                          )}

                          {exp.verificationStatus !== 'rejected' && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleReviewExpert(exp._id, 'rejected')}
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Reject
                            </button>
                          )}

                          <button
                            disabled={isBusy}
                            onClick={() => handleToggleExpertAvailability(exp._id, exp.availableForConsultation)}
                            style={{
                              background: exp.availableForConsultation ? '#F1F5F9' : '#DCFCE7',
                              color: exp.availableForConsultation ? '#475569' : '#15803D',
                              border: '1px solid #CBD5E1',
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {exp.availableForConsultation ? 'Pause Listing' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREDENTIAL DOCUMENT PREVIEW MODAL */}
      {selectedCredential && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 640,
              width: '100%',
              padding: 24,
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                Degree / Certification Document — {selectedCredential.name}
              </h3>
              <button
                onClick={() => setSelectedCredential(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: COLORS.textMuted }}
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src={selectedCredential.url}
                alt="Expert Degree / Certification Document"
                style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 12, border: `1px solid ${COLORS.border}` }}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setSelectedCredential(null)}
                style={{ padding: '8px 20px', borderRadius: 10, background: COLORS.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE DETAILS MODAL */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 30, 10, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 22,
              maxWidth: 520,
              width: '100%',
              padding: 26,
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: (planBadge[selectedUser.role] || planBadge.default).bg,
                  color: (planBadge[selectedUser.role] || planBadge.default).color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900,
                }}>
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                    {selectedUser.name}
                  </h3>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {selectedUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Phone Number</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginTop: 3 }}>
                  {selectedUser.phone || 'Not provided'}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Location</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginTop: 3 }}>
                  📍 {selectedUser.city || 'District'} {selectedUser.state ? `, ${selectedUser.state}` : ''}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Account Role</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginTop: 3, textTransform: 'capitalize' }}>
                  {selectedUser.role || 'farmer'}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>KYC Verification</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedUser.verificationStatus === 'verified' || selectedUser.isVerified ? '#16A34A' : '#D97706', marginTop: 3 }}>
                  {selectedUser.verificationStatus === 'verified' || selectedUser.isVerified ? '✓ Official Verified' : 'Standard Farmer'}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Account Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedUser.isActive !== false ? '#16A34A' : '#DC2626', marginTop: 3 }}>
                  {selectedUser.isActive !== false ? '● Active' : '○ Suspended'}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Member Since</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginTop: 3 }}>
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {selectedUser.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(selectedUser);
                    setSelectedUser(prev => prev ? ({ ...prev, isActive: prev.isActive === false ? true : false }) : null);
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: selectedUser.isActive !== false ? '#FEE2E2' : '#DCFCE7',
                    color: selectedUser.isActive !== false ? '#DC2626' : '#15803D',
                  }}
                >
                  {selectedUser.isActive !== false ? 'Deactivate Farmer' : 'Reactivate Farmer'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{ padding: '9px 18px', borderRadius: 10, background: COLORS.primary, color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION POST DELETE CONFIRMATION MODAL */}
      {deleteReportModal.isOpen && deleteReportModal.report && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 30, 10, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 22,
              maxWidth: 480,
              width: '100%',
              padding: 26,
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#DC2626' }}>
                🗑️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                  Delete Reported Post
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: COLORS.textMuted }}>
                  Administrative Content Enforcement
                </p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.5, margin: '0 0 14px' }}>
              Delete post by <strong>{deleteReportModal.report.post?.author?.name || 'Farmer'}</strong>? This will remove the post, comments, and resolve the report.
            </p>

            <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #DC2626', marginBottom: 20, fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>
              Reason: <strong>{deleteReportModal.report.reason}</strong>
              {deleteReportModal.report.details && ` — "${deleteReportModal.report.details}"`}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={deleteReportModal.isDeleting}
                onClick={() => setDeleteReportModal({ isOpen: false, report: null, isDeleting: false })}
                style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${COLORS.border}`, background: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteReportModal.isDeleting}
                onClick={handleConfirmDeleteReportedPost}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: deleteReportModal.isDeleting ? 'not-allowed' : 'pointer',
                  opacity: deleteReportModal.isDeleting ? 0.7 : 1,
                }}
              >
                {deleteReportModal.isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminPage;