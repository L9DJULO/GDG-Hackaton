import { AnimatePresence, motion } from 'framer-motion'

export default function DMPanel({ items, open, setOpen, unread }) {
  return (
    <div className={`dm-dock ${open ? 'open' : ''}`}>
      <button
        className="dm-tab glass mono"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Canal chiffre du lanceur d'alerte"
      >
        <span className="dm-lock">⌁</span>
        CANAL CHIFFRE
        {unread > 0 && !open && <span className="dm-badge">{unread}</span>}
        <span className="dm-caret">{open ? '▸' : '◂'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            className="dm-panel glass"
            initial={{ opacity: 0, x: 30, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 300 }}
            exit={{ opacity: 0, x: 30, width: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Messages chiffres"
          >
            <div className="rail-head dm-head">
              <span className="eyebrow">Liaison securisee</span>
              <h2 className="rail-title serif">Lanceur d'alerte</h2>
              <span className="rail-count mono">CHIFFREMENT BOUT-EN-BOUT / ACTIF</span>
            </div>
            <div className="dm-scroll">
              {items.length === 0 && (
                <p className="dm-empty mono">EN ATTENTE DE CONTACT...</p>
              )}
              {items.map((it) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="dm-msg"
                >
                  <div className="dm-msg-top mono">
                    <span>SOURCE ANONYME</span>
                    <span>{it.time}</span>
                  </div>
                  <p className="dm-msg-label serif">{it.label}</p>
                  <p className="dm-msg-body">{it.contenu}</p>
                </motion.div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
