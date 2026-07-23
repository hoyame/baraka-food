import Image from 'next/image'
import styles from './Footer.module.scss'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Image className={styles.brand} src="/images/logo.svg" alt="Baraka Food" width={160} height={76} />

      <div className={styles.grid}>
        <div className={styles.col}>
          <span className={styles.colTitle}>Adresse</span>
          <p>Place Clemenceau</p>
          <p>73100 Aix-les-Bains</p>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Horaires</span>
          <p>Lun – Dim : 11h30 – 22h30</p>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Contact</span>
          <p>04 79 00 00 00</p>
          <p>contact@barakafood.fr</p>
        </div>
      </div>

      <p className={styles.bottom}>© {new Date().getFullYear()} Baraka Food — Aix-les-Bains</p>
    </footer>
  )
}
