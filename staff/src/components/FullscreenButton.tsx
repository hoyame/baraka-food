'use client'

import { useEffect, useState } from 'react'
import styles from './FullscreenButton.module.scss'

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
    setSupported(Boolean(el.requestFullscreen || el.webkitRequestFullscreen))

    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    sync()
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  if (!supported) return null

  async function toggle() {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' })
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      }
    } catch {
      // refus du navigateur, on ne fait rien
    }
  }

  return (
    <button className={styles.btn} onClick={toggle} title="Plein écran">
      {isFullscreen ? 'Quitter' : 'Plein écran'}
    </button>
  )
}
