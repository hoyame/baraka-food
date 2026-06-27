import { motion, useReducedMotion } from 'framer-motion'
import { sandwichsData, burgersData } from '../data/menu'
import { imgFloat, priceWave, useSpotlight } from '../lib/menuMotion'
import './Menu2.scss'

const SUPPLEMENTS = [
  ...sandwichsData.supplements.plus1.map(name => ({ name, price: '+1€' })),
  ...sandwichsData.supplements.plus2.map(name => ({ name, price: '+2€' })),
]

const SCALE_COUNT = sandwichsData.classiques.length + SUPPLEMENTS.length

export default function Menu2() {
  const reduced = useReducedMotion()
  const scaleSpot = useSpotlight(SCALE_COUNT, 7000, reduced)

  return (
    <div className="m2">
      <header className="m2__header">
        <div className="m2__brand">BARAKA<span>FOOD</span></div>
        <h1 className="m2__page-title">LES SANDWICHS</h1>
        <div className="m2__head-right">
          <div className="m2__menu-note">
            <span>Menu Frites + Boisson</span>
            <strong>+3.50€</strong>
          </div>
          <div className="m2__halal">HALAL</div>
        </div>
      </header>

      {/* ── CLASSIQUES ── */}
      <section className="m2__row m2__classiques">
        <div className="m2__spine"><span>CLASSIQUES</span></div>
        <div className="m2__classiques-grid">
          {sandwichsData.classiques.map((item, i) => (
            <motion.div
              key={i}
              className="m2__tcard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: scaleSpot === i ? 1.09 : 1 }}
              transition={{ duration: 1.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.div className="m2__img m2__img--md" {...imgFloat(i, reduced)} />
              <span className="m2__tcard-name">{item.name}</span>
              <motion.span className="m2__tcard-price" {...priceWave(i, reduced)}>
                {item.price.toFixed(2)}€
              </motion.span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CRUNCHY (featured) ── */}
      <section className="m2__row m2__featured-row">
        <motion.div
          className="m2__bcard m2__bcard--featured"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <motion.div className="m2__img m2__img--lg" {...imgFloat(0, reduced)} />
          <div className="m2__bcard-text">
            <p className="m2__bcard-label">L'INCONTOURNABLE</p>
            <h2 className="m2__bcard-name m2__bcard-name--xl">Crunchy</h2>
            <p className="m2__bcard-desc">{sandwichsData.crunchy.desc}</p>
          </div>
          <span className="m2__bcard-price">{sandwichsData.crunchy.price.toFixed(2)}€</span>
        </motion.div>
      </section>

      {/* ── SUPPLÉMENTS ── */}
      <section className="m2__row m2__sups">
        <div className="m2__spine"><span>SUPPLÉMENTS</span></div>
        <div className="m2__sups-grid">
          {SUPPLEMENTS.map((item, i) => (
            <motion.div
              key={i}
              className="m2__tcard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: scaleSpot === sandwichsData.classiques.length + i ? 1.09 : 1 }}
              transition={{ duration: 1.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.div className="m2__img m2__img--md" {...imgFloat(i, reduced)} />
              <span className="m2__tcard-name">{item.name}</span>
              <motion.span className="m2__tcard-price" {...priceWave(i, reduced)}>
                {item.price}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── MENUS & PLUS ── */}
      <section className="m2__row m2__bottom">
        <div className="m2__spine"><span>MENUS &amp; PLUS</span></div>

        <div className="m2__menukids">
          <motion.div className="m2__img m2__img--md" {...imgFloat(0, reduced)} />
          <div className="m2__menukids-text">
            <span className="m2__menukids-title">MENU KIDS</span>
            <p className="m2__menukids-desc">{burgersData.menuKids.desc}</p>
          </div>
          <motion.span className="m2__menukids-price" {...priceWave(0, reduced)}>
            {burgersData.menuKids.price.toFixed(2)}€
          </motion.span>
        </div>

        <div className="m2__plus">
          <div className="m2__plus-col">
            <span className="m2__plus-title">FRITES</span>
            {burgersData.frites.map((it, j) => (
              <div key={j} className="m2__mini-row"><span>{it.name}</span><span>{it.price.toFixed(2)}€</span></div>
            ))}
          </div>
          <div className="m2__plus-col">
            <span className="m2__plus-title">DESSERTS</span>
            {burgersData.desserts.map((it, j) => (
              <div key={j} className="m2__mini-row"><span>{it.name}</span><span>{it.price.toFixed(2)}€</span></div>
            ))}
          </div>
          <div className="m2__plus-col">
            <span className="m2__plus-title">BOISSONS</span>
            {burgersData.boissons.map((it, j) => (
              <div key={j} className="m2__mini-row"><span>{it.name}</span><span>{it.price.toFixed(2)}€</span></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
