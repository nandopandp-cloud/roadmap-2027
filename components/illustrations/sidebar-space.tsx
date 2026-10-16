/** Cena espacial decorativa do rodapé do menu (planetas, estrelas e solo). */
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

      <path d="M-10 330V282c40-22 90-28 140-20 30 5 55 14 80 26v42z" fill="url(#ss-ground)" />
      <ellipse cx="60" cy="290" rx="10" ry="4" fill="#8E2F6E" opacity=".5" />
      <ellipse cx="150" cy="300" rx="14" ry="5" fill="#5A2A9E" opacity=".5" />

    </svg>
  );
}
