import { SCENARIO } from '../data/scenario'
import { evaluateLocally } from '../lib/scoring'

const TIMEOUT_MS = 3500

async function fetchJson(url, options = {}) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${url} HTTP ${response.status}`)
    const text = await response.text()
    if (!text.trim()) return null
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`${url} JSON invalide`)
    }
  } finally {
    window.clearTimeout(timer)
  }
}

export async function loadScenario() {
  const attempts = ['/scenario', '/scenario.json']
  for (const url of attempts) {
    try {
      const scenario = await fetchJson(url)
      if (scenario?.scenario_id && Array.isArray(scenario.noeuds)) {
        return { scenario, fallback: url !== '/scenario' }
      }
    } catch {
      // Try the next source, then the bundled scenario.
    }
  }
  return { scenario: SCENARIO, fallback: true }
}

export async function sendAction({ scenarioId, action, state }) {
  try {
    const items = await fetchJson('/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, action, state }),
    })
    return { items: Array.isArray(items) ? items : [], fallback: false }
  } catch {
    return { items: [], fallback: true }
  }
}

export async function submitTruthMap(payload, scenario) {
  try {
    const result = await fetchJson('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (result && typeof result.score === 'number' && Array.isArray(result.debrief)) {
      return { result, fallback: false }
    }
  } catch {
    // Local deterministic evaluator keeps the demo available.
  }
  return {
    result: {
      ...evaluateLocally(payload, scenario),
      localDemo: true,
    },
    fallback: true,
  }
}
