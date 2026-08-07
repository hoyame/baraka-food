'use client'

import { useCallback, useRef, useState } from 'react'
import styles from './Toast.module.scss'

export interface ToastState {
  id: number
  message: string
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const counter = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string) => {
    counter.current += 1
    setToast({ id: counter.current, message })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  return { toast, show }
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null
  return (
    <div key={toast.id} className={styles.toast}>
      {toast.message}
    </div>
  )
}
