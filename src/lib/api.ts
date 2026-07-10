export const API_URL = ''

export interface Supplement {
  id: string
  name: string
  price: string
  img: string
  available: boolean
}

export interface Burger {
  id: string
  label: string
  name: string
  desc: string
  price: number
  img: string
  available: boolean
  featured: boolean
}

export interface PricedItem {
  id: string
  name: string
  price: number
  img: string
  available: boolean
}

export interface SimpleItem {
  id: string
  name: string
  price: number
  available: boolean
}

export interface ImgItem {
  id: string
  name: string
  img: string
  available: boolean
}

export interface Taille {
  id: string
  size: string
  viandes: string
  price: number
  available: boolean
}

export interface FeaturedItem {
  id: string
  label?: string
  name: string
  desc: string
  price: number
  img: string
  available: boolean
}

export interface MenuData {
  note: { label: string; price: string }
  supplements: Supplement[]
  page1: {
    title: string
    burgers: Burger[]
    texmex: PricedItem[]
  }
  page2: {
    title: string
    classiques: PricedItem[]
    crunchy: FeaturedItem
    menuKids: FeaturedItem
    frites: SimpleItem[]
    desserts: SimpleItem[]
    boissons: SimpleItem[]
  }
  page3: {
    title: string
    tailles: Taille[]
    viandes: ImgItem[]
    sauces: { classiques: string[]; piquantes: string[] }
    extras: { surcharge: string; items: ImgItem[] }
  }
}

export function imgUrl(path: string) {
  return path.startsWith('http') ? path : `${API_URL}${path}`
}

export async function fetchMenu(): Promise<MenuData> {
  const res = await fetch(`${API_URL}/api/menu`)
  if (!res.ok) throw new Error('fetch menu failed')
  return res.json()
}

export async function saveMenu(menu: MenuData): Promise<void> {
  const res = await fetch(`${API_URL}/api/menu`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menu),
  })
  if (!res.ok) throw new Error('save menu failed')
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('upload failed')
  const data = await res.json()
  return data.url
}
