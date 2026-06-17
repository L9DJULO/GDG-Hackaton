import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = Number(process.env.PORT || 8787)

const world = {
  turns: 0,
  feed: [],
  actions: [],
}

function send(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(body)
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

async function loadScenario() {
  const raw = await readFile(join(__dirname, 'scenario.json'), 'utf8')
  return JSON.parse(raw)
}

function normalizeAction(payload) {
  const action = payload.action || {}
  if (action.type === 'tag') {
    return {
      type: 'tag',
      id: action.id,
      verdict: action.verdict,
    }
  }
  if (action.type === 'link') {
    return {
      type: 'link',
      from: action.from,
      to: action.to,
    }
  }
  return action
}

function makeAgentItems(action) {
  const items = []
  const isGourouTagged =
    action.type === 'tag' && action.id === 'a1' && action.verdict === 'manipulateur'
  const isGourouLinked =
    action.type === 'link' && (action.from === 'a1' || action.to === 'a1')

  if (isGourouTagged || isGourouLinked) {
    items.push({
      id: `live-gourou-${Date.now()}`,
      type: 'info',
      label: "Riposte du Gourou : changement de tactique",
      contenu:
        "Nouveau post viral : 'On m'accuse maintenant parce que je derange. Quand les experts officiels paniquent, c'est souvent que la verite approche.'",
      auteur: 'a1',
      dm: false,
    })
    items.push({
      id: `dm-whistle-${Date.now()}`,
      type: 'info',
      label: "Document partiel transmis au canal securise",
      contenu:
        "Camille R. : 'Regardez la note du 12/02/2026. Le rendement annonce publiquement ne correspond pas aux tests internes.'",
      auteur: 'a3',
      dm: true,
    })
    return items
  }

  if (action.type === 'tag' && action.id === 'a2') {
    items.push({
      id: `live-lobby-${Date.now()}`,
      type: 'info',
      label: "Le Lobbyiste publie une note de clarification",
      contenu:
        "Helios Strategy diffuse une note technique rassurante, tres dense, qui deplace le debat vers les emplois et les investissements futurs.",
      auteur: 'a2',
      dm: false,
    })
  }

  return items
}

function evaluate(payload, scenario) {
  const realVerdicts = new Map(
    scenario.noeuds.filter((node) => node.verdict_reel).map((node) => [node.id, node])
  )
  const givenVerdicts = new Map(
    (payload.verdicts || []).map((item) => [item.id, item.verdict])
  )
  const normalizeLink = (link) => [link.from, link.to].sort().join('~')
  const correctLinks = new Set((scenario.liens_corrects || []).map(normalizeLink))
  const givenLinks = new Set((payload.liens || []).map(normalizeLink))

  let verdictHits = 0
  const debrief = []

  for (const [id, node] of realVerdicts.entries()) {
    const given = givenVerdicts.get(id) || 'neutre'
    if (given === node.verdict_reel) {
      verdictHits += 1
    } else if (node.verdict_reel === 'manipulateur' || given !== 'neutre') {
      debrief.push({
        id,
        technique: node.technique || node.verdict_reel,
        erreur:
          given === 'neutre'
            ? `laisse neutre, ce signal demandait un arbitrage`
            : `tagge ${given}, attendu ${node.verdict_reel}`,
        explication:
          node.technique
            ? `Technique observee : ${node.technique}.`
            : 'La comparaison deterministe avec la verite terrain signale un ecart.',
      })
    }
  }

  let linkHits = 0
  for (const link of givenLinks) if (correctLinks.has(link)) linkHits += 1

  const verdictScore = (verdictHits / Math.max(1, realVerdicts.size)) * 65
  const linkScore = (linkHits / Math.max(1, correctLinks.size)) * 35
  const falseLinkPenalty = Math.min(15, Math.max(0, givenLinks.size - linkHits) * 5)
  const score = Math.max(0, Math.round(verdictScore + linkScore - falseLinkPenalty))

  let label = 'Lecteur influencable'
  if (score >= 90) label = 'Esprit impermeable'
  else if (score >= 75) label = 'Enqueteur aguerri'
  else if (score >= 55) label = 'Enqueteur prudent'

  return {
    score,
    label,
    details: {
      verdicts_corrects: verdictHits,
      verdicts_total: realVerdicts.size,
      liens_corrects: linkHits,
      liens_total: correctLinks.size,
      tours: world.turns,
    },
    debrief: debrief.slice(0, 6),
  }
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {})

  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, { ok: true, service: 'chronos-api' })
    }

    if (req.method === 'GET' && url.pathname === '/scenario') {
      const scenario = await loadScenario()
      return send(res, 200, scenario)
    }

    if (req.method === 'POST' && url.pathname === '/action') {
      const payload = await readJson(req)
      const action = normalizeAction(payload)
      const items = makeAgentItems(action)
      world.turns += 1
      world.actions.push({ action, at: new Date().toISOString() })
      world.feed.push(...items)
      return send(res, 200, items)
    }

    if (req.method === 'POST' && url.pathname === '/submit') {
      const payload = await readJson(req)
      const scenario = await loadScenario()
      return send(res, 200, evaluate(payload, scenario))
    }

    return send(res, 404, { error: 'Route inconnue' })
  } catch (error) {
    return send(res, 500, { error: error.message || 'Erreur serveur' })
  }
}

createServer(handle).listen(PORT, () => {
  console.log(`Chronos API live sur http://localhost:${PORT}`)
})
