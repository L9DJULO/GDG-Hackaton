// Définitions SVG partagées (gradients radiaux + filtres glow feGaussianBlur).
// Injectées une seule fois, réutilisées par tous les orbes et fils.
export default function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {/* Orbe info (cyan) */}
        <radialGradient id="orb-info" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#d8f6ff" />
          <stop offset="22%" stopColor="#7fe4ff" />
          <stop offset="60%" stopColor="#4dd8ff" />
          <stop offset="100%" stopColor="#13405a" />
        </radialGradient>

        {/* Orbe agent (or) */}
        <radialGradient id="orb-actor" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#fff0d2" />
          <stop offset="24%" stopColor="#f2cd86" />
          <stop offset="60%" stopColor="#e8b15a" />
          <stop offset="100%" stopColor="#5a3c14" />
        </radialGradient>

        {/* Noyau / source (soleil or) */}
        <radialGradient id="orb-core" cx="50%" cy="46%" r="60%">
          <stop offset="0%" stopColor="#fff6e3" />
          <stop offset="30%" stopColor="#f4cd84" />
          <stop offset="64%" stopColor="#e8b15a" />
          <stop offset="100%" stopColor="rgba(232,177,90,0)" />
        </radialGradient>

        {/* Fil de déduction — dégradé le long du trait */}
        <linearGradient id="wire-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8b15a" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#9fe0ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4dd8ff" stopOpacity="0.95" />
        </linearGradient>

        <filter id="glow-soft" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow-wide" x="-160%" y="-160%" width="420%" height="420%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
    </svg>
  )
}
