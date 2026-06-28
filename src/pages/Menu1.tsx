import { motion, useReducedMotion } from 'framer-motion'
import { burgersData } from '../data/menu'
import { imgFloat, priceWave, useSpotlight } from '../lib/menuMotion'
import logo from '../assets/logo.svg'
import tendersImg from '../assets/tenders.png'
import nuggetsImg from '../assets/nuggets.png'
import sticksMozzaImg from '../assets/sticks-mozza.png'
import camambertImg from '../assets/camambert.png'
import wingsImg from '../assets/wings.png'
import jalapenosImg from '../assets/jalapenos.png'
import fritesImg from '../assets/frites.png'
import cheddarImg from '../assets/cheddar.png'
import oeufImg from '../assets/oeuf.png'
import jambonImg from '../assets/jambon.png'
import viandeHacheImg from '../assets/viandehache.png'
import burger1Img from '../assets/burger1.png'
import burger2Img from '../assets/burger2.png'
import burger3Img from '../assets/burger3.png'
import './Menu1.scss'

const TEXMEX_IMAGES = [tendersImg, nuggetsImg, sticksMozzaImg, camambertImg, wingsImg, jalapenosImg]
const SUPPLEMENT_IMAGES = [fritesImg, cheddarImg, oeufImg, jambonImg, viandeHacheImg]
const BURGER_IMAGES = [burger1Img, burger2Img]

const BURGER_CARDS = [
  { label: 'LE CLASSIQUE', name: 'Kefta ou Poulet', desc: 'Crudités · Fromage', price: 8.00 },
  { label: 'LE SIGNATURE', name: 'Poulet Mariné', desc: 'Crudités · Fromage', price: 8.50 },
]

const SUPPLEMENTS = [
  ...burgersData.supplements.plus1.map(name => ({ name, price: '+1€' })),
  ...burgersData.supplements.plus2.map(name => ({ name, price: '+2€' })),
]

const SCALE_COUNT = burgersData.texmex.length + SUPPLEMENTS.length

export default function Menu1() {
  const reduced = useReducedMotion()
  const scaleSpot = useSpotlight(SCALE_COUNT, 7000, reduced)

  return (
    <div className="m1">
      <header className="m1__header">
        <img className="m1__brand" src={logo} alt="Baraka Food" />
        <h1 className="m1__page-title">NOS BURGERS</h1>
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
            className="m1__bcard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <motion.img
              className="m1__img m1__img--lg m1__img--photo"
              src={BURGER_IMAGES[i]}
              alt={item.name}
              {...imgFloat(i, reduced)}
            />
            <div className="m1__bcard-text">
              <p className="m1__bcard-label">{item.label}</p>
              <h2 className="m1__bcard-name">{item.name}</h2>
              <p className="m1__bcard-desc">{item.desc}</p>
            </div>
            <span className="m1__bcard-price">{item.price.toFixed(2)}€</span>
          </motion.div>
        ))}

        <motion.div
          className="m1__bcard"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <motion.img
            className="m1__img m1__img--lg m1__img--photo"
            src={burger3Img}
            alt="Crunchy"
            {...imgFloat(2, reduced)}
          />
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
              <motion.img
                className="m1__img m1__img--md m1__img--photo"
                src={TEXMEX_IMAGES[i]}
                alt={item.name}
                {...imgFloat(i, reduced)}
              />
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
              <motion.img
                className="m1__img m1__img--md m1__img--photo"
                src={SUPPLEMENT_IMAGES[i]}
                alt={item.name}
                {...imgFloat(i, reduced)}
              />
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
