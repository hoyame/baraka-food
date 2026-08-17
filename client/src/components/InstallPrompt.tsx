'use client'

import { useEffect, useState } from 'react'
import styles from './InstallPrompt.module.scss'

type InstallEvent = Event & { prompt: () => Promise<void> }

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const [mode, setMode] = useState<'hidden' | 'android' | 'ios'>('hidden')
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null)
  const [showTuto, setShowTuto] = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem('install-vu') === '1') return

    if (isIos()) {
      setMode('ios')
      return
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    localStorage.setItem('install-vu', '1')
    setMode('hidden')
  }

  if (mode === 'hidden') return null

  return (
    <div className={styles.box}>
      <button className={styles.close} onClick={dismiss} aria-label="Fermer">×</button>

      {mode === 'android' && (
        <>
          <p className={styles.text}>
            Installez le suivi sur votre téléphone pour retrouver votre commande en un geste.
          </p>
          <button
            className={styles.installBtn}
            onClick={async () => {
              await installEvent?.prompt()
              dismiss()
            }}
          >
            Installer l&apos;application
          </button>
        </>
      )}

      {mode === 'ios' && !showTuto && (
        <>
          <p className={styles.text}>
            Ajoutez le suivi à votre écran d&apos;accueil pour le retrouver facilement.
          </p>
          <button className={styles.installBtn} onClick={() => setShowTuto(true)}>
            Comment faire ?
          </button>
        </>
      )}

      {mode === 'ios' && showTuto && (
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepNum}>1</span>
            Touchez le bouton Partager
            <svg className={styles.shareIcon} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 3v12M12 3l-4 4M12 3l4 4M5 11v9h14v-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            en bas de Safari
          </li>
          <li>
            <span className={styles.stepNum}>2</span>
            Faites défiler et choisissez «&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;»
          </li>
          <li>
            <span className={styles.stepNum}>3</span>
            Touchez «&nbsp;Ajouter&nbsp;» — l&apos;icône Ma commande apparaît sur votre écran d&apos;accueil
          </li>
        </ol>
      )}
    </div>
  )
}
