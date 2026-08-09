import { useEffect, useState } from 'react'
import { fetchMenu, normalizeMenu } from '../lib/api'
import type { MenuData } from '../lib/api'
import { watchTable } from '../lib/realtime'
import type { LinkStatus } from '../lib/realtime'

const CACHE_KEY = 'baraka-menu-cache'

function readCache(): MenuData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? normalizeMenu(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function useMenu() {
  const [menu, setMenu] = useState<MenuData | null>(readCache)
  const [link, setLink] = useState<LinkStatus>('reconnecting')

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
    const stop = watchTable('menu-changes', 'menu', load, { pollMs: 30000, onStatus: setLink })

    return () => {
      alive = false
      stop()
    }
  }, [])

  return { menu, link }
}
