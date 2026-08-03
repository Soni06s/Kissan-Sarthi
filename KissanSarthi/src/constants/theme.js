export const COLORS = {
  primary: "#2E7D32", primaryLight: "#43A047", primaryDark: "#1B5E20",
  lightGreen: "#A5D6A7", brown: "#4E342E", bg: "#F1F8E9",
  accent: "#FDD835", accentDark: "#F9A825", white: "#ffffff",
  text: "#1A2E1A", textMuted: "#5D7A5D", border: "#C8E6C9",
  cardBg: "#ffffff", red: "#E53935", blue: "#1565C0", orange: "#E65100",
};

export const PAGES = {
  DASHBOARD: "dashboard", WEATHER: "weather", CROP: "crop",
  MARKET: "market", FERTILIZER: "fertilizer", COMMUNITY: "community", ADMIN: "admin",
};

export const NAV_ITEMS = [
  { id: PAGES.DASHBOARD, label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { id: PAGES.WEATHER, label: "Weather", icon: "weather", path: "/weather" },
  { id: PAGES.CROP, label: "Crop Advisor", icon: "crop", path: "/crop-advisor" },
  { id: PAGES.MARKET, label: "Market Prices", icon: "market", path: "/market-prices" },
  { id: PAGES.FERTILIZER, label: "Fertilizer", icon: "fertilizer", path: "/fertilizer" },
  { id: PAGES.COMMUNITY, label: "Community", icon: "community", path: "/community" },
  { id: PAGES.ADMIN, label: "Admin", icon: "admin", path: "/admin" },
];