import { motion, useReducedMotion } from 'framer-motion'
import { burgersData } from '../data/menu'
import { imgFloat, priceWave, useSpotlight } from '../lib/menuMotion'
import './Menu1.scss'

const BURGER_CARDS = [
  { label: 'LE CLASSIQUE', name: 'Kefta ou Poulet', desc: 'Crudités · Fromage', price: 8.00 },
  { label: 'LE SIGNATURE', name: 'Poulet Mariné', desc: 'Crudités · Fromage', price: 8.50 },
]

const SUPPLEMENTS = [
  ...burgersData.supplements.plus1.map(name => ({ name, price: '+1€' })),
  ...burgersData.supplements.plus2.map(name => ({ name, price: '+2€' })),
]

const BURGER_COUNT = BURGER_CARDS.length + 1
const SCALE_COUNT = burgersData.texmex.length + SUPPLEMENTS.length

export default function Menu1() {
  const reduced = useReducedMotion()
  const burgerSpot = useSpotlight(BURGER_COUNT, 9000, reduced)
  const scaleSpot = useSpotlight(SCALE_COUNT, 7000, reduced)

  return (
    <div className="m1">
      <header className="m1__header">
        <div className="m1__brand">BARAKA<span>FOOD</span></div>
        <h1 className="m1__page-title">LES MEGA CHEESE</h1>
        <div className="m1__head-right">
          <div className="m1__menu-note">
            <span>Menu Frites + Boisson</span>
            <strong>+3.50€</strong>
          </div>
          <div className="m1__halal">HALAL</div>
        </div>
      </header>

      {/* ── BURGERS (projecteur blanc rotatif) ── */}
      <section className="m1__row m1__burgers">
        {BURGER_CARDS.map((item, i) => (
          <motion.div
            key={i}
            className={`m1__bcard${burgerSpot === i ? ' m1__bcard--active' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <div className="m1__img m1__img--lg" />
            <div className="m1__bcard-text">
              <p className="m1__bcard-label">{item.label}</p>
              <h2 className="m1__bcard-name">{item.name}</h2>
              <p className="m1__bcard-desc">{item.desc}</p>
            </div>
            <span className="m1__bcard-price">{item.price.toFixed(2)}€</span>
          </motion.div>
        ))}

        <motion.div
          className={`m1__bcard${burgerSpot === 2 ? ' m1__bcard--active' : ''}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <div className="m1__img m1__img--lg" />
          <div className="m1__bcard-text">
            <p className="m1__bcard-label">L'INCONTOURNABLE</p>
            <h2 className="m1__bcard-name m1__bcard-name--xl">Crunchy</h2>
            <p className="m1__bcard-desc">{burgersData.crunchy.desc}</p>
          </div>
          <span className="m1__bcard-price">{burgersData.crunchy.price.toFixed(2)}€</span>
        </motion.div>
      </section>

      {/* ── TEXMEX ── */}
      <section className="m1__row m1__texmex">
        <div className="m1__spine"><span>TEXMEX</span></div>
        <div className="m1__texmex-grid">
          {burgersData.texmex.map((item, i) => (
            <motion.div
              key={i}
              className="m1__tcard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: scaleSpot === i ? 1.09 : 1 }}
              transition={{ duration: 1.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.div className="m1__img m1__img--md" {...imgFloat(i, reduced)} />
              <span className="m1__tcard-name">{item.name}</span>
              <motion.span className="m1__tcard-price" {...priceWave(i, reduced)}>
                {item.price.toFixed(2)}€
              </motion.span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SUPPLÉMENTS ── */}
      <section className="m1__row m1__sups">
        <div className="m1__spine"><span>SUPPLÉMENTS</span></div>
        <div className="m1__sups-grid">
          {SUPPLEMENTS.map((item, i) => (
            <motion.div
              key={i}
              className="m1__tcard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: scaleSpot === burgersData.texmex.length + i ? 1.09 : 1 }}
              transition={{ duration: 1.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.div className="m1__img m1__img--md" {...imgFloat(i, reduced)} />
              <span className="m1__tcard-name">{item.name}</span>
              <motion.span className="m1__tcard-price" {...priceWave(i, reduced)}>
                {item.price}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}
