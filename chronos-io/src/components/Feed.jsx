import { AnimatePresence, motion } from 'framer-motion'

const KIND_LABEL = {
  actor: 'ENTITE SUIVIE',
  info: 'SIGNAL INTERCEPTE',
}

function deriveFormat(label) {
  const value = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (
    value.includes('tiktok') ||
    value.includes('video') ||
    value.includes('telegram') ||
    value.includes('post')
  ) {
    return 'FLUX SOCIAL'
  }
  if (value.includes('tribune') || value.includes('communique')) return 'COMMUNIQUE'
  if (
    value.includes('etude') ||
    value.includes('rapport') ||
    value.includes('cnrs') ||
    value.includes('aie')
  ) {
    return 'PUBLICATION'
  }
  if (value.includes('documents') || value.includes('note')) return 'PDF FUITE'
  return 'DEPECHE'
}

export default function Feed({ items, verdicts, onFocus, focusedId }) {
  return (
    <aside className="feed glass" aria-label="Feed des signaux interceptes">
      <div className="rail-head">
        <span className="eyebrow">Flux de renseignement</span>
        <h2 className="rail-title serif">Signaux interceptes</h2>
        <span className="rail-count mono">{items.length} ENTREES / CANAL OUVERT</span>
      </div>

      <div className="feed-scroll">
        <AnimatePresence initial={false}>
          {items.map((it) => {
            const verdict = verdicts[it.id]
            return (
              <motion.button
                layout
                key={it.id}
                initial={{ opacity: 0, x: -22, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className={`signal-card ${focusedId === it.id ? 'focus' : ''} ${
                  it.type === 'actor' ? 'is-actor' : ''
                }`}
                data-verdict={verdict || 'neutre'}
                onClick={() => onFocus(it.id)}
              >
                <div className="signal-top mono">
                  <span className="sig-time">{it.time}</span>
                  <span className="sig-kind">
                    {KIND_LABEL[it.type]} / {deriveFormat(it.label)}
                  </span>
                </div>
                <p className="signal-label serif">{it.label}</p>
                <p className="signal-body">{it.contenu}</p>
                <div className="signal-foot mono">
                  <span className="sig-id">REF {it.id.toUpperCase()}</span>
                  {verdict && verdict !== 'neutre' ? (
                    <span className={`sig-verdict v-${verdict}`}>
                      {verdict.toUpperCase()}
                    </span>
                  ) : (
                    <span className="sig-verdict v-pending">SOURCE NON VERIFIEE</span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </aside>
  )
}
