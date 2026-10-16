/** Cena espacial decorativa do rodapé do menu (astronauta sobre um planeta). */
export function SidebarSpace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 330" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="ss-p1" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#9C7BFF" />
          <stop offset="1" stopColor="#4A2FB0" />
        </radialGradient>
        <radialGradient id="ss-p2" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFB27A" />
          <stop offset="1" stopColor="#D9572E" />
        </radialGradient>
        <radialGradient id="ss-p3" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#7C8CFF" />
          <stop offset="1" stopColor="#3B3FB0" />
        </radialGradient>
        <linearGradient id="ss-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F28A4A" />
          <stop offset=".5" stopColor="#C2417A" />
          <stop offset="1" stopColor="#5A2A9E" />
        </linearGradient>
        <linearGradient id="ss-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7A4FF" />
          <stop offset="1" stopColor="#6C4BD8" />
        </linearGradient>
        <linearGradient id="ss-visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A2370" />
          <stop offset="1" stopColor="#0E0B33" />
        </linearGradient>
      </defs>

      <g fill="#fff">
        <path d="M150 40l2.4 6.2 6.2 2.4-6.2 2.4-2.4 6.2-2.4-6.2-6.2-2.4 6.2-2.4z" opacity=".9" />
        <path d="M76 120l3 7.6 7.6 3-7.6 3-3 7.6-3-7.6-7.6-3 7.6-3z" fill="#FFD27A" />
        <path d="M150 150l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".85" />
        <path d="M120 200l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" opacity=".7" />
        <circle cx="96" cy="60" r="1.5" opacity=".7" />
        <circle cx="180" cy="110" r="1.4" opacity=".6" />
        <circle cx="40" cy="190" r="1.3" opacity=".6" />
        <circle cx="110" cy="96" r="1.2" opacity=".5" />
      </g>

      <circle cx="10" cy="40" r="44" fill="url(#ss-p1)" />
      <path d="M-30 30c20 8 50 8 80-2" stroke="#C9B6FF" strokeWidth="6" fill="none" opacity=".35" />

      <g transform="rotate(-14 140 98)">
        <ellipse cx="140" cy="98" rx="34" ry="8" fill="none" stroke="#4FC3E8" strokeWidth="4" opacity=".9" />
        <circle cx="140" cy="98" r="16" fill="url(#ss-p2)" />
        <path d="M106 98a34 8 0 0 0 68 0" fill="none" stroke="#4FC3E8" strokeWidth="4" />
      </g>

      <circle cx="16" cy="170" r="28" fill="url(#ss-p3)" />
      <circle cx="166" cy="200" r="9" fill="#E07A5F" opacity=".9" />

      <path d="M-10 330V270c40-26 90-32 140-24 30 5 55 16 80 30v54z" fill="url(#ss-ground)" />
      <ellipse cx="60" cy="290" rx="10" ry="4" fill="#8E2F6E" opacity=".5" />
      <ellipse cx="150" cy="300" rx="14" ry="5" fill="#5A2A9E" opacity=".5" />

      <g transform="translate(74 186)">
        <rect x="6" y="38" width="54" height="50" rx="16" fill="#4A2FB0" />
        <rect x="12" y="44" width="44" height="54" rx="18" fill="url(#ss-suit)" />
        <rect x="18" y="84" width="16" height="24" rx="8" fill="url(#ss-suit)" />
        <rect x="36" y="84" width="16" height="24" rx="8" fill="url(#ss-suit)" />
        <circle cx="34" cy="28" r="28" fill="#EDE8FF" />
        <ellipse cx="36" cy="30" rx="20" ry="17" fill="url(#ss-visor)" />
        <path d="M24 22c3-6 9-9 16-8" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".75" />
        <rect x="24" y="58" width="20" height="14" rx="4" fill="#2B1F7A" />
        <circle cx="30" cy="65" r="2.2" fill="#00D2C1" />
        <circle cx="37" cy="65" r="2.2" fill="#FFB547" />
      </g>
    </svg>
  );
}
