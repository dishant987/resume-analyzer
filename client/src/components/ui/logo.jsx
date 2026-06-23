import React from 'react'

export default function Logo({ className = "h-8 w-8", ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32" 
      fill="none" 
      className={className} 
      {...props}
    >
      <defs>
        <linearGradient id="page-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" /> {/* Google/MNC Blue */}
          <stop offset="100%" stopColor="#4F46E5" /> {/* Corporate Indigo */}
        </linearGradient>
        <linearGradient id="lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" /> {/* Emerald */}
          <stop offset="100%" stopColor="#059669" /> {/* Deep Emerald */}
        </linearGradient>
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>
      
      {/* Base Page (Document) */}
      <path 
        d="M6 3h13l7 7v17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" 
        fill="url(#page-grad)" 
        filter="url(#logo-shadow)" 
      />
      {/* Folded corner */}
      <path d="M19 3v7h7L19 3z" fill="#ffffff" opacity="0.35" />
      
      {/* Document Content Lines */}
      <rect x="8" y="13" width="9" height="2" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="8" y="17" width="11" height="2" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="8" y="21" width="7" height="2" rx="1" fill="#ffffff" opacity="0.8" />
      
      {/* Overlapping Magnifying Glass/Lens */}
      <circle 
        cx="21" 
        cy="21" 
        r="5.5" 
        fill="url(#lens-grad)" 
        stroke="#ffffff" 
        strokeWidth="1.5" 
        filter="url(#logo-shadow)" 
      />
      <circle cx="21" cy="21" r="3" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
      <line 
        x1="25" 
        y1="25" 
        x2="28" 
        y2="28" 
        stroke="#ffffff" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
      />
    </svg>
  )
}
