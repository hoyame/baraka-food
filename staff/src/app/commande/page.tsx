'use client'

import { useEffect, useState } from 'react'
import StaffNav from '@/components/StaffNav'
import { Toast, useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { watchTable } from '@/lib/realtime'
import { sendReprint } from '@/lib/reprint'
import { articlesDe, clientInfoDe } from '@/lib/clientInfo'
import type { MenuData, Order, OrderItem, OrderStatus } from '@/lib/types'
import styles from './page.module.scss'

function parsePrice(v: string | number | undefined): number {
  if (typeof v === 'number') return v
  if (!v) return 0
  const m = String(v).replace(',', '.').match(/[\d]+(\.[\d]+)?/)
  return m ? parseFloat(m[0]) : 0
}

interface Catalogue {
  base: Record<string, number>
  extras: Set<string>
  friteSups: Set<string>
  boissons: Set<string>
  prixExtra: number
  prixGratinage: number
  prixFriteSup: number
  prixMenu: number
  prixViandeSup: number
}

function construireCatalogue(menu: MenuData): Catalogue {
  const base: Record<string, number> = {}
  for (const b of menu.page1.burgers) base[b.name] = b.price
  for (const t of menu.page1.texmex) base[t.name] = t.price
  base[menu.page2.menuKids.name] = menu.page2.menuKids.price
  base['Sandwich'] = menu.page2.sandwich?.prixSimple ?? 0
  if (menu.page2.sandwichPhare?.name) base[menu.page2.sandwichPhare.name] = menu.page2.sandwichPhare.price
  for (const f of menu.page2.frites) base[`Frites ${f.name}`] = f.price
  for (const d of menu.page2.desserts) base[d.name] = d.price
  for (const b of menu.page2.boissons) base[`Boisson ${b.name}`] = b.price
  for (const t of menu.page3.tailles) base[`Tacos ${t.size} (${t.viandes})`] = t.price

  return {
    base,
    extras: new Set(menu.page3.extras.items.map((e) => e.name)),
    friteSups: new Set((menu.page2.friteSupplements ?? []).map((f) => f.name)),
    boissons: new Set(menu.page2.boissons.map((b) => b.name)),
    prixExtra: parsePrice(menu.page3.extras.surcharge),
    prixGratinage: parsePrice(menu.page3.gratinagePrice),
    prixFriteSup: parsePrice(menu.page2.friteSupplementsPrice),
    prixMenu: parsePrice(menu.note.price),
    prixViandeSup: Math.max(0, (menu.page2.sandwich?.prixDouble ?? 0) - (menu.page2.sandwich?.prixSimple ?? 0)),
  }
}

function prixLigne(item: OrderItem, cat: Catalogue): number {
  const base = cat.base[item.name] ?? 0
  let options = 0
  const estFrites = item.name.startsWith('Frites ')
  for (const a of item.added || []) {
    const supViande = a.match(/^Supplement viande(?: x(\d+))?$/i)
    if (supViande) options += cat.prixViandeSup * (supViande[1] ? parseInt(supViande[1], 10) : 1)
    else if (/^Gratine /i.test(a)) options += cat.prixGratinage
    else if (/^MENU frites/i.test(a)) options += cat.prixMenu
    else if (cat.extras.has(a)) options += cat.prixExtra
    else if (estFrites && cat.friteSups.has(a)) options += cat.prixFriteSup
  }
  return (base + options) * (item.qty || 1)
}

function totalCommande(order: Order, cat: Catalogue): number {
  return articlesDe(order).reduce((somme, item) => somme + prixLigne(item, cat), 0)
}

const statusLabel: Record<OrderStatus, string> = {
  attente: 'En attente',
  preparation: 'En préparation',
  pret_cuisine: 'Prêt en cuisine',
  disponible: 'Au comptoir',
  recuperee: 'Récupérée',
}

export default function CommandePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const { toast, show } = useToast()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      setOrders((data as Order[]) || [])
    }
    load()
    return watchTable('orders-commande', 'orders', load)
  }, [])

  useEffect(() => {
    async function loadMenu() {
      const { data } = await supabase.from('menu').select('data').eq('id', 1).single()
      if (data) setCatalogue(construireCatalogue(data.data as MenuData))
    }
    return watchTable('menu-commande', 'menu', loadMenu, { pollMs: 30000 })
  }, [])

  async function reprint(order: Order) {
    const ok = await sendReprint(order)
    show(ok ? `${order.code} → réimpression envoyée` : 'Réimpression impossible — imprimante hors ligne ?')
  }

  return (
    <main className={styles.main}>
      <StaffNav />
      <div className={styles.wrap}>
        <p className={styles.title}>Toutes les commandes</p>
        <p className={styles.hint}>
          Les commandes récupérées sont retirées de la liste. Le bouton renvoie le ticket sur
          l&apos;imprimante cuisine.
        </p>
        <div className={styles.list}>
          {orders.length === 0 && <div className={styles.empty}>Aucune commande</div>}
          {orders.map((order) => (
            <div key={order.code} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.code}>{order.code}</span>
                <span className={styles.status}>
                  {/^(LV|LIV)-/i.test(order.code) && order.status === 'disponible'
                    ? 'En livraison'
                    : statusLabel[order.status]}
                </span>
                {catalogue && (
                  <span className={styles.total}>{totalCommande(order, catalogue).toFixed(2)}€</span>
                )}
                <span className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button className={styles.reprintBtn} onClick={() => reprint(order)} title="Réimprimer le ticket">
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M6 9V3h12v6M6 18h12v3H6zM4 9h16a2 2 0 0 1 2 2v5h-4M2 16h4v-5a2 2 0 0 0-2-2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  </svg>
                  <span>Réimprimer</span>
                </button>
              </div>
              {(() => {
                const client = clientInfoDe(order)
                if (!client) return null
                return (
                  <div className={styles.clientInfo}>
                    <span>{client.prenom}</span>
                    {client.tel && <span>{client.tel}</span>}
                    {client.adresse && <span>{client.adresse}</span>}
                  </div>
                )
              })()}
              <div className={styles.items}>
                {articlesDe(order).map((item, i) => (
                  <span key={i} className={styles.item}>
                    <span className={styles.itemText}>
                      {item.qty > 1 ? `${item.qty}× ` : ''}{item.name}
                      {item.added.length > 0 && <em> + {item.added.join(', ')}</em>}
                      {item.removed.length > 0 && <em> — sans {item.removed.join(', ')}</em>}
                      {item.notes && <em> ({item.notes})</em>}
                    </span>
                    {catalogue && (
                      <span className={styles.itemPrice}>{prixLigne(item, catalogue).toFixed(2)}€</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast toast={toast} />
    </main>
  )
}
