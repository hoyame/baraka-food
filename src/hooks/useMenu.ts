import { useEffect, useState } from 'react'
import { fetchMenu } from '../lib/api'
import type { MenuData } from '../lib/api'
import { supabase } from '../lib/supabase'

const CACHE_KEY = 'baraka-menu-cache'

function readCache(): MenuData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
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
    load()

    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, load)
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [])

  return menu
}
