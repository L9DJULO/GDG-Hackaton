import { motion } from 'framer-motion'

export default function HUD({
  theme,
  mode,
  setMode,
  tension,
  tagged,
  total,
  onSubmit,
  canSubmit,
}) {
  return (
    <header className="hud glass">
      <div className="hud-left">
        <span className="eyebrow">Dossier - Infox-Lab / Chronos.io</span>
        <h1 className="hud-title serif">{theme}</h1>
      </div>

      <div className="hud-center">
        <div className="mode-switch" role="tablist" aria-label="Mode du board">
          <button
            role="tab"
            aria-selected={mode === 'verdict'}
            className={`mode-btn ${mode === 'verdict' ? 'on' : ''}`}
            onClick={() => setMode('verdict')}
          >
            VERDICT
          </button>
          <button
            role="tab"
            aria-selected={mode === 'relier'}
            className={`mode-btn ${mode === 'relier' ? 'on' : ''}`}
            onClick={() => setMode('relier')}
          >
            RELIER
          </button>
        </div>
        <p className="mode-hint mono">
          {mode === 'verdict'
            ? 'CLIC NOEUD -> CYCLE NEUTRE / FIABLE / MANIPULATEUR'
            : 'CLIC DEUX NOEUDS -> FIL / CLIC FIL -> SUPPRIME'}
        </p>
      </div>

      <div className="hud-right">
        <div className="tension" aria-label={`Tension du dossier ${tension} pour cent`}>
          <div className="tension-head mono">
            <span>TENSION</span>
            <span className="tension-val">{tension}%</span>
          </div>
          <div className="tension-bar">
            <motion.span
              className="tension-fill"
              animate={{ width: `${tension}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="tension-sub mono">
            {tagged}/{total} NOEUDS QUALIFIES
          </span>
        </div>

        <button
          className={`submit-btn mono ${canSubmit ? 'ready' : ''}`}
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          SOUMETTRE LA CARTE
        </button>
      </div>
    </header>
  )
}
