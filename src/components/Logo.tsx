import React from 'react';
import { Building2 } from 'lucide-react';
import { BrandConfig } from '../types';

interface LogoProps {
  brandConfig?: BrandConfig;
  className?: string;
  iconClassName?: string;
}

export default function Logo({ brandConfig, className = "h-8 w-8", iconClassName = "h-5 w-5" }: LogoProps) {
  if (brandConfig?.logoUrl) {
    return (
      <img
        src={brandConfig.logoUrl}
        alt={brandConfig.orgName || 'Shai Olamot Logo'}
        className={`${className} object-contain rounded-xl`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If the custom URL fails, fall back to our beautiful SVG
          (e.target as HTMLElement).style.display = 'none';
          const sibling = (e.target as HTMLElement).nextElementSibling;
          if (sibling) {
            (sibling as HTMLElement).style.display = 'block';
          }
        }}
      />
    );
  }

  // Beautiful fallback: Golden crown/event canopy with luxury royal blue gradient circle
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-800 rounded-xl shadow-inner text-white ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${iconClassName} text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}
      >
        {/* Canopy / Crown shape representing "Olamot" / Halls */}
        <path d="M2 22 L22 22" strokeWidth="2.5" />
        <path d="M4 22 V14 C4 11 6 9 12 9 C18 9 20 11 20 14 V22" strokeWidth="1.5" />
        <path d="M12 9 C12 6 10 4 12 2 C14 4 12 6 12 9Z" fill="currentColor" stroke="none" />
        <circle cx="6" cy="14" r="1.5" fill="currentColor" />
        <circle cx="12" cy="13" r="1.5" fill="currentColor" />
        <circle cx="18" cy="14" r="1.5" fill="currentColor" />
        {/* Subtle geometric lines */}
        <path d="M12 9 V22" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}
