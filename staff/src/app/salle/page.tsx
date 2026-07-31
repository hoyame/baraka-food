'use client'

import { useEffect, useState } from 'react'
import StaffNav from '@/components/StaffNav'
import { supabase } from '@/lib/supabase'
import type { MenuData, Order, OrderStatus } from '@/lib/types'
import styles from './page.module.scss'

interface Category {
  label: string
  items: string[]
}

interface ItemMeta {
  ingredients: string[]
  isTacos: boolean
  viandeCount: number
}

interface CartLine {
  id: number
  name: string
  qty: number
  ingredients: string[]
  removedIngredients: string[]
  supplements: string[]
  isTacos: boolean
  viandeCount: number
  selectedViandes: string[]
  selectedSauce: string | null
  selectedExtras: string[]
  notes: string
}

const emptyMeta: ItemMeta = { ingredients: [], isTacos: false, viandeCount: 0 }

const trackLabel: Record<OrderStatus, string> = {
  attente: 'En attente',
  preparation: 'En préparation',
  pret_cuisine: 'Prêt en cuisine — à récupérer',
  disponible: 'Disponible au comptoir',
  recuperee: 'Récupérée',
}

let lineId = 0

export default function SallePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCat, setActiveCat] = useState(0)
  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({})
  const [unavailableNames, setUnavailableNames] = useState<Set<string>>(new Set())
  const [supplementOptions, setSupplementOptions] = useState<string[]>([])
  const [viandeOptions, setViandeOptions] = useState<string[]>([])
  const [sauceOptions, setSauceOptions] = useState<string[]>([])
  const [extraOptions, setExtraOptions] = useState<string[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [sending, setSending] = useState(false)
  const [confirmCode, setConfirmCode] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    async function loadCatalog() {
      const { data, error } = await supabase.from('menu').select('data').eq('id', 1).single()
      if (error || !data) return
      const menu = data.data as MenuData

      const splitDesc = (desc?: string) => (desc ? desc.split(' · ').filter(Boolean) : [])

      const rawCats: { label: string; items: { name: string; available?: boolean }[] }[] = [
        { label: 'Burgers', items: menu.page1.burgers },
        { label: 'Tex-Mex', items: menu.page1.texmex },
        { label: 'Sandwichs', items: [...menu.page2.classiques, menu.page2.crunchy, menu.page2.menuKids] },
        {
          label: 'Accompagnements',
          items: [
            ...menu.page2.frites.map((f) => ({ ...f, name: `Frites ${f.name}` })),
            ...menu.page2.desserts,
            ...menu.page2.boissons.map((b) => ({ ...b, name: `Boisson ${b.name}` })),
          ],
        },
        {
          label: 'Tacos',
          items: menu.page3.tailles.map((t) => ({
            name: `Tacos ${t.size} (${t.viandes})`,
            available: t.available,
          })),
        },
        { label: 'Suppléments', items: menu.supplements },
      ]

      const unavailable = new Set<string>()
      for (const cat of rawCats) {
        for (const it of cat.items) {
          if (it && it.available === false) unavailable.add(it.name)
        }
      }

      const cats: Category[] = rawCats.map((cat) => {
        const seen = new Set<string>()
        const items = cat.items
          .filter((it) => it && it.available !== false)
          .map((it) => it.name)
          .filter((name) => {
            if (seen.has(name)) return false
            seen.add(name)
            return true
          })
        return { label: cat.label, items }
      })

      const availableNames = new Set(cats.flatMap((c) => c.items))
      for (const n of unavailable) if (availableNames.has(n)) unavailable.delete(n)
      setUnavailableNames(unavailable)
      setCategories(cats)

      const meta: Record<string, ItemMeta> = {}
      for (const b of menu.page1.burgers) meta[b.name] = { ...emptyMeta, ingredients: splitDesc(b.desc) }
      for (const c of [...menu.page2.classiques, menu.page2.crunchy, menu.page2.menuKids]) {
        meta[c.name] = { ...emptyMeta, ingredients: splitDesc(c.desc) }
      }
      for (const t of menu.page3.tailles) {
        meta[`Tacos ${t.size} (${t.viandes})`] = {
          ...emptyMeta,
          isTacos: true,
          viandeCount: parseInt(t.viandes, 10) || 1,
        }
      }
      setItemMeta(meta)

      setSupplementOptions(menu.supplements.filter((s) => s.available !== false).map((s) => s.name))
      setViandeOptions(menu.page3.viandes.filter((v) => v.available !== false).map((v) => v.name))
      setSauceOptions([...menu.page3.sauces.classiques, ...menu.page3.sauces.piquantes])
      setExtraOptions(menu.page3.extras.items.filter((e) => e.available !== false).map((e) => e.name))
    }
    loadCatalog()

    const channel = supabase
      .channel('menu-salle')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, loadCatalog)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    async function loadTracking() {
      const { data } = await supabase.from('orders').select('*')
      setOrders((data as Order[]) || [])
    }
    loadTracking()

    const channel = supabase
      .channel('orders-salle')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadTracking)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function addToCart(name: string) {
    const meta = itemMeta[name] || emptyMeta
    setCart((c) => [
      ...c,
      {
        id: ++lineId,
        name,
        qty: 1,
        ingredients: meta.ingredients,
        removedIngredients: [],
        supplements: [],
        isTacos: meta.isTacos,
        viandeCount: meta.viandeCount,
        selectedViandes: [],
        selectedSauce: null,
        selectedExtras: [],
        notes: '',
      },
    ])
  }

  function removeLine(id: number) {
    setCart((c) => c.filter((l) => l.id !== id))
  }

  function updateLine(id: number, patch: Partial<CartLine>) {
    setCart((c) => c.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function toggleIngredient(line: CartLine, ing: string) {
    const removed = line.removedIngredients.includes(ing)
      ? line.removedIngredients.filter((i) => i !== ing)
      : [...line.removedIngredients, ing]
    updateLine(line.id, { removedIngredients: removed })
  }

  function toggleSupplement(line: CartLine, name: string) {
    const supplements = line.supplements.includes(name)
      ? line.supplements.filter((s) => s !== name)
      : [...line.supplements, name]
    updateLine(line.id, { supplements })
  }

  function toggleViande(line: CartLine, name: string) {
    const already = line.selectedViandes.includes(name)
    if (!already && line.selectedViandes.length >= line.viandeCount) return
    const selectedViandes = already
      ? line.selectedViandes.filter((v) => v !== name)
      : [...line.selectedViandes, name]
    updateLine(line.id, { selectedViandes })
  }

  function toggleExtra(line: CartLine, name: string) {
    const selectedExtras = line.selectedExtras.includes(name)
      ? line.selectedExtras.filter((e) => e !== name)
      : [...line.selectedExtras, name]
    updateLine(line.id, { selectedExtras })
  }

  async function sendOrder() {
    if (cart.length === 0) return
    setSending(true)

    const items = cart.map((l) => ({
      name: l.name,
      qty: l.qty,
      removed: l.removedIngredients,
      added: [
        ...l.supplements,
        ...l.selectedViandes,
        ...(l.selectedSauce ? [l.selectedSauce] : []),
        ...l.selectedExtras,
      ],
      notes: l.notes,
    }))

    const { data: code, error: codeError } = await supabase.rpc('next_order_code')
    if (codeError) {
      setSending(false)
      return
    }

    const { error } = await supabase.from('orders').insert({ code, status: 'attente', items })
    setSending(false)
    if (error) return

    setCart([])
    setConfirmCode(code)
    setTimeout(() => setConfirmCode(null), 4000)
  }

  async function setOrderStatus(code: string, status: OrderStatus) {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('code', code)
  }

  async function removeOrder(code: string) {
    await supabase.from('orders').delete().eq('code', code)
  }

  const activeOrders = orders
    .filter((o) => o.status !== 'recuperee')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <main className={styles.main}>
      <StaffNav />
      <div className={styles.wrap}>
        <div className={styles.layout}>
          <div>
            <p className={styles.blockTitle}>Ajouter au ticket</p>
            <div className={styles.catTabs}>
              {categories.map((cat, i) => (
                <button
                  key={cat.label}
                  className={`${styles.catTab}${i === activeCat ? ` ${styles.catTabActive}` : ''}`}
                  onClick={() => setActiveCat(i)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className={styles.catalog}>
              {(categories[activeCat]?.items || []).map((name) => (
                <button key={name} className={styles.catalogItem} onClick={() => addToCart(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={styles.blockTitle}>Ticket en cours</p>
            <div className={styles.cart}>
              {cart.length === 0 && <div className={styles.cartEmpty}>Aucun article</div>}
              {cart.map((line) => {
                const isUnavailable = unavailableNames.has(line.name)
                return (
                  <div key={line.id} className={`${styles.cartLine}${isUnavailable ? ` ${styles.cartLineWarn}` : ''}`}>
                    <div className={styles.cartLineHead}>
                      <span className={styles.cartLineName}>{line.name}</span>
                      <button className={styles.cartLineRemove} onClick={() => removeLine(line.id)}>Retirer</button>
                    </div>
                    {isUnavailable && <div className={styles.cartLineWarnText}>Épuisé — retirer ?</div>}

                    {line.ingredients.length > 0 && (
                      <div className={styles.chipRow}>
                        {line.ingredients.map((ing) => {
                          const isRemoved = line.removedIngredients.includes(ing)
                          return (
                            <button
                              key={ing}
                              className={`${styles.chip}${isRemoved ? ` ${styles.chipOff}` : ` ${styles.chipOn}`}`}
                              onClick={() => toggleIngredient(line, ing)}
                            >
                              {isRemoved ? `Sans ${ing}` : ing}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {supplementOptions.length > 0 && (
                      <div className={styles.chipRow}>
                        {supplementOptions.map((name) => (
                          <button
                            key={name}
                            className={`${styles.chip}${line.supplements.includes(name) ? ` ${styles.chipAdd}` : ''}`}
                            onClick={() => toggleSupplement(line, name)}
                          >
                            + {name}
                          </button>
                        ))}
                      </div>
                    )}

                    {line.isTacos && (
                      <>
                        <div className={styles.chipRow}>
                          <span className={styles.chipGroupLabel}>Viandes ({line.selectedViandes.length}/{line.viandeCount})</span>
                          {viandeOptions.map((name) => (
                            <button
                              key={name}
                              className={`${styles.chip}${line.selectedViandes.includes(name) ? ` ${styles.chipAdd}` : ''}`}
                              onClick={() => toggleViande(line, name)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                        <div className={styles.chipRow}>
                          <span className={styles.chipGroupLabel}>Sauce</span>
                          {sauceOptions.map((name) => (
                            <button
                              key={name}
                              className={`${styles.chip}${line.selectedSauce === name ? ` ${styles.chipAdd}` : ''}`}
                              onClick={() => updateLine(line.id, { selectedSauce: line.selectedSauce === name ? null : name })}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                        <div className={styles.chipRow}>
                          <span className={styles.chipGroupLabel}>Extras</span>
                          {extraOptions.map((name) => (
                            <button
                              key={name}
                              className={`${styles.chip}${line.selectedExtras.includes(name) ? ` ${styles.chipAdd}` : ''}`}
                              onClick={() => toggleExtra(line, name)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <div className={styles.cartLineRow}>
                      <input
                        className={styles.qtyInput}
                        type="number"
                        min={1}
                        max={20}
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
                      />
                      <input
                        className={styles.notesInput}
                        type="text"
                        placeholder="Note libre (cuisson, allergie...)"
                        value={line.notes}
                        onChange={(e) => updateLine(line.id, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <button className={styles.sendBtn} disabled={cart.length === 0 || sending} onClick={sendOrder}>
              Envoyer en cuisine
            </button>
            {confirmCode && (
              <div className={styles.confirm}>
                <span>Commande envoyée</span>
                <span className={styles.confirmCode}>{confirmCode}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.tracking}>
          <p className={styles.blockTitle}>Commandes en cours</p>
          {activeOrders.length === 0 && <div className={styles.cartEmpty}>Aucune commande en cours</div>}
          {activeOrders.map((order) => {
            const isAlert = order.status === 'pret_cuisine'
            return (
              <div key={order.code} className={`${styles.trackCard}${isAlert ? ` ${styles.trackCardAlert}` : ''}`}>
                <span className={styles.trackCode}>{order.code}</span>
                <span className={styles.trackStatus}>{trackLabel[order.status]}</span>
                {order.status === 'pret_cuisine' && (
                  <button className={styles.trackBtn} onClick={() => setOrderStatus(order.code, 'disponible')}>
                    Mettre au comptoir
                  </button>
                )}
                {order.status === 'disponible' && (
                  <button className={styles.trackBtn} onClick={() => removeOrder(order.code)}>
                    Récupérée
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
