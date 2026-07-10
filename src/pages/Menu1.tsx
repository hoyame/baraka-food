import { motion, useReducedMotion } from 'framer-motion'
import { useMenu } from '../hooks/useMenu'
import { imgUrl } from '../lib/api'
import { imgFloat, useSpotlight } from '../lib/menuMotion'
import logo from '../assets/logo.svg'
import './Menu1.scss'

export default function Menu1() {
  const menu = useMenu()
  const reduced = useReducedMotion()
  const scaleCount = (menu?.page1.texmex.length ?? 0) + (menu?.supplements.length ?? 0)
  const scaleSpot = useSpotlight(scaleCount, 3200, reduced)

  if (!menu) return null

  const { page1, supplements, note } = menu

  return (
    <div className="m1">
      <header className="m1__header">
        <img className="m1__brand" src={logo} alt="Baraka Food" />
        <h1 className="m1__page-title">{page1.title}</h1>
        <div className="m1__head-right">
          <div className="m1__menu-note">
            <span>{note.label}</span>
            <strong>{note.price}</strong>
          </div>
          <div className="m1__halal">HALAL</div>
        </div>
      </header>

      <section className="m1__row m1__burgers">
        {page1.burgers.map((item, i) => (
          <motion.div
            key={item.id}
            className={`m1__bcard${item.available ? '' : ' is-off'}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <motion.img
              className="m1__img m1__img--lg m1__img--photo"
              src={imgUrl(item.img)}
              alt={item.name}
              {...imgFloat(i, reduced)}
            />
            <div className="m1__bcard-text">
              <p className="m1__bcard-label">{item.label}</p>
              <h2 className={`m1__bcard-name${item.featured ? ' m1__bcard-name--xl' : ''}`}>{item.name}</h2>
              <p className="m1__bcard-desc">{item.desc}</p>
            </div>
            <span className="m1__bcard-price">{item.price.toFixed(2)}€</span>
            {!item.available && <span className="off-badge">ÉPUISÉ</span>}
          </motion.div>
        ))}
      </section>

      <section className="m1__row m1__texmex">
        <div className="m1__spine"><span>TEXMEX</span></div>
        <div className="m1__texmex-grid">
          {page1.texmex.map((item, i) => (
            <motion.div
              key={item.id}
              className={`m1__tcard${item.available ? '' : ' is-off'}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: item.available && scaleSpot === i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img
                className="m1__img m1__img--md m1__img--photo"
                src={imgUrl(item.img)}
                alt={item.name}
                {...imgFloat(i, reduced)}
              />
              <span className="m1__tcard-name">{item.name}</span>
              <span className="m1__tcard-price">{item.price.toFixed(2)}€</span>
              {!item.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="m1__row m1__sups">
        <div className="m1__spine"><span>SUPPLÉMENTS</span></div>
        <div className="m1__sups-grid">
          {supplements.map((item, i) => (
            <motion.div
              key={item.id}
              className={`m1__tcard${item.available ? '' : ' is-off'}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: item.available && scaleSpot === page1.texmex.length + i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img
                className="m1__img m1__img--md m1__img--photo"
                src={imgUrl(item.img)}
                alt={item.name}
                {...imgFloat(i, reduced)}
              />
              <span className="m1__tcard-name">{item.name}</span>
              <span className="m1__tcard-price">{item.price}</span>
              {!item.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
