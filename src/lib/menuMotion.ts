import { useEffect, useState } from 'react'

export function imgFloat(i: number, reduced: boolean | null) {
  if (reduced) return {}
  return {
    animate: { y: [0, -9, 0], rotate: [0, -2, 0] },
    transition: {
      duration: 3.6,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay: (i % 4) * 0.35,
    },
  }
}

export function useSpotlight(count: number, interval: number, reduced: boolean | null) {
  const [spot, setSpot] = useState(0)
  useEffect(() => {
    if (reduced || count <= 0) return
    const id = setInterval(() => setSpot(s => (s + 1) % count), interval)
    return () => clearInterval(id)
  }, [count, interval, reduced])
  return spot
}
