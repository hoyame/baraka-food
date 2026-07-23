import Image from 'next/image'
import type { Metadata } from 'next'
import styles from './menu.module.scss'
import {
  menuNote,
  burgers,
  texmex,
  sandwichs,
  menuKids,
  tacosTailles,
  tacosViandes,
  sauces,
  extras,
  supplements,
  frites,
  desserts,
  boissons,
} from '@/data/menu'

export const metadata: Metadata = {
  title: 'Menu — Baraka Food Aix-les-Bains',
  description: 'Découvrez le menu complet de Baraka Food : burgers, sandwichs, tacos et suppléments.',
}

export default function MenuPage() {
  return (
    <main className={styles.main}>
      <section className={styles.intro}>
        <span className={styles.eyebrow}>Notre carte</span>
        <h1>Le menu</h1>
        <div className={styles.note}>
          <span>{menuNote.label}</span>
          <strong>{menuNote.price}</strong>
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Nos burgers</h2>
        <div className={styles.burgerGrid}>
          {burgers.map((b) => (
            <div key={b.name} className={`${styles.burgerCard} ${b.featured ? styles.burgerCardFeatured : ''}`}>
              {b.img && (
                <div className={styles.burgerImg}>
                  <Image src={b.img} alt={b.name} width={180} height={180} />
                </div>
              )}
              <p className={styles.itemLabel}>{b.label}</p>
              <h3 className={styles.itemName}>{b.name}</h3>
              <p className={styles.itemDesc}>{b.desc}</p>
              <span className={styles.itemPrice}>{b.price}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Tex-Mex</h2>
        <div className={styles.rowGrid}>
          {texmex.map((t) => (
            <div key={t.name} className={styles.rowCard}>
              <span className={styles.rowName}>{t.name}</span>
              <span className={styles.rowPrice}>{t.price}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Les sandwichs</h2>
        <div className={styles.rowGrid}>
          {sandwichs.map((s) => (
            <div key={s.name} className={styles.rowCard}>
              <span className={styles.rowName}>{s.name}</span>
              <span className={styles.rowPrice}>{s.price}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Compose ton tacos</h2>

        <div className={styles.tacosSizes}>
          {tacosTailles.map((t) => (
            <div key={t.size} className={styles.tacosSize}>
              <span className={styles.tacosSizeLabel}>{t.size}</span>
              <span className={styles.tacosSizeDesc}>{t.viandes}</span>
              <span className={styles.itemPrice}>{t.price}</span>
            </div>
          ))}
        </div>

        <div className={styles.tacosOptions}>
          <div>
            <span className={styles.optTitle}>Viandes</span>
            <div className={styles.tags}>
              {tacosViandes.map((v) => (
                <span key={v} className={styles.tag}>{v}</span>
              ))}
            </div>
          </div>

          <div>
            <span className={styles.optTitle}>Sauces classiques</span>
            <div className={styles.tags}>
              {sauces.classiques.map((s) => (
                <span key={s} className={styles.tag}>{s}</span>
              ))}
            </div>
          </div>

          <div>
            <span className={styles.optTitle}>Sauces piquantes</span>
            <div className={styles.tags}>
              {sauces.piquantes.map((s) => (
                <span key={s} className={styles.tag}>{s}</span>
              ))}
            </div>
          </div>

          <div>
            <span className={styles.optTitle}>Extras {extras.surcharge}</span>
            <div className={styles.tags}>
              {extras.items.map((e) => (
                <span key={e} className={styles.tag}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Menu Kids</h2>
        <div className={styles.kidsCard}>
          <h3 className={styles.itemName}>{menuKids.name}</h3>
          <p className={styles.itemDesc}>{menuKids.desc}</p>
          <span className={styles.itemPrice}>{menuKids.price}</span>
        </div>
      </section>

      <section className={`${styles.block} ${styles.plusSection}`}>
        <div className={styles.plusCol}>
          <h2 className={styles.blockTitle}>Suppléments</h2>
          {supplements.map((s) => (
            <div key={s.name} className={styles.plusRow}>
              <span>{s.name}</span>
              <span>{s.price}</span>
            </div>
          ))}
        </div>

        <div className={styles.plusCol}>
          <h2 className={styles.blockTitle}>Frites</h2>
          {frites.map((f) => (
            <div key={f.name} className={styles.plusRow}>
              <span>{f.name}</span>
              <span>{f.price}</span>
            </div>
          ))}

          <h2 className={styles.blockTitle} style={{ marginTop: '2rem' }}>Desserts</h2>
          {desserts.map((d) => (
            <div key={d.name} className={styles.plusRow}>
              <span>{d.name}</span>
              <span>{d.price}</span>
            </div>
          ))}
        </div>

        <div className={styles.plusCol}>
          <h2 className={styles.blockTitle}>Boissons</h2>
          {boissons.map((b) => (
            <div key={b.name} className={styles.plusRow}>
              <span>{b.name}</span>
              <span>{b.price}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
