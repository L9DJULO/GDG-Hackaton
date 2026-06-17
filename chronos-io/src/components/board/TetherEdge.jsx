import { memo } from 'react'
import { getBezierPath } from '@xyflow/react'

// Tether décoratif : fil de gravité très faible reliant chaque nœud au noyau or.
// Non interactif, non scoré — sert uniquement à ancrer visuellement la constellation
// et à offrir le moment "les fils se tracent en dernier" au chargement.
function TetherEdgeImpl({ sourceX, sourceY, targetX, targetY, data }) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature: 0.18,
  })
  return (
    <path
      className={`tether ${data?.fresh ? 'drawing' : ''}`}
      d={path}
      pathLength="1"
      fill="none"
      stroke="rgba(232,177,90,0.16)"
      strokeWidth="1"
      strokeLinecap="round"
    />
  )
}

export default memo(TetherEdgeImpl)
