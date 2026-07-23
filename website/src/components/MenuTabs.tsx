'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from '../app/page.module.scss'
import type { MenuData } from '@/lib/menu'

const tabs = ['Burgers', 'Sandwichs', 'Tacos'] as const
type Tab = (typeof tabs)[number]

export default function MenuTabs({ menu }: { menu: MenuData }) {
  const [active, setActive] = useState<Tab>('Burgers')
  const { note, supplements, page1, page2, page3 } = menu

  return (
    <>
      <header className={styles.header}>
        <Image className={styles.headerLogo} src="/images/logo.svg" alt="Baraka Food" width={110} height={52} priority />

        <div className={styles.note}>
          <span>{note.label}</span>
          <strong>{note.price}</strong>
        </div>
      </header>

      <section className={styles.menuHeader}>
        <h2 className={styles.title}>Le Menu</h2>
      </section>

      <nav className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab}${active === tab ? ` ${styles.tabActive}` : ''}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {active === 'Burgers' && (
        <>
          <section className={styles.row}>
            {page1.burgers.map((b) => (
              <div key={b.id} className={`${styles.bcard}${!b.available ? ` ${styles.off}` : ''}`}>
                <div className={styles.bcardImg}>
                  <Image src={b.img} alt={b.name} width={160} height={160} />
                </div>
                <p className={styles.bcardLabel}>{b.label}</p>
                <h3 className={`${styles.bcardName}${b.featured ? ` ${styles.bcardNameXl}` : ''}`}>{b.name}</h3>
                <p className={styles.bcardDesc}>{b.desc}</p>
                <span className={styles.bcardPrice}>{b.price.toFixed(2)}€</span>
                {!b.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
              </div>
            ))}
          </section>

          <section className={styles.row}>
            <div className={styles.spine}><span>Tex-Mex</span></div>
            <div className={styles.tcardGrid}>
              {page1.texmex.map((t) => (
                <div key={t.id} className={`${styles.tcard}${!t.available ? ` ${styles.off}` : ''}`}>
                  {t.img && (
                    <div className={styles.tcardImg}>
                      <Image src={t.img} alt={t.name} width={90} height={90} />
                    </div>
                  )}
                  <span className={styles.tcardName}>{t.name}</span>
                  <span className={styles.tcardPrice}>{t.price.toFixed(2)}€</span>
                  {!t.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.row}>
            <div className={styles.spine}><span>Suppléments</span></div>
            <div className={styles.tcardGrid}>
              {supplements.map((s) => (
                <div key={s.id} className={`${styles.tcard}${!s.available ? ` ${styles.off}` : ''}`}>
                  <div className={styles.tcardImg}>
                    <Image src={s.img} alt={s.name} width={90} height={90} />
                  </div>
                  <span className={styles.tcardName}>{s.name}</span>
                  <span className={styles.tcardPrice}>{s.price}</span>
                  {!s.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {active === 'Sandwichs' && (
        <>
          <section className={styles.row}>
            <div className={styles.spine}><span>Classiques</span></div>
            <div className={styles.tcardGrid}>
              {page2.classiques.map((c) => (
                <div key={c.id} className={`${styles.tcard}${!c.available ? ` ${styles.off}` : ''}`}>
                  <div className={styles.tcardImg}>
                    <Image src={c.img} alt={c.name} width={90} height={90} />
                  </div>
                  <span className={styles.tcardName}>{c.name}</span>
                  <span className={styles.tcardPrice}>{c.price.toFixed(2)}€</span>
                  {!c.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
                </div>
              ))}
            </div>
          </section>

          <section className={`${styles.featured}${!page2.crunchy.available ? ` ${styles.off}` : ''}`}>
            <div className={styles.featuredImg}>
              <Image src={page2.crunchy.img} alt={page2.crunchy.name} width={220} height={220} />
            </div>
            <div className={styles.featuredText}>
              <p className={styles.featuredLabel}>{page2.crunchy.label}</p>
              <h2 className={styles.featuredName}>{page2.crunchy.name}</h2>
              <p className={styles.featuredDesc}>{page2.crunchy.desc}</p>
            </div>
            <span className={styles.featuredPrice}>{page2.crunchy.price.toFixed(2)}€</span>
            {!page2.crunchy.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
          </section>

          <section className={`${styles.kids}${!page2.menuKids.available ? ` ${styles.off}` : ''}`}>
            <div className={styles.featuredImg}>
              <Image src={page2.menuKids.img} alt={page2.menuKids.name} width={160} height={160} />
            </div>
            <div className={styles.featuredText}>
              <h2 className={styles.featuredName}>{page2.menuKids.name}</h2>
              <p className={styles.featuredDesc}>{page2.menuKids.desc}</p>
            </div>
            <span className={styles.featuredPrice}>{page2.menuKids.price.toFixed(2)}€</span>
            {!page2.menuKids.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
          </section>

          <section className={styles.plusRow}>
            {([
              ['Frites', page2.frites],
              ['Desserts', page2.desserts],
              ['Boissons', page2.boissons],
            ] as const).map(([title, items]) => (
              <div key={title} className={styles.plusCol}>
                <span className={styles.plusTitle}>{title}</span>
                {items.map((it) => (
                  <div key={it.id} className={`${styles.miniRow}${!it.available ? ` ${styles.miniRowOff}` : ''}`}>
                    <span>{it.name}</span>
                    <span>{it.price.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </>
      )}

      {active === 'Tacos' && (
        <>
          <section className={styles.row}>
            <div className={styles.tacosGrid}>
              {page3.tailles.map((t) => (
                <div key={t.id} className={`${styles.tailleCard}${!t.available ? ` ${styles.off}` : ''}`}>
                  <span className={styles.tailleLetter}>{t.size}</span>
                  <span className={styles.tailleViandes}>{t.viandes}</span>
                  <span className={styles.bcardPrice}>{t.price.toFixed(2)}€</span>
                  {!t.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.row}>
            <div className={styles.spine}><span>Ta viande</span></div>
            <div className={styles.tcardGrid}>
              {page3.viandes.map((v) => (
                <div key={v.id} className={`${styles.tcard}${!v.available ? ` ${styles.off}` : ''}`}>
                  <div className={styles.tcardImg}>
                    <Image src={v.img} alt={v.name} width={90} height={90} />
                  </div>
                  <span className={styles.tcardName}>{v.name}</span>
                  {!v.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sauces}>
            <div className={styles.sauceGroup}>
              <span className={styles.plusTitle}>Classiques</span>
              <p className={styles.sauceItems}>{page3.sauces.classiques.join(' · ')}</p>
            </div>
            <div className={`${styles.sauceGroup} ${styles.sauceGroupHot}`}>
              <span className={styles.plusTitle}>Piquantes</span>
              <p className={styles.sauceItems}>{page3.sauces.piquantes.join(' · ')}</p>
            </div>
          </section>

          <section className={styles.row}>
            <div className={styles.spine}><span>Tes extras</span></div>
            <div className={styles.tcardGrid}>
              {page3.extras.items.map((e) => (
                <div key={e.id} className={`${styles.tcard}${!e.available ? ` ${styles.off}` : ''}`}>
                  <div className={styles.tcardImg}>
                    <Image src={e.img} alt={e.name} width={90} height={90} />
                  </div>
                  <span className={styles.tcardName}>{e.name}</span>
                  {!e.available && <span className={styles.offBadge}>ÉPUISÉ</span>}
                </div>
              ))}
            </div>
          </section>
          <section className={styles.extrasPrice}>
            <span>Supplément</span>
            <strong>{page3.extras.surcharge}</strong>
          </section>
        </>
      )}
    </>
  )
}
