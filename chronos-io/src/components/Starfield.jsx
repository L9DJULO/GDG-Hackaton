import { useEffect, useRef } from 'react'

// Champ de particules — 3 couches de parallaxe lente pour la profondeur de la
// constellation. Nombre limité (perfs). Désactivé si prefers-reduced-motion.
const LAYERS = [
  { count: 46, speed: 0.012, radius: [0.4, 1.0], alpha: 0.35, color: '180, 200, 235' },
  { count: 30, speed: 0.026, radius: [0.6, 1.4], alpha: 0.5, color: '120, 150, 200' },
  { count: 14, speed: 0.05, radius: [0.8, 1.9], alpha: 0.7, color: '77, 216, 255' },
]

export default function Starfield() {
  const ref = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w, h, dpr
    let raf
    let mouseX = 0
    let mouseY = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const layers = LAYERS.map((cfg) => ({
      cfg,
      stars: Array.from({ length: cfg.count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: cfg.radius[0] + Math.random() * (cfg.radius[1] - cfg.radius[0]),
        tw: Math.random() * Math.PI * 2, // phase de scintillement
        twS: 0.4 + Math.random() * 0.8,
      })),
    }))

    const onMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove)

    let t = 0
    const draw = () => {
      t += 0.016
      ctx.clearRect(0, 0, w, h)
      for (const { cfg, stars } of layers) {
        const px = mouseX * cfg.speed * 600
        const py = mouseY * cfg.speed * 600
        for (const s of stars) {
          // dérive lente verticale
          s.y += cfg.speed
          if (s.y > h + 4) s.y = -4
          const twinkle = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * s.twS + s.tw)
          const a = cfg.alpha * twinkle
          ctx.beginPath()
          ctx.arc(s.x - px, s.y - py, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${cfg.color}, ${a})`
          ctx.shadowBlur = s.r * 3
          ctx.shadowColor = `rgba(${cfg.color}, ${a * 0.8})`
          ctx.fill()
        }
      }
      ctx.shadowBlur = 0
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    if (reduce) draw() // une frame statique

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  )
}
