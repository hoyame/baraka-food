'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Header.module.scss'

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/menu', label: 'Menu' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <Image src="/images/logo.svg" alt="Baraka Food" width={140} height={48} priority />
      </Link>

      <nav className={styles.nav}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.halal}>HALAL</div>
    </header>
  )
}
