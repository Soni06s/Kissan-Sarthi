import React from 'react';

export const Badge = ({ text, color = "#2E7D32" }) => (
  <span style={{ 
    background: color + "18", 
    color, 
    borderRadius: 20, 
    padding: "4px 10px", 
    fontSize: 11, 
    fontWeight: 600, 
    whiteSpace: "nowrap" 
  }}>
    {text}
  </span>
);