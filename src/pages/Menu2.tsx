import { Fragment, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMenu } from '../hooks/useMenu'
import { imgUrl } from '../lib/api'
import { imgFloat, useSpotlight } from '../lib/menuMotion'
import ReadyAnnouncer from '../components/ReadyAnnouncer'
import logo from '../assets/logo.svg'
import './Menu2.scss'

export default function Menu2() {
  const menu = useMenu()
  const reduced = useReducedMotion()
  const scaleCount = (menu?.page3.viandes.length ?? 0) + (menu?.page3.extras.items.length ?? 0) + (menu?.page1.texmex.length ?? 0)
  const scaleSpot = useSpotlight(scaleCount, 3200, reduced)
  const hasEntered = useRef(false)
  useEffect(() => { if (menu) hasEntered.current = true }, [menu])
  const entrance = <T,>(initial: T) => (hasEntered.current ? false : initial)

  if (!menu) return null

  const { page1, page2, page3, note } = menu
  const { sandwich } = page2
  const viandes = page3.viandes
  const inclus = sandwich.inclus

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

      <section className="m2__row m2__compose">
        <div className="m2__sandwich-hero">
          <motion.img
            className="m2__sandwich-img"
            src={imgUrl(sandwich.img)}
            alt="Sandwich"
            {...imgFloat(0, reduced)}
          />
        </div>
        <div className="m2__formules">
          <motion.div
            className={`m2__fcard${sandwich.available ? '' : ' is-off'}`}
            initial={entrance({ opacity: 0, y: 16 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="m2__fcard-count">1</span>
            <span className="m2__fcard-label">VIANDE AU CHOIX</span>
            {inclus && <span className="m2__fcard-inclus">{inclus} inclus</span>}
            <span className="m2__fcard-price">{sandwich.prixSimple.toFixed(2)}€</span>
            {!sandwich.available && <span className="off-badge">ÉPUISÉ</span>}
          </motion.div>
          <motion.div
            className={`m2__fcard${sandwich.available ? '' : ' is-off'}`}
            initial={entrance({ opacity: 0, y: 16 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <span className="m2__fcard-count">2</span>
            <span className="m2__fcard-label">DOUBLE VIANDE</span>
            {inclus && <span className="m2__fcard-inclus">{inclus} inclus</span>}
            <span className="m2__fcard-price">{sandwich.prixDouble.toFixed(2)}€</span>
            {!sandwich.available && <span className="off-badge">ÉPUISÉ</span>}
          </motion.div>
        </div>
      </section>

      <section className="m2__row m2__viandes">
        <div className="m2__spine"><span>TA VIANDE</span></div>
        <div className="m2__viandes-grid">
          {viandes.map((v, i) => (
            <motion.div
              key={v.id}
              className={`m2__tcard${v.available ? '' : ' is-off'}`}
              initial={entrance({ opacity: 0, y: 12 })}
              animate={{ opacity: 1, y: 0, scale: v.available && scaleSpot === i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img
                className="m2__img m2__img--md m2__img--photo"
                src={imgUrl(v.img)}
                alt={v.name}
                {...imgFloat(i, reduced)}
              />
              <span className="m2__tcard-name">{v.name}</span>
              {!v.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="m2__row m2__extras">
        <div className="m2__spine"><span>TES EXTRAS</span></div>
        <div className="m2__extras-grid">
          {page3.extras.items.map((e, i) => (
            <motion.div
              key={e.id}
              className={`m2__tcard${e.available ? '' : ' is-off'}`}
              initial={entrance({ opacity: 0, y: 12 })}
              animate={{ opacity: 1, y: 0, scale: e.available && scaleSpot === viandes.length + i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img
                className="m2__img m2__img--md m2__img--photo"
                src={imgUrl(e.img)}
                alt={e.name}
                {...imgFloat(i, reduced)}
              />
              <span className="m2__tcard-name">{e.name}</span>
              <span className="m2__tcard-price m2__tcard-price--sm">{page3.extras.surcharge}</span>
              {!e.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="m2__row m2__bottom">
        <div className="m2__frites">
          <div className="m2__spine"><span>FRITES</span></div>
          {page2.fritesImg && (
            <div className="m2__frites-hero">
              <motion.img
                className="m2__frites-img"
                src={imgUrl(page2.fritesImg)}
                alt="Frites"
                {...imgFloat(0, reduced)}
              />
            </div>
          )}
          <div className="m2__frites-sizes">
            {page2.frites.map(it => (
              <div key={it.id} className={`m2__fsize${it.available ? '' : ' is-off'}`}>
                <span className="m2__fsize-name">{it.name}</span>
                <span className="m2__fsize-price">{it.price.toFixed(2)}€</span>
              </div>
            ))}
          </div>
          {page2.friteSupplements.length > 0 && (
            <div className="m2__frites-sups">
              <span className="m2__frites-sups-label">SUPPLÉMENT</span>
              <strong className="m2__frites-sups-price">{page2.friteSupplementsPrice}</strong>
              <span className="m2__frites-sups-items">
                {page2.friteSupplements.map((sup, i) => (
                  <Fragment key={sup.id}>
                    {i > 0 && ' · '}
                    <span className={sup.available ? undefined : 'm2__frites-sup--off'}>{sup.name}</span>
                  </Fragment>
                ))}
              </span>
            </div>
          )}
        </div>

        <div className="m2__texmex">
          <div className="m2__spine"><span>TEX-MEX</span></div>
          <div className="m2__texmex-grid">
            {page1.texmex.map((item, i) => (
              <motion.div
                key={item.id}
                className={`m2__tcard${item.available ? '' : ' is-off'}`}
                initial={entrance({ opacity: 0, y: 12 })}
                animate={{ opacity: 1, y: 0, scale: item.available && scaleSpot === viandes.length + page3.extras.items.length + i ? 1.15 : 1 }}
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
        </div>
      </section>
      <ReadyAnnouncer />
    </div>
  )
}
