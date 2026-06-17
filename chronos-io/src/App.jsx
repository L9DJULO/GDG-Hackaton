import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEdgesState, useNodesState } from '@xyflow/react'
import Board from './components/board/Board'
import DetailPanel from './components/DetailPanel'
import DMPanel from './components/DMPanel'
import Feed from './components/Feed'
import HUD from './components/HUD'
import Starfield from './components/Starfield'
import VerdictScreen from './components/VerdictScreen'
import { LIVE_INJECTIONS } from './data/scenario'
import { CORE_ID, CORE_POS, buildLayout, labelSideFor } from './lib/layout'
import { loadScenario as loadScenarioApi, sendAction, submitTruthMap } from './services/api'
import './styles/board.css'

const VERDICT_CYCLE = ['neutre', 'fiable', 'manipulateur']

const LOCAL_RIPOSTE = {
  id: 'rx-gourou',
  type: 'info',
  label: "Riposte du Gourou : 'Ils veulent etouffer la verite'",
  contenu:
    "Nouveau post viral : 'Si on m'attaque, c'est que je derange. Les soi-disant experts sont payes pour vous garder dependants du vieux systeme.'",
  auteur: 'a1',
  dm: false,
}

function nextVerdict(current = 'neutre') {
  const index = VERDICT_CYCLE.indexOf(current)
  return VERDICT_CYCLE[(index + 1) % VERDICT_CYCLE.length]
}

