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

export function formaterTel(tel: string): string {
  const chiffres = (tel || '').replace(/\D/g, '')
  if (chiffres.length === 10) return chiffres.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  if (chiffres.length === 11 && chiffres.startsWith('33')) {
    return ('0' + chiffres.slice(2)).replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  if (chiffres.length === 13 && chiffres.startsWith('0033')) {
    return ('0' + chiffres.slice(4)).replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  return tel
}

export function articlesDe(order: Order): OrderItem[] {
  return (order.items || []).filter((i) => i.name !== '__CLIENT__')
}
