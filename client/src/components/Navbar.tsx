'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './Navbar.module.scss'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://barakafood.fr'

const liens = [
  { href: SITE_URL, label: 'Accueil' },
  { href: `${SITE_URL}/menu`, label: 'Menu' },
  { href: `${SITE_URL}/horaires`, label: 'Horaires' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <a className={styles.brand} href={SITE_URL}>
          <img src="/logo.svg" alt="Baraka Food" />
        </a>

        <div className={styles.desktopLinks}>
          {liens.map((lien) => (
            <a key={lien.href} href={lien.href} className={styles.link}>
              {lien.label}
            </a>
          ))}
          <a
            className={`${styles.link}${pathname === '/livraison' ? ` ${styles.linkActive}` : ''}`}
            href="/livraison"
          >
            Suivre ma livraison
          </a>
          <a className={styles.cta} href="/">
            Suivre ma commande
          </a>
        </div>

        <button
          className={styles.burger}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <span className={`${styles.burgerLine}${open ? ` ${styles.burgerLineTop}` : ''}`} />
          <span className={`${styles.burgerLine}${open ? ` ${styles.burgerLineMid}` : ''}`} />
          <span className={`${styles.burgerLine}${open ? ` ${styles.burgerLineBot}` : ''}`} />
        </button>
      </div>

      <div className={`${styles.drawer}${open ? ` ${styles.drawerOpen}` : ''}`}>
        <div className={styles.drawerInner}>
          {liens.map((lien) => (
            <a key={lien.href} href={lien.href} className={styles.drawerLink}>
              {lien.label}
            </a>
          ))}
          <a
            className={`${styles.drawerLink}${pathname === '/livraison' ? ` ${styles.drawerLinkActive}` : ''}`}
            href="/livraison"
          >
            Suivre ma livraison
          </a>
          <a className={styles.drawerCta} href="/">
            Suivre ma commande
          </a>
        </div>
      </div>
    </nav>
  )
}
