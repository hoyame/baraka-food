import { useEffect } from 'react'

export function useTitle(page: string) {
  useEffect(() => {
    document.title = `BarakaFood - ${page}`
  }, [page])
}
