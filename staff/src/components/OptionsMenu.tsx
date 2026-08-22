'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './OptionsMenu.module.scss'

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
