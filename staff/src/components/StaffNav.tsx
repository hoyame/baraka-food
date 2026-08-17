'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './StaffNav.module.scss'

const links = [
  { href: '/salle', label: 'Salle' },
  { href: '/cuisine', label: 'Cuisine' },
  { href: '/commande', label: 'Commandes' },
]

export default function StaffNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`${styles.link}${pathname === link.href ? ` ${styles.linkActive}` : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
