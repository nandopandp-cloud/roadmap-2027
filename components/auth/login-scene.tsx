/**
 * Cenário do painel escuro do login: céu estrelado, planeta, nuvens, trilha de
 * marcos até a bandeira e o foguete subindo. Ilustração decorativa (aria-hidden).
 * Ancorado na base (`xMidYMax slice`): em telas altas o céu cresce para cima.
 * A faixa x 940–1004 fica sob o canto arredondado do painel claro, que sobrepõe o cenário.
 */

const SPARKLES: [number, number, number][] = [
  [800, 153, 9],
  [822, 345, 7],
  [517, 135, 4.5],
  [690, 177, 3.5],
  [863, 230, 3.5],
  [757, 413, 4.5],
  [572, 214, 3],
  [905, 404, 3],
  [655, 268, 2.5],
];

const DOTS: [number, number, number][] = [
  [642, 70, 1.6],
  [815, 90, 1.8],
  [745, 272, 1.5],
  [165, 610, 1.6],
  [630, 478, 1.4],
  [602, 330, 1.2],
  [880, 300, 1.3],
  [712, 444, 1.2],
  [560, 290, 1.1],
  [905, 140, 1.4],
  [470, 40, 1.2],
  [380, 600, 1.1],
  [60, 560, 1.2],
  [250, 640, 1],
  [925, 610, 1.3],
];

function sparkle(x: number, y: number, r: number) {
  const k = r * 0.18;
  return `M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r}Z`;
}

/**
 * `align="end"` (desktop) recorta pela esquerda e mantém a bandeira visível;
 * `align="center"` (celular) mantém o foguete no centro. `id` prefixa os ids
 * internos do SVG, para duas instâncias poderem coexistir na página.
 */
