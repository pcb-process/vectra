import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ size = "md" }: BrandLogoProps) {
  const dimensions =
    size === "sm" ? "w-8 h-8" : size === "lg" ? "w-11 h-11" : "w-9 h-9 sm:w-10 sm:h-10";

  return (
    <div
      className={`${dimensions} relative flex items-center justify-center bg-[#021407] border border-[#00ff41] shadow-[0_0_12px_rgba(0,255,65,0.35),inset_0_0_8px_rgba(0,255,65,0.2)] shrink-0 group overflow-hidden`}
    >
      {/* Corner tech accents */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-[#00ffd5]" />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-[#00ffd5]" />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4/5 h-4/5"
      >
        <defs>
          <linearGradient id="vectraGradMain" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#80ff9e" />
            <stop offset="50%" stopColor="#00ff41" />
            <stop offset="100%" stopColor="#00ffd5" />
          </linearGradient>
          <linearGradient id="vectraGradDark" x1="20" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00ff41" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00ffd5" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Outer Geometric Hex-Diamond Shield */}
        <polygon
          points="20,3 35,11 35,29 20,37 5,29 5,11"
          fill="url(#vectraGradDark)"
          stroke="url(#vectraGradMain)"
          strokeWidth="1.6"
        />

        {/* Stylized 'V' + Ascending Financial Pulse Bars */}
        <path
          d="M11 14L19.5 29L29 12"
          stroke="url(#vectraGradMain)"
          strokeWidth="3.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Upward Arrowhead on Right Wing of V */}
        <path
          d="M24.5 12H29V16.5"
          stroke="#00ffd5"
          strokeWidth="2.4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Core Glowing Node */}
        <rect
          x="18"
          y="10"
          width="4"
          height="4"
          transform="rotate(45 20 12)"
          fill="#00ffd5"
        />
      </svg>
    </div>
  );
}
