import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  lightText?: boolean;
  language?: 'ar' | 'en';
}

/**
 * Official Hadramout Hyper Logo Component
 * Recreates the authentic circular badge with Shibam mud-brick towers,
 * fluid wave shopping cart with arrow, and strictly localized branding.
 */
export const HadramoutLogo: React.FC<LogoProps> = ({
  className = '',
  size = 48,
  variant = 'compact',
  lightText = false,
  language = 'ar',
}) => {
  // Pure Icon with Shibam Towers and Cart Wave
  const renderIcon = (dimension: number) => (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id="shibamGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C99757" />
          <stop offset="50%" stopColor="#B37D3E" />
          <stop offset="100%" stopColor="#8A5826" />
        </linearGradient>
        <linearGradient id="waveGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0E8A5E" />
        </linearGradient>
        <linearGradient id="waveNavy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0B253A" />
        </linearGradient>
      </defs>

      {/* Outer White / Cream Circle */}
      <circle cx="100" cy="100" r="96" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />

      {/* Shibam Mud-brick Clay Towers inside the cart */}
      <g id="shibam-palaces">
        {/* Left tower */}
        <path
          d="M62 108 V72 H76 V64 H88 V108 Z"
          fill="url(#shibamGold)"
        />
        {/* Left tower windows */}
        <rect x="66" y="76" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="71" y="76" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="66" y="84" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="71" y="84" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="66" y="92" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="71" y="92" width="3" height="4" fill="#FFFFFF" rx="0.5" />

        {/* Center high palace */}
        <path
          d="M86 108 V54 H114 V62 H124 V108 Z"
          fill="url(#shibamGold)"
        />
        {/* Center palace windows */}
        <rect x="91" y="58" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="98" y="58" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="105" y="58" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="91" y="67" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="98" y="67" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="105" y="67" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="91" y="76" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="98" y="76" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="105" y="76" width="3.5" height="4.5" fill="#FFFFFF" rx="0.5" />
        <rect x="94" y="87" width="12" height="15" fill="#FFFFFF" rx="1.5" />

        {/* Right tower */}
        <path
          d="M122 108 V68 H138 V78 H146 V108 Z"
          fill="url(#shibamGold)"
        />
        <rect x="126" y="72" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="132" y="72" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="126" y="80" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="132" y="80" width="3" height="4" fill="#FFFFFF" rx="0.5" />
        <rect x="139" y="82" width="3" height="4" fill="#FFFFFF" rx="0.5" />
      </g>

      {/* Green Shopping Cart Wave & Handle */}
      <path
        d="M48 74 C48 68 54 64 60 64 H64 C70 64 74 68 74 74 V76 C74 84 76 96 82 104 C94 118 126 120 148 102 C154 97 155 88 148 83 C140 78 122 82 110 92 C96 102 86 98 84 88 L80 68 C78 56 68 50 56 50 H46 C38 50 32 56 32 64 C32 70 36 74 42 74 H48 Z"
        fill="url(#waveGreen)"
      />

      {/* Navy Blue Cart Wave Ending in Upward Dynamic Arrow */}
      <path
        d="M80 114 C96 128 128 130 150 110 L156 104 L154 118 L168 100 L152 86 L152 98 C132 114 104 112 88 98 C82 93 74 97 74 104 C74 108 76 112 80 114 Z"
        fill="url(#waveNavy)"
      />

      {/* Inner Wave Curve */}
      <path
        d="M96 128 C116 138 142 134 160 118 L166 122 L172 96 L148 106 L154 110 C138 122 116 126 98 116 C92 113 86 117 86 123 C86 126 90 128 96 128 Z"
        fill="url(#waveNavy)"
      />

      {/* Cart Front Wheel */}
      <circle cx="86" cy="138" r="9" fill="url(#waveGreen)" />
    </svg>
  );

  // 1. Compact variant for Header (Icon + Name)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        {renderIcon(typeof size === 'number' ? size : 40)}
        <div className="flex flex-col text-right leading-none">
          <span
            className={`font-black tracking-tight text-sm sm:text-base ${
              lightText ? 'text-white' : 'text-gray-900'
            }`}
          >
            {language === 'ar' ? 'حضرموت هايبر' : 'Hadramout Hyper'}
          </span>
          {language === 'en' ? (
            <span
              className={`text-[9px] sm:text-[10px] font-bold tracking-wider font-sans mt-0.5 ${
                lightText ? 'text-emerald-200' : 'text-[#0E8A5E]'
              }`}
            >
              HADRAMOUT HYPER
            </span>
          ) : (
            <span
              className={`text-[9px] sm:text-[10px] font-bold tracking-wider mt-0.5 ${
                lightText ? 'text-emerald-200' : 'text-[#0E8A5E]'
              }`}
            >
              الهايبرماركت الحضرمي الأول
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. Pure Icon
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIcon(typeof size === 'number' ? size : 44)}
      </div>
    );
  }

  // 3. Full Circular Badge
  return (
    <div
      className={`relative rounded-full bg-white shadow-xl p-3 flex flex-col items-center justify-center text-center border-4 border-amber-100/60 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Icon */}
      <div className="w-[52%] h-[52%] flex items-center justify-center">
        {renderIcon(110)}
      </div>

      {/* Title */}
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className="text-[#C99757] text-xs">❖</span>
        <h2 className="text-[#0B253A] font-black text-sm sm:text-base tracking-tight leading-none">
          {language === 'ar' ? (
            <>حَضْرَمَوْت <span className="text-[#0E8A5E]">هايبر</span></>
          ) : (
            <>HADRAMOUT <span className="text-[#0E8A5E]">HYPER</span></>
          )}
        </h2>
        <span className="text-[#C99757] text-xs">❖</span>
      </div>

      {/* Subtitle if English */}
      {language === 'en' && (
        <span className="text-[#0B253A] text-[9px] sm:text-[10px] font-black tracking-widest uppercase mt-0.5">
          QUALITY & FRESHNESS
        </span>
      )}

      {/* Slogan Pill */}
      <div className="mt-1 bg-[#B37D3E] text-white text-[7px] sm:text-[8px] font-bold px-2 py-0.5 rounded-full shadow-xs">
        {language === 'ar' ? 'متعة التسوق السريع والذكي' : 'Fast & Smart Shopping Experience'}
      </div>
    </div>
  );
};
