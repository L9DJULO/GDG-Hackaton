const VERDICTS = [
  { value: 'fiable', label: 'Fiable' },
  { value: 'neutre', label: 'Neutre' },
  { value: 'manipulateur', label: 'Manipulateur' },
]

export default function DetailPanel({
  node,
  actors,
  verdict,
  links,
  lastNotice,
  onVerdict,
  onLink,
}) {
  return (
    <aside className="details glass" aria-label="Details du noeud selectionne">
      <div className="rail-head">
        <span className="eyebrow">Analyse</span>
        <h2 className="rail-title serif">Noeud selectionne</h2>
      </div>

      {!node ? (
        <div className="details-empty mono">
          Selectionnez une information ou un acteur sur le board.
        </div>
      ) : (
        <div className="details-body">
          <div className="details-meta mono">
            <span>{node.type === 'actor' ? 'ACTEUR' : 'INFORMATION'}</span>
            <span>REF {node.id.toUpperCase()}</span>
          </div>
          <h3 className="details-title serif">{node.label}</h3>
          <p className="details-copy">{node.contenu}</p>

          <div className="details-section">
            <span className="section-label mono">Verdict eleve</span>
            <div className="verdict-buttons">
              {VERDICTS.map((item) => (
                <button
                  key={item.value}
                  className={`verdict-btn v-${item.value} ${
                    verdict === item.value ? 'on' : ''
                  }`}
                  onClick={() => onVerdict(node.id, item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {node.type === 'info' && (
            <div className="details-section">
              <span className="section-label mono">Relier a une source</span>
              <div className="link-buttons">
                {actors.map((actor) => {
                  const active = links.some(
                    (link) =>
                      (link.from === node.id && link.to === actor.id) ||
                      (link.from === actor.id && link.to === node.id)
                  )
                  return (
                    <button
                      key={actor.id}
                      className={`link-btn ${active ? 'on' : ''}`}
                      onClick={() => onLink(node.id, actor.id)}
                    >
                      {actor.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {lastNotice && (
            <div className="notice mono" role="status">
              {lastNotice}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
