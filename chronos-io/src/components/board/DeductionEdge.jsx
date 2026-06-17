import { memo } from 'react'
import { getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react'

// Fil de déduction : trait fin lumineux, légèrement courbe, dégradé le long du
// trait + impulsion de lumière qui voyage à la création, puis se pose en glow.
function DeductionEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.35,
  })

  const fresh = data?.fresh

  return (
    <>
      {/* lueur diffuse sous le trait */}
      <path
        d={path}
        fill="none"
        stroke="url(#wire-grad)"
        strokeWidth={selected ? 7 : 5}
        strokeLinecap="round"
        opacity="0.18"
        filter="url(#glow-wide)"
      />
      {/* trait net */}
      <path
        className={`wire-core ${fresh ? 'drawing' : ''} ${selected ? 'sel' : ''}`}
        d={path}
        pathLength="1"
        fill="none"
        stroke="url(#wire-grad)"
        strokeWidth={selected ? 2.4 : 1.5}
        strokeLinecap="round"
      />
      {/* impulsion de lumière qui voyage (au tracé) */}
      {fresh && (
        <circle r="3.4" fill="#eaf7ff" filter="url(#glow-soft)">
          <animateMotion dur="0.85s" fill="freeze" path={path} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="0.85s" fill="freeze" />
        </circle>
      )}

      {/* zone de clic large pour la suppression (mode Relier) */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="18"
        style={{ cursor: data?.deletable ? 'pointer' : 'default' }}
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            className="edge-cut mono"
            style={{
              transform: `translate(-50%,-50%) translate(${(sourceX + targetX) / 2}px,${
                (sourceY + targetY) / 2
              }px)`,
            }}
          >
            ✕ COUPER LE FIL
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(DeductionEdgeImpl)
