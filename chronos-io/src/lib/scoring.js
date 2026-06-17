// Scoring LOCAL de secours — émule la réponse de la Partie D tant qu'elle n'est
// pas branchée. Sortie au format exact du contrat :
//   { score, label, debrief:[{id, technique, erreur}] }
// Si une vraie Partie D existe, App appellera submitToPartieD() à la place.

const LABELS = [
  { min: 90, label: 'Esprit imperméable' },
  { min: 75, label: 'Enquêteur aguerri' },
  { min: 55, label: 'Enquêteur prudent' },
  { min: 35, label: 'Lecteur influençable' },
  { min: 0, label: 'Cible idéale' },
]

function pickLabel(score) {
  return LABELS.find((l) => score >= l.min).label
}

// payload = { scenario_id, verdicts:[{id,verdict}], liens:[{from,to}] }
// scenario = objet complet (contient les champs cachés pour la correction)
export function evaluateLocally(payload, scenario) {
  const realVerdict = Object.fromEntries(
    scenario.noeuds.map((n) => [n.id, n.verdict_reel])
  )
  const byId = Object.fromEntries(scenario.noeuds.map((n) => [n.id, n]))

  // --- Verdicts ---
  const tagged = payload.verdicts.filter((v) => v.verdict && v.verdict !== 'neutre')
  let verdictHits = 0
  const debrief = []

  for (const node of scenario.noeuds) {
    const given = payload.verdicts.find((v) => v.id === node.id)?.verdict ?? 'neutre'
    const real = realVerdict[node.id]
    if (given === real) {
      verdictHits++
    } else if (given !== 'neutre') {
      // erreur franche = l'élève s'est trompé en s'engageant
      debrief.push({
        id: node.id,
        technique: byId[node.id].technique || real,
        erreur: `taggé ${given}, c'était ${real}${
          byId[node.id].technique ? ` (${byId[node.id].technique})` : ''
        }`,
      })
    } else if (real === 'manipulateur') {
      // manipulateur laissé neutre = piège manqué
      debrief.push({
        id: node.id,
        technique: byId[node.id].technique || 'manipulateur',
        erreur: `laissé neutre, c'était un signal ${real}`,
      })
    }
  }

  // --- Liens ---
  const norm = (l) => [l.from, l.to].sort().join('~')
  const correctSet = new Set(scenario.liens_corrects.map(norm))
  const drawnSet = new Set(payload.liens.map(norm))
  let linkHits = 0
  for (const l of drawnSet) if (correctSet.has(l)) linkHits++

  // --- Score de manipulabilité (100 = imperméable) ---
  const totalNodes = scenario.noeuds.length
  const totalLinks = scenario.liens_corrects.length
  const verdictScore = (verdictHits / totalNodes) * 65
  const linkScore = totalLinks ? (linkHits / totalLinks) * 35 : 35
  const falsePenalty = Math.min(15, (drawnSet.size - linkHits) * 5) // liens hasardeux
  const score = Math.max(
    0,
    Math.round(verdictScore + linkScore - falsePenalty)
  )

  return {
    score,
    label: pickLabel(score),
    debrief: debrief.slice(0, 6),
    _meta: { verdictHits, totalNodes, linkHits, totalLinks, tagged: tagged.length },
  }
}