export function LoginScene({ id, align = "center", className }: { id: string; align?: "center" | "end"; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1004 940" preserveAspectRatio={align === "end" ? "xMaxYMax slice" : "xMidYMax slice"} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c0b47" />
          <stop offset=".45" stopColor="#2c1069" />
          <stop offset="1" stopColor="#4a1da6" />
        </linearGradient>
        <radialGradient id={`${id}-glow-hill`} cx="800" cy="560" r="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b4dff" stopOpacity=".55" />
          <stop offset=".55" stopColor="#6a2fe0" stopOpacity=".18" />
          <stop offset="1" stopColor="#6a2fe0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-glow-impact`} cx="360" cy="770" r="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff8a5c" stopOpacity=".55" />
          <stop offset=".5" stopColor="#e0479e" stopOpacity=".18" />
          <stop offset="1" stopColor="#e0479e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-planet`} cx="330" cy="760" r="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9a63ff" />
          <stop offset=".35" stopColor="#6c33dc" />
          <stop offset="1" stopColor="#30127a" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b98cff" stopOpacity=".5" />
          <stop offset=".38" stopColor="#ffb48a" />
          <stop offset=".55" stopColor="#ff7ab8" />
          <stop offset="1" stopColor="#b98cff" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b1fa8" />
          <stop offset="1" stopColor="#261066" />
        </linearGradient>
        <linearGradient id={`${id}-hill-rim`} x1="640" y1="0" x2="1004" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff9d5c" stopOpacity="0" />
          <stop offset=".3" stopColor="#ff9d5c" />
          <stop offset="1" stopColor="#ffc07a" />
        </linearGradient>
        <linearGradient id={`${id}-cloud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a48e0" />
          <stop offset="1" stopColor="#4520a6" />
        </linearGradient>
        <linearGradient id={`${id}-cloud-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b2fc0" />
          <stop offset="1" stopColor="#3a1a8e" />
        </linearGradient>
        <linearGradient id={`${id}-path`} x1="470" y1="0" x2="846" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f7dff" stopOpacity=".2" />
          <stop offset=".25" stopColor="#6a86ff" />
          <stop offset=".6" stopColor="#b77bff" />
          <stop offset="1" stopColor="#ffb07a" />
        </linearGradient>
        <linearGradient id={`${id}-trail`} x1="440" y1="680" x2="170" y2="940" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset=".22" stopColor="#ffb054" />
          <stop offset=".6" stopColor="#ff6aa8" stopOpacity=".55" />
          <stop offset="1" stopColor="#c86bff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-flag`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb25a" />
          <stop offset="1" stopColor="#ff7a2e" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#efe9ff" />
          <stop offset="1" stopColor="#b7a3f2" />
        </linearGradient>
        <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5cff" />
          <stop offset="1" stopColor="#5a2fd0" />
        </linearGradient>
        <radialGradient id={`${id}-window`} cx=".38" cy=".35" r=".7">
          <stop offset="0" stopColor="#7fd0ff" />
          <stop offset=".55" stopColor="#2b78ff" />
          <stop offset="1" stopColor="#1d3fc4" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d1" />
          <stop offset=".35" stopColor="#ffc23d" />
          <stop offset=".75" stopColor="#ff7a2e" stopOpacity=".85" />
          <stop offset="1" stopColor="#ff5a6a" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur-sm`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={`${id}-blur-md`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}-blur-lg`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id={`${id}-planet-clip`}>
          <circle cx="330" cy="1720" r="960" />
        </clipPath>
      </defs>

      {/* Céu */}
      <rect width="1004" height="940" fill={`url(#${id}-sky)`} />
      <rect width="1004" height="940" fill={`url(#${id}-glow-hill)`} />
      <rect width="1004" height="940" fill={`url(#${id}-glow-impact)`} />

      {/* Estrelas */}
      <g fill="#fff">
        {DOTS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={0.55 + (i % 3) * 0.15} />
        ))}
        {SPARKLES.map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r * 1.6} fill="#c9b5ff" opacity=".25" filter={`url(#${id}-blur-sm)`} />
            <path d={sparkle(x, y, r)} opacity={r > 6 ? 1 : 0.85} />
          </g>
        ))}
      </g>

      {/* Nuvens ao fundo */}
      <g fill={`url(#${id}-cloud-back)`} opacity=".85">
        <path d="M-20,760 C-10,700 40,672 92,684 C112,640 176,628 214,664 C252,652 292,676 296,716 C330,724 342,762 318,790 L-20,800Z" />
        <path d="M640,800 C646,752 690,728 732,742 C756,700 820,694 852,732 C884,716 930,734 960,760 C990,744 1004,760 1004,780 L1004,830 L640,830Z" />
      </g>

      {/* Colina com a bandeira */}
      <path d="M470,800 C560,700 680,566 800,524 C860,506 905,512 940,526 C966,536 988,548 1004,560 L1004,940 L470,940Z" fill={`url(#${id}-hill)`} />
      <path d="M640,594 C700,556 752,534 800,524 C860,506 905,512 940,526 C966,536 988,548 1004,560" fill="none" stroke={`url(#${id}-hill-rim)`} strokeWidth="10" filter={`url(#${id}-blur-md)`} />
      <path d="M640,594 C700,556 752,534 800,524 C860,506 905,512 940,526 C966,536 988,548 1004,560" fill="none" stroke={`url(#${id}-hill-rim)`} strokeWidth="3" strokeLinecap="round" />

      {/* Nuvens à frente */}
      <g fill={`url(#${id}-cloud)`}>
        <path d="M-30,820 C-26,770 14,742 60,752 C78,712 136,700 170,732 C206,716 248,738 252,776 C282,782 296,812 280,836 L-30,850Z" />
        <path d="M676,860 C680,816 716,794 754,804 C770,766 828,758 858,790 C892,774 934,794 944,822 C970,806 1004,816 1004,840 L1004,884 L676,884Z" />
      </g>

      {/* Trilha de marcos */}
      <path d="M470,748 C520,722 560,692 600,656 S700,580 740,556 S800,522 846,513" fill="none" stroke={`url(#${id}-path)`} strokeWidth="10" opacity=".55" filter={`url(#${id}-blur-sm)`} />
      <path d="M470,748 C520,722 560,692 600,656 S700,580 740,556 S800,522 846,513" fill="none" stroke={`url(#${id}-path)`} strokeWidth="3.5" strokeLinecap="round" />
      <g fill="#2a1070" strokeWidth="4.5">
        <circle cx="490" cy="736" r="7" stroke="#4f7dff" opacity=".7" />
        <circle cx="547" cy="698" r="15" stroke="#6b8cff" opacity=".6" filter={`url(#${id}-blur-sm)`} />
        <circle cx="547" cy="698" r="12" stroke="#7d9bff" />
        <circle cx="658" cy="612" r="17" stroke="#ff9a7a" opacity=".6" filter={`url(#${id}-blur-sm)`} />
        <circle cx="658" cy="612" r="13" stroke="#ffa98a" />
        <circle cx="783" cy="533" r="19" stroke="#ffc49a" opacity=".7" filter={`url(#${id}-blur-sm)`} />
        <circle cx="783" cy="533" r="14.5" stroke="#fff1e6" />
      </g>

      {/* Bandeira */}
      <ellipse cx="846" cy="515" rx="18" ry="5" fill="#ffd2a8" opacity=".8" filter={`url(#${id}-blur-sm)`} />
      <ellipse cx="846" cy="514" rx="11" ry="3" fill="#fff4ea" />
      <line x1="846" y1="458" x2="846" y2="514" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="846" cy="457" r="3.4" fill="#fff" />
      <path d="M848,462 C862,455 872,470 892,463 L879,476 L893,489 C873,495 862,481 848,487Z" fill={`url(#${id}-flag)`} />

      {/* Planeta */}
      <circle cx="330" cy="1720" r="960" fill={`url(#${id}-planet)`} />
      <g clipPath={`url(#${id}-planet-clip)`} fill="#ffffff">
        <ellipse cx="300" cy="830" rx="420" ry="26" opacity=".07" />
        <ellipse cx="380" cy="880" rx="460" ry="18" opacity=".06" />
        <ellipse cx="160" cy="900" rx="70" ry="16" fill="#24106a" opacity=".35" />
        <ellipse cx="520" cy="905" rx="46" ry="11" fill="#24106a" opacity=".3" />
        <ellipse cx="70" cy="850" rx="34" ry="8" fill="#24106a" opacity=".3" />
        <ellipse cx="640" cy="880" rx="28" ry="7" fill="#24106a" opacity=".28" />
      </g>
      <circle cx="330" cy="1720" r="960" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="14" opacity=".55" filter={`url(#${id}-blur-md)`} />
      <circle cx="330" cy="1720" r="959" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2.5" />

      {/* Rastro do foguete */}
      <path d="M440,676 C380,736 300,800 160,940 L210,940 C320,820 396,744 452,690Z" fill={`url(#${id}-trail)`} opacity=".55" filter={`url(#${id}-blur-lg)`} />
      <path d="M441,678 C384,734 304,806 186,940 L204,940 C318,818 394,744 450,688Z" fill={`url(#${id}-trail)`} />

      {/* Foguete */}
      <g transform="translate(462 642) rotate(38)">
        <path d="M-12,48 C-16,74 -6,98 0,122 C6,98 16,74 12,48Z" fill={`url(#${id}-flame)`} filter={`url(#${id}-blur-sm)`} />
        <path d="M-8,48 C-10,66 -4,82 0,98 C4,82 10,66 8,48Z" fill={`url(#${id}-flame)`} />
        <path d="M-25,8 C-46,20 -54,46 -50,66 L-21,46Z" fill={`url(#${id}-fin)`} />
        <path d="M25,8 C46,20 54,46 50,66 L21,46Z" fill={`url(#${id}-fin)`} />
        <path d="M0,-74 C19,-58 29,-30 27,0 L22,44 L-22,44 L-27,0 C-29,-30 -19,-58 0,-74Z" fill={`url(#${id}-body)`} />
        <path d="M0,-74 C11,-65 18,-54 22,-42 C8,-37 -8,-37 -22,-42 C-18,-54 -11,-65 0,-74Z" fill="#7b4dff" />
        <path d="M-22,34 C-8,38 8,38 22,34 L22,44 L-22,44Z" fill="#cbbcff" />
        <path d="M-13,44 L13,44 L10,52 L-10,52Z" fill="#4b2fa8" />
        <path d="M-5,40 L5,40 L4,64 C2,68 -2,68 -4,64Z" fill={`url(#${id}-fin)`} />
        <circle cx="0" cy="-10" r="15" fill="#6a43e6" />
        <circle cx="0" cy="-10" r="10.5" fill={`url(#${id}-window)`} />
        <ellipse cx="-3.5" cy="-14" rx="3.6" ry="2.4" fill="#fff" opacity=".85" />
        <path d="M14,-40 C20,-24 22,-6 20,14" fill="none" stroke="#fff" strokeOpacity=".0" />
      </g>
    </svg>
  );
}
