import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Index.scss'

const screens = [
  { path: '/1', label: 'ÉCRAN 1', desc: 'Nos Burgers' },
  { path: '/2', label: 'ÉCRAN 2', desc: 'Les Sandwichs Baguette' },
  { path: '/3', label: 'ÉCRAN 3', desc: 'Compose ton Tacos' },
]

export default function Index() {
  const navigate = useNavigate()

  return (
    <div className="idx">
      <div className="idx__brand">
        BARAKA
        <span>FOOD</span>
      </div>

      <div className="idx__screens">
        {screens.map((s, i) => (
          <motion.button
            key={s.path}
            className="idx__screen"
            onClick={() => navigate(s.path)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <span className="idx__screen-label">{s.label}</span>
            <span className="idx__screen-desc">{s.desc}</span>
            <span className="idx__screen-url">{s.path}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
