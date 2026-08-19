import type { Order, OrderItem } from './types'

export interface ClientInfo {
  prenom: string
  tel: string
  adresse: string
}

export function clientInfoDe(order: Order): ClientInfo | null {
  const entree = (order.items || []).find((i) => i.name === '__CLIENT__')
  if (!entree) return null
  try {
    const infos = JSON.parse(entree.notes || '{}')
    return { prenom: infos.prenom || '', tel: infos.tel || '', adresse: infos.adresse || '' }
  } catch {
    return null
  }
}

export function articlesDe(order: Order): OrderItem[] {
  return (order.items || []).filter((i) => i.name !== '__CLIENT__')
}
