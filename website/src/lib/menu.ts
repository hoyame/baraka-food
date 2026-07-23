import fs from 'fs/promises'
import path from 'path'

const MENU_FILE = path.join(process.cwd(), '..', 'server', 'data', 'menu.json')

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

export async function getMenu(): Promise<MenuData> {
  const raw = await fs.readFile(MENU_FILE, 'utf-8')
  return JSON.parse(raw)
}

export function img(src: string) {
  return src
}
