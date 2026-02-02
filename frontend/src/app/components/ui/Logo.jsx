import React from 'react';

export const Logo = ({ className = "", width = 200, height = 54 }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 520 140" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    role="img" 
    aria-label="AtlasOps logo"
    className={className}
  >
    <defs>
      <style>
        {`
          :root { --navy:#0B1F3B; --cyan:#06B6D4; --muted:#64748B; }
          .navy { fill: var(--navy); }
          .cyan { fill: var(--cyan); }
          .muted { fill: var(--muted); }
          .word { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif; }
        `}
      </style>
      <linearGradient id="gCyan" x1="34" y1="26" x2="96" y2="106" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22D3EE"/>
        <stop offset="1" stopColor="#06B6D4"/>
      </linearGradient>
    </defs>

    <g transform="translate(18 18)">
      <path d="M28 0h44c15.464 0 28 12.536 28 28v44c0 15.464-12.536 28-28 28H28C12.536 100 0 87.464 0 72V28C0 12.536 12.536 0 28 0Z" fill="#F1F6FF"/>
      <path d="M28 8h44c11.046 0 20 8.954 20 20v44c0 11.046-8.954 20-20 20H28C16.954 92 8 83.046 8 72V28C8 16.954 16.954 8 28 8Z" fill="white"/>

      <path className="navy" fill="#0B1F3B" d="M50 22c1.7 0 3.2.9 4 2.3l25.2 43.6c1.6 2.8-.4 6.1-3.6 6.1h-7.4c-1.7 0-3.2-.9-4-2.3L50 46.8 35.8 71.7c-.8 1.4-2.3 2.3-4 2.3h-7.4c-3.2 0-5.2-3.3-3.6-6.1L46 24.3c.8-1.4 2.3-2.3 4-2.3Z"/>
      <path d="M34.5 67.5c4.7-7.9 9.6-16.3 14.7-25 1-1.8 3.6-1.8 4.6 0l3.7 6.4c.6 1 .6 2.2 0 3.2-3.1 5.2-6.2 10.3-9.1 15.2-.7 1.2-2 1.9-3.4 1.9H38c-2.7 0-4.8-2.9-3.5-5.1Z" fill="url(#gCyan)"/>
      <circle cx="62.5" cy="58.5" r="4.5" fill="#06B6D4"/>
    </g>

    <g className="word" transform="translate(140 46)">
      <text x="0" y="26" fontSize="34" fontWeight="800" className="navy" fill="#0B1F3B">Atlas</text>
      <text x="92" y="26" fontSize="34" fontWeight="800" fill="#06B6D4">Ops</text>

      <text x="0" y="56" fontSize="14" fontWeight="600" className="muted" fill="#64748B" letterSpacing="0.3">
        Control inteligente de flota y viajes
      </text>
    </g>
  </svg>
);
