import { useEffect, useState } from 'react'
import { fetchMenu, normalizeMenu } from '../lib/api'
import type { MenuData } from '../lib/api'
import { authReady, supabase } from '../lib/supabase'

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
    let channel: ReturnType<typeof supabase.channel> | null = null

    authReady.then(() => {
      if (!alive) return
      load()
      channel = supabase
        .channel('menu-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, load)
        .subscribe()
    })

    const fallback = setInterval(load, 30000)

    return () => {
      alive = false
      clearInterval(fallback)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return menu
}
