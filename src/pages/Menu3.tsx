import { motion, useReducedMotion } from 'framer-motion'
import { tacosData } from '../data/menu'
import { imgFloat, priceWave, useSpotlight } from '../lib/menuMotion'
import logo from '../assets/logo.svg'
import tendersImg from '../assets/tenders.png'
import nuggetsImg from '../assets/nuggets.png'
import viandeHacheImg from '../assets/viandehache.png'
import escalopeImg from '../assets/escalope.png'
import pouletMarineImg from '../assets/poulet-marine.png'
import cordonBleuImg from '../assets/cordonbleu.png'
import cheddarImg from '../assets/cheddar.png'
import emmentalRapeImg from '../assets/emmental-rape.png'
import chevreImg from '../assets/chevre.png'
import racletteImg from '../assets/raclette.png'
import oignonsCrispyImg from '../assets/oignons-crispy.png'
import jambonImg from '../assets/jambon.png'
import './Menu3.scss'

// ordre = tacosData.viandes : Kefta, Poulet, Poulet Mariné, Cordon Bleu, Tenders, Nuggets
const VIANDE_IMAGES = [viandeHacheImg, escalopeImg, pouletMarineImg, cordonBleuImg, tendersImg, nuggetsImg]
// ordre = tacosData.extras.items : Cheddar, Emmental Râpé, Chèvre, Raclette, Oignons Frits, Jambon
const EXTRA_IMAGES = [cheddarImg, emmentalRapeImg, chevreImg, racletteImg, oignonsCrispyImg, jambonImg]

const SCALE_COUNT = tacosData.viandes.length + tacosData.extras.items.length

export default function Menu3() {
  const reduced = useReducedMotion()
  const tailleSpot = useSpotlight(tacosData.tailles.length, 9000, reduced)
  const scaleSpot = useSpotlight(SCALE_COUNT, 7000, reduced)

  return (
    <div className="m3">
      <header className="m3__header">
        <img className="m3__brand" src={logo} alt="Baraka Food" />
        <h1 className="m3__page-title">COMPOSE TON TACOS</h1>
        <div className="m3__head-right">
          <div className="m3__menu-note">
            <span>Menu Frites + Boisson</span>
            <strong>+3.50€</strong>
          </div>
          <div className="m3__halal">HALAL</div>
        </div>
      </header>

      {/* ── TON STYLE (M/L/XL) ── */}
      <section className="m3__row m3__tailles">
        {tacosData.tailles.map((t, i) => (
          <motion.div
            key={i}
            className={`m3__bcard${tailleSpot === i ? ' m3__bcard--active' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <span className="m3__taille-letter">{t.size}</span>
            <div className="m3__bcard-text">
              <span className="m3__taille-viandes">{t.viandes}</span>
            </div>
            <motion.span className="m3__bcard-price" {...priceWave(i, reduced)}>
              {t.price.toFixed(2)}€
            </motion.span>
          </motion.div>
        ))}
      </section>

      {/* ── TA VIANDE ── */}
      <section className="m3__row m3__viandes">
        <div className="m3__spine"><span>TA VIANDE</span></div>
        <div className="m3__grid m3__grid--6">
          {tacosData.viandes.map((v, i) => (
            <motion.div
              key={i}
              className="m3__tcard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: scaleSpot === i ? 1.09 : 1 }}
              transition={{ duration: 1.6, delay: 0.1 + i * 0.05 }}
            >
              <motion.img className="m3__img m3__img--md m3__img--photo" src={VIANDE_IMAGES[i]} alt={v.name} {...imgFloat(i, reduced)} />
              <span className="m3__tcard-name">{v.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TES SAUCES ── */}
      <section className="m3__row m3__sauces">
        <div className="m3__spine"><span>TES SAUCES</span></div>
        <div className="m3__sauces-grid">
          <div className="m3__sauce-group">
            <span className="m3__sauce-sub">CLASSIQUES</span>
            <span className="m3__sauce-items">{tacosData.sauces.classiques.join(' · ')}</span>
          </div>
          <div className="m3__sauce-group m3__sauce-group--hot">
            <span className="m3__sauce-sub">PIQUANTES</span>
            <span className="m3__sauce-items">{tacosData.sauces.piquantes.join(' · ')}</span>
          </div>
        </div>
      </section>

      {/* ── TES EXTRAS ── */}
      <section className="m3__row m3__extras">
        <div className="m3__extras-main">
          <div className="m3__spine"><span>TES EXTRAS</span></div>
          <div className="m3__grid m3__grid--6">
            {tacosData.extras.items.map((e, i) => (
              <motion.div
                key={i}
                className="m3__tcard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, scale: scaleSpot === tacosData.viandes.length + i ? 1.09 : 1 }}
                transition={{ duration: 1.6, delay: 0.1 + i * 0.05 }}
              >
                <motion.img className="m3__img m3__img--md m3__img--photo" src={EXTRA_IMAGES[i]} alt={e} {...imgFloat(i, reduced)} />
                <span className="m3__tcard-name">{e}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="m3__extras-price">
          <span>Supplément</span>
          <strong>{tacosData.extras.surcharge}</strong>
        </div>
      </section>

    </div>
  )
}
