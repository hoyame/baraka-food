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
  img?: string
  available: boolean
}

export interface SandwichConfig {
  img: string
  prixSimple: number
  prixDouble: number
  inclus: string
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

export interface Horaire {
  jour: string
  ferme: boolean
  creneaux: string
}

export interface Infos {
  email: string
  telephone: string
  adresse: string
  horaires: Horaire[]
}

export interface MenuData {
  note: { label: string; price: string; img: string }
  infos: Infos
  supplements: Supplement[]
  page1: {
    title: string
    burgers: Burger[]
    texmex: PricedItem[]
  }
  page2: {
    title: string
    classiques: PricedItem[]
    sandwich: SandwichConfig
    crunchy: FeaturedItem
    menuKids: FeaturedItem
    frites: SimpleItem[]
    fritesImg: string
    friteSupplements: { id: string; name: string; available: boolean }[]
    friteSupplementsPrice: string
    desserts: SimpleItem[]
    boissons: SimpleItem[]
  }
  page3: {
    title: string
    tailles: Taille[]
    viandes: ImgItem[]
    sauces: { classiques: string[]; piquantes: string[] }
    saucesImg: string
    gratinage: { id: string; name: string; available: boolean }[]
    gratinagePrice: string
    gratinageImg: string
    extras: { surcharge: string; items: ImgItem[] }
  }
}

export function imgUrl(path: string) {
  return path
}

export function normalizeMenu(menu: MenuData): MenuData {
  if (menu.note.img === undefined) menu.note.img = ''
  if (!menu.infos) {
    menu.infos = {
      email: 'contact@barakafood.fr',
      telephone: '04 79 00 00 00',
      adresse: 'Place Clemenceau\n73100 Aix-les-Bains',
      horaires: [],
    }
  }
  if (!menu.infos.horaires?.length) {
    menu.infos.horaires = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(jour => ({
      jour,
      ferme: false,
      creneaux: '11h30 – 22h30',
    }))
  }
  if (!menu.page2.sandwich) {
    menu.page2.sandwich = {
      img: menu.page2.classiques?.[0]?.img ?? '',
      prixSimple: 6.5,
      prixDouble: 8,
      inclus: 'Salade · Tomate · Oignons',
      available: true,
    }
  }
  if (menu.page2.sandwich.inclus === undefined) menu.page2.sandwich.inclus = 'Salade · Tomate · Oignons' 
  if (menu.page3.gratinagePrice === undefined) menu.page3.gratinagePrice = '+2.00€'
  if (menu.page3.gratinageImg === undefined) menu.page3.gratinageImg = ''
  if (menu.page3.saucesImg === undefined) menu.page3.saucesImg = ''
  if (!menu.page3.gratinage) {
    menu.page3.gratinage = ['Emmental', 'Mozzarella', 'Cheddar'].map((name, i) => ({
      id: `gratinage-${i}`,
      name,
      available: true,
    }))
  }
  if (menu.page2.fritesImg === undefined) menu.page2.fritesImg = ''
  if (menu.page2.friteSupplementsPrice === undefined) menu.page2.friteSupplementsPrice = '1,50€'
  if (!menu.page2.friteSupplements) {
    menu.page2.friteSupplements = ['Fromage', 'Oignons Crispy', 'Lardons'].map((name, i) => ({
      id: `fritesup-${i}`,
      name,
      available: true,
    }))
  }
  return menu
}

export async function fetchMenu(): Promise<MenuData> {
  const { data, error } = await supabase.from('menu').select('data').eq('id', 1).single()
  if (error) throw error
  return normalizeMenu(data.data as MenuData)
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