function nowStamp() {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function asFeedItem(node, index = 0) {
  return {
    id: node.id,
    type: node.type,
    label: node.label,
    contenu: node.contenu,
    time: `T+${String(index + 1).padStart(2, '0')}`,
  }
}

function appendUnique(items, item) {
  if (items.some((it) => it.id === item.id)) return items
  return [item, ...items]
}

function publicNode(raw) {
  return {
    id: raw.id,
    type: raw.type || 'info',
    label: raw.label || raw.id,
    contenu: raw.contenu || '',
    auteur: raw.auteur,
    dm: raw.dm,
  }
}

function buildNodes(scenario) {
  const layout = buildLayout(scenario)
  return [
    {
      id: CORE_ID,
      type: 'orb',
      position: CORE_POS,
      draggable: false,
      selectable: false,
      data: { isCore: true },
    },
    ...scenario.noeuds.map((node) => {
      const position = layout[node.id]
      return {
        id: node.id,
        type: 'orb',
        position,
        data: {
          node,
          verdict: 'neutre',
          labelSide: labelSideFor(position.x),
          mode: 'verdict',
          connectArmed: false,
        },
      }
    }),
  ]
}

function buildTethers(scenario) {
  return scenario.noeuds.map((node) => ({
    id: `tether-${node.id}`,
    source: CORE_ID,
    target: node.id,
    type: 'tether',
    selectable: false,
    data: { kind: 'tether', fresh: true },
  }))
}

export default function App() {
  const [phase, setPhase] = useState('launch')
  const [scenario, setScenario] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('verdict')
  const [verdicts, setVerdicts] = useState({})
  const [feedItems, setFeedItems] = useState([])
  const [dmItems, setDmItems] = useState([])
  const [dmOpen, setDmOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [focusedId, setFocusedId] = useState(null)
  const [armedId, setArmedId] = useState(null)
  const [pulseIds, setPulseIds] = useState(new Set())
  const [glitchIds, setGlitchIds] = useState(new Set())
  const [riposteSent, setRiposteSent] = useState(false)
  const [lastNotice, setLastNotice] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const nodesById = useMemo(() => {
    if (!scenario) return {}
    return Object.fromEntries(scenario.noeuds.map((node) => [node.id, node]))
  }, [scenario])

  const addLiveItem = useCallback(
    (raw) => {
      const item = { ...publicNode(raw), time: raw.time ?? nowStamp() }
      if (item.type === 'info') {
        setScenario((current) => {
          if (!current || current.noeuds.some((node) => node.id === item.id)) return current
          return { ...current, noeuds: [...current.noeuds, publicNode(item)] }
        })
        setNodes((current) => {
          if (current.some((node) => node.id === item.id)) return current
          const index = current.length
          const angle = -0.8 + index * 0.52
          const position = {
            x: CORE_POS.x + Math.cos(angle) * 430,
            y: CORE_POS.y + Math.sin(angle) * 260,
          }
          return [
            ...current,
            {
              id: item.id,
              type: 'orb',
              position,
              data: {
                node: publicNode(item),
                verdict: 'neutre',
                labelSide: labelSideFor(position.x),
                mode,
                connectArmed: false,
              },
            },
          ]
        })
        setEdges((current) => {
          const id = `tether-${item.id}`
          if (current.some((edge) => edge.id === id)) return current
          return [
            ...current,
            {
              id,
              source: CORE_ID,
              target: item.id,
              type: 'tether',
              selectable: false,
              data: { kind: 'tether', fresh: true },
            },
          ]
        })
      }
      if (item.dm) {
        setDmItems((items) => appendUnique(items, item))
        if (!dmOpen) setUnread((count) => count + 1)
        return
      }
      setFeedItems((items) => appendUnique(items, item))
    },
    [dmOpen, mode, setEdges, setNodes]
  )

  const loadScenario = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const { scenario: nextScenario, fallback } = await loadScenarioApi()
      setLastNotice(
        fallback
          ? 'Scenario charge en mode demo local. Le backend /scenario est indisponible.'
          : 'Scenario charge depuis GET /scenario.'
      )

      setScenario(nextScenario)
      setVerdicts(
        Object.fromEntries(nextScenario.noeuds.map((node) => [node.id, 'neutre']))
      )
      setNodes(buildNodes(nextScenario))
      setEdges(buildTethers(nextScenario))
      setFeedItems(
        nextScenario.feed_initial
          .map((id, index) => nodesByIdFrom(nextScenario)[id] && asFeedItem(nodesByIdFrom(nextScenario)[id], index))
          .filter(Boolean)
      )
      setDmItems([])
      setUnread(0)
      setFocusedId(null)
      setArmedId(null)
      setResult(null)
      setRiposteSent(false)
      setSessionKey((key) => key + 1)
      setPhase('playing')
    } catch (error) {
      setLoadError(error?.message || 'Impossible de charger le scenario.')
    } finally {
      setLoading(false)
    }
  }, [setEdges, setNodes])

  useEffect(() => {
    if (dmOpen) setUnread(0)
  }, [dmOpen])

  useEffect(() => {
    if (!scenario || phase !== 'playing') return undefined
    const timers = LIVE_INJECTIONS.map((item) =>
      window.setTimeout(() => addLiveItem(item), item.delay)
    )
    return () => timers.forEach(window.clearTimeout)
  }, [addLiveItem, phase, scenario, sessionKey])

  const stateFrom = useCallback(
    (nextVerdicts = verdicts, nextEdges = edges) => ({
      verdicts: Object.entries(nextVerdicts).map(([id, verdict]) => ({ id, verdict })),
      liens: nextEdges
        .filter((edge) => edge.data?.kind === 'deduction')
        .map((edge) => ({ from: edge.source, to: edge.target })),
    }),
    [edges, verdicts]
  )

  const applyAgentResponse = useCallback(
    (items, fallback, message) => {
      if (Array.isArray(items) && items.length) {
        items.forEach(addLiveItem)
        setLastNotice(message || 'Reaction agentique ajoutee au fil.')
        return
      }
      if (fallback) {
        setLastNotice('Reaction agentique indisponible. Mode demo local actif.')
      }
    },
    [addLiveItem]
  )

  const triggerAgentReaction = useCallback(async (action, state) => {
    if (!scenario) return
    const response = await sendAction({
      scenarioId: scenario.scenario_id,
      action,
      state,
    })
    applyAgentResponse(response.items, response.fallback)
    return response
  }, [applyAgentResponse, scenario])

  const triggerGourouFallback = useCallback(() => {
    if (riposteSent || !scenario) return
    setRiposteSent(true)
    addLiveItem({ ...LOCAL_RIPOSTE, time: nowStamp() })
    setGlitchIds((state) => new Set(state).add('a1'))
    window.setTimeout(() => {
      setGlitchIds((state) => {
        const copy = new Set(state)
        copy.delete('a1')
        return copy
      })
    }, 900)
    setLastNotice('Le Gourou change de tactique dans le fil.')
  }, [addLiveItem, riposteSent, scenario])

  const handleNodeActivate = useCallback(
    (id) => {
      if (!scenario || !nodesById[id]) return
      setFocusedId(id)

      if (mode === 'verdict') {
        const current = verdicts[id] ?? 'neutre'
        const next = nextVerdict(current)
        const nextVerdicts = { ...verdicts, [id]: next }
        setVerdicts(nextVerdicts)

        if (next === 'manipulateur') {
          setGlitchIds((state) => new Set(state).add(id))
          window.setTimeout(() => {
            setGlitchIds((state) => {
              const copy = new Set(state)
              copy.delete(id)
              return copy
            })
          }, 650)
        }

        const action = { type: 'tag', id, verdict: next }
        const state = stateFrom(nextVerdicts, edges)
        triggerAgentReaction(action, state).then((response) => {
          if (id === 'a1' && next === 'manipulateur' && (!response || response.fallback || response.items.length === 0)) {
            triggerGourouFallback()
          }
        })
        return
      }

      setArmedId((current) => {
        if (!current) return id
        if (current === id) return null

        const [a, b] = [current, id].sort()
        const edgeId = `deduction-${a}-${b}`
        let nextEdges = edges
        setEdges((items) => {
          if (items.some((edge) => edge.id === edgeId)) return items
          nextEdges = [
            ...items,
            {
              id: edgeId,
              source: current,
              target: id,
              type: 'deduction',
              data: { kind: 'deduction', fresh: true, deletable: true },
            },
          ]
          return nextEdges
        })

        setPulseIds(new Set([current, id]))
        window.setTimeout(() => setPulseIds(new Set()), 760)
        const action = { type: 'link', from: current, to: id }
        const state = stateFrom(verdicts, nextEdges)
        triggerAgentReaction(action, state).then((response) => {
          if (
            [current, id].includes('a1') &&
            (!response || response.fallback || response.items.length === 0)
          ) {
            triggerGourouFallback()
          }
        })
        return null
      })
    },
    [edges, mode, nodesById, scenario, setEdges, stateFrom, triggerAgentReaction, triggerGourouFallback, verdicts]
  )

  const setNodeVerdict = useCallback(
    (id, verdict) => {
      if (!scenario || !nodesById[id]) return
      setFocusedId(id)
      const nextVerdicts = { ...verdicts, [id]: verdict }
      setVerdicts(nextVerdicts)
      const action = { type: 'tag', id, verdict }
      const state = stateFrom(nextVerdicts, edges)
      triggerAgentReaction(action, state).then((response) => {
        if (id === 'a1' && verdict === 'manipulateur' && (!response || response.fallback || response.items.length === 0)) {
          triggerGourouFallback()
        }
      })
    },
    [edges, nodesById, scenario, stateFrom, triggerAgentReaction, triggerGourouFallback, verdicts]
  )

  const createDeductionLink = useCallback(
    (from, to) => {
      if (!scenario || !nodesById[from] || !nodesById[to] || from === to) return
      const [a, b] = [from, to].sort()
      const edgeId = `deduction-${a}-${b}`
      if (edges.some((edge) => edge.id === edgeId)) return
      const edge = {
        id: edgeId,
        source: from,
        target: to,
        type: 'deduction',
        data: { kind: 'deduction', fresh: true, deletable: mode === 'relier' },
      }
      const nextEdges = [...edges, edge]
      setEdges(nextEdges)
      setPulseIds(new Set([from, to]))
      window.setTimeout(() => setPulseIds(new Set()), 760)
      triggerAgentReaction({ type: 'link', from, to }, stateFrom(verdicts, nextEdges)).then((response) => {
        if ([from, to].includes('a1') && (!response || response.fallback || response.items.length === 0)) {
          triggerGourouFallback()
        }
      })
    },
    [edges, mode, nodesById, scenario, setEdges, stateFrom, triggerAgentReaction, triggerGourouFallback, verdicts]
  )

  useEffect(() => {
    setNodes((items) =>
      items.map((node) => {
        if (node.id === CORE_ID) return node
        const source = nodesById[node.id]
        if (!source) return node
        return {
          ...node,
          data: {
            ...node.data,
            node: source,
            verdict: verdicts[node.id] ?? 'neutre',
            mode,
            connectArmed: armedId === node.id,
            labelSide: labelSideFor(node.position.x),
            onActivate: handleNodeActivate,
            lockPulse: pulseIds.has(node.id),
            glitch: glitchIds.has(node.id),
            focused: focusedId === node.id,
          },
        }
      })
    )
  }, [
    armedId,
    focusedId,
    glitchIds,
    handleNodeActivate,
    mode,
    nodesById,
    pulseIds,
    setNodes,
    verdicts,
  ])

  useEffect(() => {
    setEdges((items) =>
      items.map((edge) =>
        edge.data?.kind === 'deduction'
          ? { ...edge, data: { ...edge.data, deletable: mode === 'relier' } }
          : edge
      )
    )
  }, [mode, setEdges])

  const deleteEdge = useCallback(
    (id) => {
      setEdges((items) => items.filter((edge) => edge.id !== id || edge.data?.kind !== 'deduction'))
    },
    [setEdges]
  )

  const payload = useMemo(() => {
    if (!scenario) return null
    return {
      scenario_id: scenario.scenario_id,
      verdicts: scenario.noeuds.map((node) => ({
        id: node.id,
        verdict: verdicts[node.id] ?? 'neutre',
      })),
      liens: edges
        .filter((edge) => edge.data?.kind === 'deduction')
        .map((edge) => ({ from: edge.source, to: edge.target })),
    }
  }, [edges, scenario, verdicts])

  const deductionLinks = useMemo(
    () =>
      edges
        .filter((edge) => edge.data?.kind === 'deduction')
        .map((edge) => ({ from: edge.source, to: edge.target })),
    [edges]
  )

  const focusedNode = focusedId ? nodesById[focusedId] : null
  const actors = useMemo(
    () => (scenario ? scenario.noeuds.filter((node) => node.type === 'actor') : []),
    [scenario]
  )

  const submit = useCallback(async () => {
    if (!scenario || !payload || submitting) return
    setSubmitting(true)
    try {
      if (!payload.verdicts.some((item) => item.verdict !== 'neutre')) {
        setLastNotice('Ajoutez au moins un verdict avant la soumission.')
      }
      if (payload.liens.length === 0) {
        setLastNotice('Aucun lien cree. La soumission reste possible pour la demo.')
      }
      const { result: nextResult, fallback } = await submitTruthMap(payload, scenario)
      setResult(nextResult)
      if (fallback) setLastNotice('Evaluation locale utilisee car POST /submit est indisponible.')
      setPhase('result')
    } finally {
      setSubmitting(false)
    }
  }, [payload, scenario, submitting])

  const tagged = useMemo(
    () => Object.values(verdicts).filter((verdict) => verdict && verdict !== 'neutre').length,
    [verdicts]
  )
  const total = scenario?.noeuds.length ?? 0
  const tension = Math.min(
    100,
    18 + tagged * 7 + edges.filter((edge) => edge.data?.kind === 'deduction').length * 9 + feedItems.length * 3
  )

  return (
    <div className="app-shell">
      <div className="atmosphere" />
      <Starfield />
      <div className="grain" />

      {phase === 'launch' && (
        <LaunchScreen
          loading={loading}
          error={loadError}
          onLaunch={loadScenario}
        />
      )}

      {scenario && phase === 'playing' && (
        <>
          <HUD
            theme={scenario.theme}
            mode={mode}
            setMode={setMode}
            tension={tension}
            tagged={tagged}
            total={total}
            onSubmit={submit}
            canSubmit={!submitting}
          />

          <main className="workbench">
            <Feed
              items={feedItems}
              verdicts={verdicts}
              focusedId={focusedId}
              onFocus={(id) => setFocusedId(id)}
            />
            <section className="board-shell" aria-label="Carte de deduction">
              <Board
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                mode={mode}
                onNodeActivate={handleNodeActivate}
                onEdgeDelete={deleteEdge}
              />
            </section>
            <DetailPanel
              node={focusedNode}
              actors={actors}
              verdict={focusedId ? verdicts[focusedId] ?? 'neutre' : 'neutre'}
              links={deductionLinks}
              lastNotice={lastNotice}
              onVerdict={setNodeVerdict}
              onLink={createDeductionLink}
            />
          </main>

          <DMPanel
            items={dmItems}
            open={dmOpen}
            setOpen={setDmOpen}
            unread={unread}
          />
        </>
      )}

      {scenario && phase === 'result' && result && (
        <VerdictScreen
          result={result}
          nodesById={nodesById}
          onReopen={() => setPhase('playing')}
        />
      )}
    </div>
  )
}

function nodesByIdFrom(scenario) {
  return Object.fromEntries(scenario.noeuds.map((node) => [node.id, node]))
}

function LaunchScreen({ loading, error, onLaunch }) {
  return (
    <main className="launch-screen">
      <section className="launch-panel glass">
        <span className="eyebrow">Vue prof - Infox-Lab</span>
        <h1 className="launch-title serif">Chronos.io</h1>
        <p className="launch-copy">
          Lancez le scenario, observez les decisions de l'eleve, puis affichez le
          score et le debrief de la Carte de la Verite.
        </p>
        <div className="launch-actions">
          <button className="launch-btn mono" onClick={onLaunch} disabled={loading}>
            {loading ? 'CHARGEMENT...' : 'LANCER UN SCENARIO'}
          </button>
          <span className="launch-note mono">Fallback local actif si l'API est absente</span>
        </div>
        {error && <p className="launch-error mono">{error}</p>}
      </section>
    </main>
  )
}
