export interface MenuItem {
  id: string
  name: string
  price: number | string
  available: boolean
}

export interface MenuData {
  supplements: { id: string; name: string; price: string; available: boolean }[]
  page1: {
    burgers: { id: string; label: string; name: string; desc?: string; price: number; available: boolean }[]
    texmex: { id: string; name: string; price: number; available: boolean }[]
  }
  page2: {
    classiques: { id: string; name: string; desc?: string; price: number; available: boolean }[]
    sandwich?: { img: string; prixSimple: number; prixDouble: number; inclus?: string; available: boolean }
    friteSupplements?: { id: string; name: string; available: boolean }[]
    crunchy: { id: string; name: string; desc?: string; price: number; available: boolean }
    menuKids: { id: string; name: string; desc?: string; price: number; available: boolean }
    frites: { id: string; name: string; price: number; available: boolean }[]
    desserts: { id: string; name: string; price: number; available: boolean }[]
    boissons: { id: string; name: string; price: number; available: boolean }[]
  }
  page3: {
    tailles: { id: string; size: string; viandes: string; price: number; available: boolean }[]
    viandes: { id: string; name: string; available: boolean }[]
    sauces: { classiques: string[]; piquantes: string[] }
    gratinage?: { id: string; name: string; available: boolean }[]
    extras: { surcharge: string; items: { id: string; name: string; available: boolean }[] }
  }
}

export type OrderStatus = 'attente' | 'preparation' | 'pret_cuisine' | 'disponible' | 'recuperee'

export interface OrderItem {
  name: string
  qty: number
  removed: string[]
  added: string[]
  notes: string
}

export interface Order {
  id: string
  code: string
  status: OrderStatus
  items: OrderItem[]
  created_at: string
  updated_at: string | null
}
