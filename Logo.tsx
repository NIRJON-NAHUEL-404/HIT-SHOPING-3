import React, { useContext } from 'react';
import { AppContext } from '../App';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className = "", variant = 'dark' }) => {
  const context = useContext(AppContext);
  const logoUrl = context?.state?.siteSettings?.logoUrl;
  const logoName = context?.state?.siteSettings?.logoName || 'Royal HIT SHOPING';

  if (logoUrl) {
    return (
      <div className={`flex items-center select-none group cursor-pointer ${className}`}>
        <img src={logoUrl} alt={logoName} className="h-10 object-contain" />
      </div>
    );
  }

  const nameParts = logoName.split(' ');

  return (
    <div className={`flex items-center select-none group cursor-pointer ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Intense Cyan/Red/Yellow Glow Effect - Enhanced */}
        <div className="absolute -inset-4 bg-cyan-400 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition duration-500 animate-pulse"></div>
        <div className="absolute -inset-4 bg-red-600 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition duration-500"></div>
        <div className="absolute -inset-2 bg-yellow-500 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-500"></div>
        <div className="absolute -inset-6 bg-cyan-500/20 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
        
        <div className="relative flex items-center justify-center p-1.5 bg-black/60 rounded-lg border border-cyan-500/40 group-hover:border-cyan-400/80 transition-colors backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform group-hover:scale-110 transition-transform duration-500"
          >
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11"
              stroke="url(#logoGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <rect
              x="4"
              y="9"
              width="16"
              height="12"
              rx="2"
              fill="url(#logoGrad)"
            />
            <path
              d="M9 13L12 16L15 13"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      
      <div className="ml-2.5 flex flex-col justify-center">
        <div className="flex items-center space-x-1.5 leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {nameParts.map((part, index) => (
            <span 
              key={index}
              className={`text-xl font-black tracking-tighter uppercase ${
                index === 1 
                  ? "bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-red-500 to-yellow-500 bg-[length:200%_auto] animate-gradient-x drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]" 
                  : `drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`
              }`}
            >
              {part}
            </span>
          ))}
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-transparent rounded-full mt-1 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
      </div>
    </div>
  );
};

export default Logo;