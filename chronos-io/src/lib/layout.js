// Dispose les nœuds en constellation autour du noyau or central.
// Positions déterministes (composition soignée), labels orientés selon le côté.

// Placement manuel : un anneau organique, agents (or) répartis, infos en grappes.
const SLOTS = {
  // x, y autour du centre (0,0)
  a1: { x: -440, y: -150 },
  i1: { x: -300, y: -290 },
  i5: { x: -520, y: 60 },
  a2: { x: 380, y: -210 },
  i2: { x: 250, y: -340 },
  i4: { x: 520, y: -40 },
  a3: { x: 300, y: 250 },
  i6: { x: 90, y: 360 },
  i3: { x: -180, y: 300 },
  i7: { x: -420, y: 230 },
}

export function buildLayout(scenario) {
  const positions = {}
  scenario.noeuds.forEach((n, idx) => {
    const slot = SLOTS[n.id] || {
      x: Math.cos((idx / scenario.noeuds.length) * Math.PI * 2) * 420,
      y: Math.sin((idx / scenario.noeuds.length) * Math.PI * 2) * 320,
    }
    positions[n.id] = slot
  })
  return positions
}

export function labelSideFor(x) {
  return x >= 0 ? 'right' : 'left'
}

export const CORE_ID = '__core__'
export const CORE_POS = { x: 0, y: 0 }
