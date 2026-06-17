import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function VerdictScreen({ result, nodesById, onReopen }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const target = result.score
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(target)
      return undefined
    }
    let raf
    const start = performance.now()
    const duration = 1400
    const tick = (time) => {
      const progress = Math.min(1, (time - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [result.score])

  const tone = result.score >= 75 ? 'high' : result.score >= 50 ? 'mid' : 'low'

  return (
    <motion.div
      className="verdict-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="verdict-vignette" />
      <motion.div
        className="verdict-sheet glass"
        initial={{ y: 28, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="verdict-head">
          <span className="eyebrow">Dossier clos / Evaluation independante</span>
          <h2 className="verdict-kicker serif">Carte de la Verite - Verdict</h2>
        </div>

        <div className="verdict-body">
          <div className={`score-block tone-${tone}`}>
            <div className="score-ring-wrap">
              <ScoreRing value={shown} />
              <div className="score-num">
                <span className="score-int mono">{shown}</span>
                <span className="score-den mono">/100</span>
              </div>
            </div>
            <div className="score-meta">
              <span className="eyebrow">Indice de resistance</span>
              <p className="score-label serif">{result.label}</p>
              <p className="score-desc">
                Votre lecture des signaux a resiste a <strong>{shown}%</strong> des
                tentatives de manipulation du dossier.
              </p>
            </div>
          </div>

          <div className="debrief">
            <div className="debrief-head mono">
              <span>DEBRIEF - FAILLES IDENTIFIEES</span>
              <span className="debrief-count">{result.debrief.length}</span>
            </div>
            {result.debrief.length === 0 ? (
              <p className="debrief-clean serif">
                Aucune faille majeure. Le dossier a ete demele proprement.
              </p>
            ) : (
              <ul className="debrief-list">
                {result.debrief.map((item, index) => (
                  <motion.li
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.09, duration: 0.45 }}
                    className="debrief-item"
                  >
                    <span className="debrief-ref mono">{item.id.toUpperCase()}</span>
                    <div className="debrief-text">
                      <p className="debrief-node serif">
                        {nodesById[item.id]?.label ?? item.id}
                      </p>
                      <p className="debrief-err">{item.erreur}</p>
                      {item.technique && (
                        <span className="debrief-tech mono">
                          TECHNIQUE / {String(item.technique).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="verdict-foot">
          <button className="ghost-btn mono" onClick={onReopen}>
            ROUVRIR LE DOSSIER
          </button>
          <span className="verdict-stamp mono">
            CHRONOS.IO / EMI / {new Date().getFullYear()}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ScoreRing({ value }) {
  const radius = 78
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / 100)
  return (
    <svg width="184" height="184" className="score-ring">
      <circle cx="92" cy="92" r={radius} className="ring-track" />
      <circle
        cx="92"
        cy="92"
        r={radius}
        className="ring-prog"
        style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
      />
    </svg>
  )
}
