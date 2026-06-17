import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  useReactFlow,
} from '@xyflow/react'
import OrbNode from './OrbNode'
import DeductionEdge from './DeductionEdge'
import TetherEdge from './TetherEdge'
import SvgDefs from './SvgDefs'

const nodeTypes = { orb: OrbNode }
const edgeTypes = { deduction: DeductionEdge, tether: TetherEdge }

export default function Board({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  mode,
  onNodeActivate,
  onEdgeDelete,
}) {
  const handleNodeClick = useCallback(
    (_e, node) => {
      if (node.data?.isCore) return
      onNodeActivate(node.id)
    },
    [onNodeActivate]
  )

  const handleEdgeClick = useCallback(
    (_e, edge) => {
      if (mode === 'relier') onEdgeDelete(edge.id)
    },
    [mode, onEdgeDelete]
  )

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), [])

  return (
    <div className="board-stage">
      <SvgDefs />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        defaultViewport={defaultViewport}
        minZoom={0.5}
        maxZoom={1.6}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        selectionOnDrag={false}
        className={`rf-${mode}`}
      >
        <Background gap={46} size={1} color="rgba(77,216,255,0.05)" />
      </ReactFlow>
    </div>
  )
}
