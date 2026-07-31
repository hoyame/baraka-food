import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMenu } from '../hooks/useMenu'
import { imgUrl } from '../lib/api'
import { imgFloat, useSpotlight } from '../lib/menuMotion'
import logo from '../assets/logo.svg'
import './Menu2.scss'

export default function Menu2() {
  const menu = useMenu()
  const reduced = useReducedMotion()
  const scaleCount = (menu?.page2.classiques.length ?? 0) + (menu?.supplements.length ?? 0)
  const scaleSpot = useSpotlight(scaleCount, 3200, reduced)
  const hasEntered = useRef(false)
  useEffect(() => { if (menu) hasEntered.current = true }, [menu])
  const entrance = <T,>(initial: T) => (hasEntered.current ? false : initial)

  if (!menu) return null

  const { page2, supplements, note } = menu

  return (
    <div className="m2">
      <header className="m2__header">
        <img className="m2__brand" src={logo} alt="Baraka Food" />
        <h1 className="m2__page-title">{page2.title}</h1>
        <div className="m2__head-right">
          <div className="m2__menu-note">
            <span>{note.label}</span>
            <strong>{note.price}</strong>
          </div>
          <div className="m2__halal">HALAL</div>
        </div>
      </header>

      <section className="m2__row m2__classiques">
        <div className="m2__spine"><span>CLASSIQUES</span></div>
        <div className="m2__classiques-grid">
          {page2.classiques.map((item, i) => (
            <motion.div
              key={item.id}
              className={`m2__tcard${item.available ? '' : ' is-off'}`}
              initial={entrance({ opacity: 0, y: 12 })}
              animate={{ opacity: 1, y: 0, scale: item.available && scaleSpot === i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img
                className="m2__img m2__img--md m2__img--photo"
                src={imgUrl(item.img)}
                alt={item.name}
                {...imgFloat(i, reduced)}
              />
              <span className="m2__tcard-name">{item.name}</span>
              <span className="m2__tcard-price">{item.price.toFixed(2)}€</span>
              {!item.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="m2__row m2__featured-row">
        <motion.div
          className={`m2__bcard m2__bcard--featured${page2.crunchy.available ? '' : ' is-off'}`}
          initial={entrance({ opacity: 0, y: 16 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <motion.img
            className="m2__img m2__img--lg m2__img--photo"
            src={imgUrl(page2.crunchy.img)}
            alt={page2.crunchy.name}
            {...imgFloat(0, reduced)}
          />
          <div className="m2__bcard-text">
            <p className="m2__bcard-label">{page2.crunchy.label}</p>
            <h2 className="m2__bcard-name m2__bcard-name--xl">{page2.crunchy.name}</h2>
            <p className="m2__bcard-desc">{page2.crunchy.desc}</p>
          </div>
          <span className="m2__bcard-price">{page2.crunchy.price.toFixed(2)}€</span>
          {!page2.crunchy.available && <span className="off-badge">ÉPUISÉ</span>}
        </motion.div>
      </section>

      <section className="m2__row m2__sups">
        <div className="m2__spine"><span>SUPPLÉMENTS</span></div>
        <div className="m2__sups-grid">
          {supplements.map((item, i) => (
            <motion.div
              key={item.id}
              className={`m2__tcard${item.available ? '' : ' is-off'}`}
              initial={entrance({ opacity: 0, y: 12 })}
              animate={{ opacity: 1, y: 0, scale: item.available && scaleSpot === page2.classiques.length + i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img
                className="m2__img m2__img--md m2__img--photo"
                src={imgUrl(item.img)}
                alt={item.name}
                {...imgFloat(i, reduced)}
              />
              <span className="m2__tcard-name">{item.name}</span>
              <span className="m2__tcard-price">{item.price}</span>
              {!item.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="m2__row m2__bottom">
        <div className={`m2__menukids${page2.menuKids.available ? '' : ' is-off'}`}>
          <motion.img
            className="m2__img m2__img--md m2__img--photo"
            src={imgUrl(page2.menuKids.img)}
            alt={page2.menuKids.name}
            {...imgFloat(0, reduced)}
          />
          <div className="m2__menukids-text">
            <span className="m2__menukids-title">{page2.menuKids.name}</span>
            <p className="m2__menukids-desc">{page2.menuKids.desc}</p>
          </div>
          <span className="m2__menukids-price">{page2.menuKids.price.toFixed(2)}€</span>
          {!page2.menuKids.available && <span className="off-badge">ÉPUISÉ</span>}
        </div>

        <div className="m2__plus">
          {([
            ['FRITES', page2.frites],
            ['DESSERTS', page2.desserts],
            ['BOISSONS', page2.boissons],
          ] as const).map(([title, items]) => (
            <div key={title} className="m2__plus-col">
              <span className="m2__plus-title">{title}</span>
              {items.map(it => (
                <div key={it.id} className={`m2__mini-row${it.available ? '' : ' m2__mini-row--off'}`}>
                  <span>{it.name}</span>
                  <span>{it.price.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
