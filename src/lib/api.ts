import { supabase } from './supabase'

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
  return path
}

export async function fetchMenu(): Promise<MenuData> {
  const { data, error } = await supabase.from('menu').select('data').eq('id', 1).single()
  if (error) throw error
  return data.data as MenuData
}

export async function saveMenu(menu: MenuData): Promise<void> {
  const { error } = await supabase
    .from('menu')
    .update({ data: menu, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const filename = `${file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('menu-images').upload(filename, file, {
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error

  const { data } = supabase.storage.from('menu-images').getPublicUrl(filename)
  return data.publicUrl
}
