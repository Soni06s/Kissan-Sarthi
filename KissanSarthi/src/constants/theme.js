export const COLORS = {
  // ── Brand Forest & Emerald Scale ───────────────────────────────────────
  primary: "#15803D",        // Crisp modern emerald/forest
  primaryDark: "#14532D",    // Deep woodland green for headings & emphasis
  primaryLight: "#22C55E",   // Radiant spring green for accents & charts
  primaryBg: "#F0FDF4",      // Soft mint surface tint
  primaryBorder: "rgba(22, 163, 74, 0.2)",
  lightGreen: "#BBF7D0",
  forest: "#0F291E",

  // ── Warm Amber / Gold Scale (Kissan Pro, Ratings, Monetization) ────────
  accent: "#F59E0B",
  accentDark: "#B45309",
  accentLight: "#FEF3C7",
  gold: "#D97706",
  goldBg: "#FFFBEB",
  goldBorder: "#FDE68A",

  // ── Earth & Organic Accents ───────────────────────────────────────────
  brown: "#4E342E",
  brownLight: "#8D6E63",

  // ── Core App Canvas & Surface ─────────────────────────────────────────
  bg: "#F8FAF8",             // Modern crisp off-white with subtle organic tint
  cardBg: "#FFFFFF",
  surfaceAlt: "#F1F5F2",
  white: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // ── Typography Colors ──────────────────────────────────────────────────
  text: "#0F172A",           // Slate 900 for high-contrast, premium legibility
  textMuted: "#64748B",      // Slate 500 for secondary descriptions
  textSubtle: "#94A3B8",     // Slate 400

  // ── Semantic Feedback ──────────────────────────────────────────────────
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  orange: "#EA580C",
  orangeBg: "#FFF7ED",
  orangeBorder: "#FFEDD5",
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
  info: "#2563EB",
};

export const SHADOWS = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
  md: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
  lg: "0 12px 36px -4px rgba(20, 83, 45, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
  xl: "0 24px 60px -8px rgba(15, 23, 42, 0.12)",
  glow: "0 0 25px rgba(34, 197, 94, 0.25)",
  glowAmber: "0 0 25px rgba(245, 158, 11, 0.3)",
};

export const GRADIENTS = {
  primary: "linear-gradient(135deg, #15803D 0%, #14532D 100%)",
  primaryHover: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
  pro: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  proShimmer: "linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #D97706 100%)",
  surface: "linear-gradient(180deg, #FFFFFF 0%, #F8FAF8 100%)",
  hero: "linear-gradient(135deg, #0F291E 0%, #1B4332 50%, #2D6A4F 100%)",
  softMint: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
};

export const FONTS = {
  sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  display: "'Fraunces', 'Plus Jakarta Sans', Georgia, serif",
};

export const PAGES = {
  DASHBOARD: "dashboard", WEATHER: "weather", CROP: "crop",
  MARKETPLACE: "marketplace",
  EXPERTS: "experts", PRICING: "pricing",
  MARKET: "market", FERTILIZER: "fertilizer", SCHEMES: "schemes",
  COMMUNITY: "community", ADMIN: "admin",
};

export const NAV_ITEMS = [
  { id: PAGES.DASHBOARD, label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { id: PAGES.MARKETPLACE, label: "Marketplace", icon: "cart", path: "/marketplace" },
  { id: PAGES.EXPERTS, label: "Agri Experts", icon: "user", path: "/experts" },
  { id: PAGES.PRICING, label: "Kissan Pro 💎", icon: "badgeCheck", path: "/pricing" },
  { id: PAGES.CROP, label: "Crop Advisor", icon: "crop", path: "/crop-advisor" },
  { id: PAGES.WEATHER, label: "Weather", icon: "weather", path: "/weather" },
  { id: PAGES.MARKET, label: "Market Prices", icon: "market", path: "/market-prices" },
  { id: PAGES.FERTILIZER, label: "Fertilizer", icon: "fertilizer", path: "/fertilizer" },
  { id: PAGES.SCHEMES, label: "Govt Schemes", icon: "badgeCheck", path: "/schemes" },
  { id: PAGES.COMMUNITY, label: "Community", icon: "community", path: "/community" },
  { id: PAGES.ADMIN, label: "Admin", icon: "admin", path: "/admin" },
];