'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './OptionsMenu.module.scss'

export function OptionInfo({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className={styles.info}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValeur}>{valeur}</span>
    </div>
  )
}

export function OptionToggle({
  label,
  actif,
  onToggle,
}: {
  label: string
  actif: boolean
  onToggle: () => void
}) {
  return (
    <button className={styles.ligne} onClick={onToggle} role="switch" aria-checked={actif}>
      <span className={styles.ligneLabel}>{label}</span>
      <span className={`${styles.switch}${actif ? ` ${styles.switchOn}` : ''}`} aria-hidden="true">
        <span className={styles.switchPastille} />
      </span>
    </button>
  )
}

export function OptionAction({
  label,
  onClick,
  ton = 'neutre',
}: {
  label: string
  onClick: () => void
  ton?: 'neutre' | 'danger' | 'valide'
}) {
  return (
    <button className={`${styles.action} ${styles[`action_${ton}`]}`} onClick={onClick}>
      {label}
    </button>
  )
}

export default function OptionsMenu({ children }: { children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false)
  const bloc = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ouvert) return
    const dehors = (e: MouseEvent) => {
      if (bloc.current && !bloc.current.contains(e.target as Node)) setOuvert(false)
    }
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('mousedown', dehors)
    document.addEventListener('keydown', echap)
    return () => {
      document.removeEventListener('mousedown', dehors)
      document.removeEventListener('keydown', echap)
    }
  }, [ouvert])

  return (
    <div className={styles.wrap} ref={bloc}>
      <button
        className={`${styles.btn}${ouvert ? ` ${styles.btnOn}` : ''}`}
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
      >
        <span>Options</span>
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
          <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {ouvert && <div className={styles.panneau}>{children}</div>}
    </div>
  )
}
