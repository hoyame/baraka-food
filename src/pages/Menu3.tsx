import { Fragment, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMenu } from '../hooks/useMenu'
import { imgUrl } from '../lib/api'
import { imgFloat, useSpotlight } from '../lib/menuMotion'
import LinkIndicator from '../components/LinkIndicator'
import logo from '../assets/logo.svg'
import tacosImg from '../assets/tacos.png'
import './Menu3.scss'

export default function Menu3() {
  const { menu, link } = useMenu()
  const reduced = useReducedMotion()
  const scaleCount = (menu?.page3.viandes.length ?? 0) + (menu?.page3.extras.items.length ?? 0)
  const scaleSpot = useSpotlight(scaleCount, 3200, reduced)
  const hasEntered = useRef(false)
  useEffect(() => { if (menu) hasEntered.current = true }, [menu])
  const entrance = <T,>(initial: T) => (hasEntered.current ? false : initial)

  if (!menu) return null

  const { page2, page3, note } = menu

  return (
    <div className="m3">
      <header className="m3__header">
        <LinkIndicator status={link} />
        <img className="m3__brand" src={logo} alt="Baraka Food" />
        <h1 className="m3__page-title">{page3.title}</h1>
        <div className="m3__head-right">
          <div className="m3__menu-note">
            <span>{note.label}</span>
            <strong>{note.price}</strong>
          </div>
          {note.img && (
            <img className="m3__note-img" src={imgUrl(note.img)} alt="" />
          )}
        </div>
      </header>

      <section className="m3__row m3__tailles">
        <div className="m3__tacos-hero">
          <motion.img className="m3__tacos-img" src={tacosImg} alt="Tacos" {...imgFloat(0, reduced)} />
        </div>
        <div className="m3__tailles-grid">
          {page3.tailles.map((t, i) => (
            <motion.div
              key={t.id}
              className={`m3__bcard${t.available ? '' : ' is-off'}`}
              initial={entrance({ opacity: 0, y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <span className="m3__taille-letter">{t.size}</span>
              <span className="m3__taille-viandes">{t.viandes}</span>
              <span className="m3__bcard-price">{t.price.toFixed(2)}€</span>
              {!t.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
          {page3.gratinage.length > 0 && (
            <motion.div
              className="m3__gratin-cell"
              initial={entrance({ opacity: 0, y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: page3.tailles.length * 0.08 }}
            >
              <div className="m3__gratin-square">
                {page3.gratinageImg && (
                  <motion.img
                    className="m3__gratin-img"
                    src={imgUrl(page3.gratinageImg)}
                    alt="Gratiné"
                    {...imgFloat(2, reduced)}
                  />
                )}
                <span className="m3__gratin-label">GRATINE TON TACOS</span>
                <span className="m3__gratin-price">{page3.gratinagePrice}</span>
                <div className="m3__gratin-items">
                  {page3.gratinage.map(g => (
                    <span key={g.id} className={g.available ? undefined : 'm3__sauce-item--off'}>
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="m3__row m3__viandes">
        <div className="m3__spine"><span>TA VIANDE</span></div>
        <div className="m3__grid m3__grid--6">
          {page3.viandes.map((v, i) => (
            <motion.div
              key={v.id}
              className={`m3__tcard${v.available ? '' : ' is-off'}`}
              initial={entrance({ opacity: 0, y: 12 })}
              animate={{ opacity: 1, y: 0, scale: v.available && scaleSpot === i ? 1.15 : 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img className="m3__img m3__img--md m3__img--photo" src={imgUrl(v.img)} alt={v.name} {...imgFloat(i, reduced)} />
              <span className="m3__tcard-name">{v.name}</span>
              {!v.available && <span className="off-badge">ÉPUISÉ</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="m3__row m3__sauces">
        {page3.saucesImg && (
          <div className="m3__sauces-hero">
            <motion.img
              className="m3__sauces-img"
              src={imgUrl(page3.saucesImg)}
              alt="Sauces"
              {...imgFloat(1, reduced)}
            />
          </div>
        )}
        <div className="m3__sauces-grid">
          <div className="m3__sauce-group">
            <span className="m3__sauce-sub">CLASSIQUES</span>
            <span className="m3__sauce-items">{page3.sauces.classiques.join(' · ')}</span>
          </div>
          {page2.boissons.length > 0 && (
            <div className="m3__sauce-group m3__sauce-group--hot">
              <span className="m3__sauce-sub">BOISSONS</span>
              <span className="m3__sauce-items">
                {page2.boissons.map((b, i) => (
                  <Fragment key={b.id}>
                    {i > 0 && ' · '}
                    <span className={b.available ? undefined : 'm3__sauce-item--off'}>
                      {b.name} {b.price.toFixed(2)}€
                    </span>
                  </Fragment>
                ))}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="m3__row m3__extras">
        <div className="m3__extras-main">
          <div className="m3__spine"><span>TES EXTRAS</span></div>
          <div className="m3__grid m3__grid--6">
            {page3.extras.items.map((e, i) => (
              <motion.div
                key={e.id}
                className={`m3__tcard${e.available ? '' : ' is-off'}`}
                initial={entrance({ opacity: 0, y: 12 })}
                animate={{ opacity: 1, y: 0, scale: e.available && scaleSpot === page3.viandes.length + i ? 1.15 : 1 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
              >
                <motion.img className="m3__img m3__img--md m3__img--photo" src={imgUrl(e.img)} alt={e.name} {...imgFloat(i, reduced)} />
                <span className="m3__tcard-name">{e.name}</span>
                {!e.available && <span className="off-badge">ÉPUISÉ</span>}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="m3__extras-price">
          <span>Supplément</span>
          <strong>{page3.extras.surcharge}</strong>
        </div>
      </section>
    </div>
  )
}
