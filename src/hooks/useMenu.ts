import { useEffect, useState } from 'react'
import { fetchMenu } from '../lib/api'
import type { MenuData } from '../lib/api'

const CACHE_KEY = 'baraka-menu-cache'

function readCache(): MenuData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useMenu(pollMs = 5000) {
  const [menu, setMenu] = useState<MenuData | null>(readCache)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await fetchMenu()
        if (!alive) return
        setMenu(data)
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      } catch {}
    }
    load()
    const id = setInterval(load, pollMs)
    return () => { alive = false; clearInterval(id) }
  }, [pollMs])

  return menu
}
