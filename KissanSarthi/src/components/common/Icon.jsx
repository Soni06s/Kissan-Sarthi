import React from 'react';

export const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    // ─── NAVIGATION & APP INTERFACE ──────────────────────────────────────────
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
    location: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,

    //  ─── CROP ADVISORY ─────────────────────────────────────────────────────
    leafAlt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    chem: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
    rain: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />,

    // ─── FARMING & CROPS ─────────────────────────────────────────────────────
    crop: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    leaf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />,
    drop: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />,
    fertilizer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,

    // ─── MARKET & TRENDS ─────────────────────────────────────────────────────
    market: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    trend: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,

    // ─── PROFESSIONAL WEATHER SYSTEM ─────────────────────────────────────────
    weather: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    sunny: <><circle cx="12" cy="12" r="5" strokeWidth={2} /><path strokeWidth={2} strokeLinecap="round" d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></>,
    pCloudy: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M18.4 12c.4 0 .8.3.8.7v.5a3 3 0 012.7 2.9 3 3 0 01-3 3H7a4 4 0 01-4-4 4 4 0 013.8-4" /><circle cx="12" cy="8" r="4" strokeWidth={2} /><path strokeWidth={2} d="M12 2v2M4.9 4.9L6.3 6.3" /></>,
    hRain: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9" /><path strokeWidth={2} strokeLinecap="round" d="M10 16v4M14 16v4M6 16v2" /></>,
    thunder: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 16.9A4.5 4.5 0 0016.5 8h-1.8A7 7 0 103 14.9" /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M13 22l-3-6h6l-3-6" /></>,
    showers: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M18.4 12a3 3 0 012.7 2.9 3 3 0 01-3 3H7a4 4 0 01-4-4 4 4 0 013.8-4" /><path strokeWidth={2} strokeLinecap="round" d="M8 19v3M12 19v3" /></>,
    mostlySunny: <><circle cx="12" cy="12" r="5" strokeWidth={2} /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M4.9 4.9l1.4 1.4M20 12h2" /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 19.5a3 3 0 003-3h.5a2.5 2.5 0 100-5H18.8A5.5 5.5 0 008.5 14h.3a3 3 0 002.2-.5" /></>,
    sunrise: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 2v8l3-3m-6 0l3 3" /><circle cx="12" cy="16" r="4" strokeWidth={2} /></>,
    sunset: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 10V2l3 3m-6 0l3-3" /><circle cx="12" cy="16" r="4" strokeWidth={2} /></>,
    night: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></>,
    dusk: <><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M22 12a10 10 0 11-20 0" /></>,
    // Wheat: Detailed grain stalk
    wheat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 20s1-5 1-11m0 0C12 7 11 4 11 4m1 5c0-2 1-5 1-5m-1 8l-2-2m2 4l-2-2m2 4l-2-2m2-10l2-2m-2 4l2-2m-2 4l2-2" />,

    // Rice: Curved rice stalk with drooping grains
    rice: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 21c0-10 2-15 12-18m-12 18c0-5 2-8 5-10m0 0l1-1.5m1 2.5l1-1.5m1 2.5l1-1.5m1 2.5l1-1.5" />,

    // Onion: Bulb with layered skin and roots
    onion: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-4 0-7 4-7 9s3 7 7 7 7-2 7-7-3-9-7-9zM10 20l1 2m1-2v2m1-2l-1 2M12 4V2" />,

    // Tomato: Round fruit with a star-shaped calyx
    tomato: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20a7 7 0 100-14 7 7 0 000 14zm0-14l-1-3m1 3l2-2m-2 2l-2-1" />,

    // Potato: Organic oval shape with small "eyes"
    potato: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5c-5 0-8 3-8 7s3 7 8 7 8-3 8-7-3-7-8-7zM8 10h.01M15 14h.01M12 12h.01" />,

    // Mustard: Cross-shaped flower petal typical of oilseeds
    mustard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 7v2m0 6v2M7 12h2m6 0h2" />,

    // Maize (Corn): Cob with kernel grid indicators
    maize: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20c0-5 2-10 2-16m2 16c0-5-2-10-2-16m-3 6l6 2m-6 4l6 2m-6 4l6 2" />,

    // Soybean: Pod with bean indicators
    soybean: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21c-4 0-7-4-7-9s3-9 7-9 7 4 7 9-3 9-7 9zM12 9h.01M12 15h.01" />,

    // Sugarcane: Segmented stalks
    sugarcane: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21V3m8 18V3M8 9h8M8 15h8M8 6h8" />,

    //  ──────── FERTILIZER  ────────────
    beaker: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9l1.18 4.72A4 4 0 0010.06 17h3.88a4 4 0 003.88-3.28L19 9H5z" />,
    flask: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6M10 9h4m-4 3h4m-9 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />,
    scale: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0l-3-9m3 1c1.5-2 3.5-2 5 0m0 0l3-1m-3 1l3 9a5.002 5.002 0 006.001 0l-3-9" />,
    pills: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.5l8-8a4.95 4.95 0 117 7l-8 8a4.95 4.95 0 11-7-7zM7 10l5 5" />,

    // ─── COMMUNITY & AI BOT ──────────────────────────────────────────────────
    community: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    bot: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />,
    admin: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    like: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />,
    comment: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  };

  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke={color}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Renders the matching icon, or a circle fallback if name is undefined */}
      {icons[name] || <circle cx="12" cy="12" r="10" strokeWidth="2" />}
    </svg>
  );
};