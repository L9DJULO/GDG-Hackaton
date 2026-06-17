import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'

// Couleurs de verdict (anneau)
const VERDICT_COLOR = {
  fiable: 'var(--fiable)',
  neutre: 'var(--neutre)',
  manipulateur: 'var(--manip)',
}

function OrbNodeImpl({ data, selected }) {
  const { node, verdict, isCore, labelSide, mode, connectArmed, glitch } = data
  const [hover, setHover] = useState(false)

  if (isCore) return <CoreNode />

  const isActor = node.type === 'actor'
  const size = isActor ? 70 : 56
  const fill = isActor ? 'url(#orb-actor)' : 'url(#orb-info)'
  const baseColor = isActor ? '232,177,90' : '77,216,255'
  const ring = verdict && verdict !== 'neutre' ? VERDICT_COLOR[verdict] : null
  const ringRaw =
    verdict === 'fiable'
      ? '61,224,160'
      : verdict === 'manipulateur'
      ? '255,77,109'
      : '126,147,184'

  const glowSize = hover ? size * 1.65 : size * 1.35
  const isManip = verdict === 'manipulateur'

  return (
    <div
      className={`orb-wrap ${labelSide} ${connectArmed ? 'armed' : ''} ${
        data.focused ? 'focused' : ''
      }`}
      data-glitch={glitch ? '1' : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ '--orb': `${size}px`, '--base': baseColor }}
      role="button"
      tabIndex={0}
      aria-label={`${isActor ? 'Agent' : 'Signal'} — ${node.label}. Verdict ${
        verdict || 'neutre'
      }. ${
        mode === 'verdict'
          ? 'Entrée pour cycler le verdict.'
          : connectArmed
          ? 'Nœud armé pour relier.'
          : 'Entrée pour relier.'
      }`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          data.onActivate?.(node.id)
        }
      }}
    >
      {/* glow d'arrière-plan */}
      <span
        className="orb-glow"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, rgba(${baseColor},${
            isManip ? 0.0 : hover ? 0.5 : 0.34
          }) 0%, rgba(${ring ? ringRaw : baseColor},${
            isManip ? 0.55 : 0
          }) 0%, transparent 70%)`,
        }}
      />

      <svg className="orb-svg" width={size + 6} height={size + 6}>
        {/* halo flou */}
        <circle
          cx={(size + 6) / 2}
          cy={(size + 6) / 2}
          r={size / 2}
          fill={fill}
          filter="url(#glow-soft)"
          opacity={hover ? 1 : 0.92}
        />
        {/* anneau de verdict */}
        {ring && (
          <circle
            className="verdict-ring"
            cx={(size + 6) / 2}
            cy={(size + 6) / 2}
            r={size / 2 + 1}
            fill="none"
            stroke={ring}
            strokeWidth="2"
          />
        )}
        {/* reflet spéculaire */}
        <ellipse
          cx={(size + 6) / 2 - size * 0.16}
          cy={(size + 6) / 2 - size * 0.18}
          rx={size * 0.14}
          ry={size * 0.09}
          fill="rgba(255,255,255,0.6)"
        />
      </svg>

      {/* anneau de verrouillage (déclenché au lien) */}
      {data.lockPulse && <span className="lock-ring" />}

      <span className={`orb-label ${hover || selected ? 'lit' : ''}`}>
        <span className="orb-kind">{isActor ? 'AGENT' : 'SIGNAL'}</span>
        {node.label}
      </span>

      {/* handles masqués (au centre) pour l'ancrage des fils */}
      <Handle type="source" position={Position.Top} className="rf-hidden" />
      <Handle type="target" position={Position.Bottom} className="rf-hidden" />
    </div>
  )
}

function CoreNode() {
  return (
    <div className="core-wrap" aria-hidden="true">
      <span className="core-corona" />
      <svg width="160" height="160" className="core-svg">
        <circle cx="80" cy="80" r="46" fill="url(#orb-core)" filter="url(#glow-soft)" />
        <circle cx="80" cy="80" r="30" fill="url(#orb-core)" />
      </svg>
      <span className="core-label mono">CHRONOS · NOYAU</span>
      <span className="core-sub mono">SOURCE DU DOSSIER</span>
      <Handle type="target" position={Position.Top} className="rf-hidden" />
      <Handle type="source" position={Position.Bottom} className="rf-hidden" />
    </div>
  )
}

export default memo(OrbNodeImpl)
