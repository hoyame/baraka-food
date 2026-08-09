'use client'

import { useEffect, useState } from 'react'
import StaffNav from '@/components/StaffNav'
import { Toast, useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { watchTable } from '@/lib/realtime'
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
  canMenu?: boolean
  kidsChoices?: string[]
  isFrites?: boolean
  price?: number
  noSauce?: boolean
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
  selectedSauces: string[]
  selectedExtras: string[]
  selectedGratinage: string[]
  canMenu: boolean
  isMenu: boolean
  selectedBoisson: string | null
  kidsChoices: string[]
  selectedKids: string | null
  isFrites: boolean
  price: number
  noSauce: boolean
  collapsed: boolean
  notes: string
}

const emptyMeta: ItemMeta = { ingredients: [], isTacos: false, viandeCount: 0 }

function parsePrice(v: string | number | undefined): number {
  if (typeof v === 'number') return v
  if (!v) return 0
  const m = String(v).replace(',', '.').match(/[\d]+(\.[\d]+)?/)
  return m ? parseFloat(m[0]) : 0
}

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
  const [viandeOptions, setViandeOptions] = useState<string[]>([])
  const [sauceOptions, setSauceOptions] = useState<string[]>([])
  const [extraOptions, setExtraOptions] = useState<string[]>([])
  const [boissonOptions, setBoissonOptions] = useState<string[]>([])
  const [friteSupOptions, setFriteSupOptions] = useState<string[]>([])
  const [gratinageOptions, setGratinageOptions] = useState<string[]>([])
  const [prices, setPrices] = useState({ extra: 0, gratinage: 0, friteSup: 0, menu: 0 })
  const [showTotal, setShowTotal] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [sending, setSending] = useState(false)
  const [confirmCode, setConfirmCode] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const { toast, show } = useToast()

  useEffect(() => {
    async function loadCatalog() {
      const { data, error } = await supabase.from('menu').select('data').eq('id', 1).single()
      if (error || !data) return
      const menu = data.data as MenuData

      const splitDesc = (desc?: string) => (desc ? desc.split(' · ').filter(Boolean) : [])

      const rawCats: { label: string; items: { name: string; available?: boolean }[] }[] = [
        { label: 'Burgers', items: menu.page1.burgers },
        {
          label: 'Sandwichs',
          items: [
            { name: 'Sandwich 1 viande', available: menu.page2.sandwich?.available !== false },
            { name: 'Sandwich 2 viandes', available: menu.page2.sandwich?.available !== false },
          ],
        },
        {
          label: 'Tacos',
          items: menu.page3.tailles.map((t) => ({
            name: `Tacos ${t.size} (${t.viandes})`,
            available: t.available,
          })),
        },
        { label: 'Menu Kids', items: [menu.page2.menuKids] },
        { label: 'Tex-Mex', items: menu.page1.texmex },
        {
          label: 'Accompagnements',
          items: menu.page2.frites.map((f) => ({ ...f, name: `Frites ${f.name}` })),
        },
        { label: 'Desserts', items: menu.page2.desserts },
        {
          label: 'Boissons',
          items: menu.page2.boissons.map((b) => ({ ...b, name: `Boisson ${b.name}` })),
        },
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
      for (const b of menu.page1.burgers) meta[b.name] = { ...emptyMeta, ingredients: splitDesc(b.desc), canMenu: true, price: b.price }
      for (const t of menu.page1.texmex) meta[t.name] = { ...emptyMeta, price: t.price }
      meta[menu.page2.menuKids.name] = { ...emptyMeta, kidsChoices: ['Cheese Burger', 'Mini Tacos'], price: menu.page2.menuKids.price }
      const garnitures = (menu.page2.sandwich?.inclus ?? '').split('·').map((g) => g.trim()).filter(Boolean)
      meta['Sandwich 1 viande'] = { ingredients: garnitures, isTacos: true, viandeCount: 1, canMenu: true, price: menu.page2.sandwich?.prixSimple ?? 0 }
      meta['Sandwich 2 viandes'] = { ingredients: garnitures, isTacos: true, viandeCount: 2, canMenu: true, price: menu.page2.sandwich?.prixDouble ?? 0 }
      for (const f of menu.page2.frites) meta[`Frites ${f.name}`] = { ...emptyMeta, isFrites: true, price: f.price }
      for (const d of menu.page2.desserts) meta[d.name] = { ...emptyMeta, price: d.price, noSauce: true }
      for (const b of menu.page2.boissons) meta[`Boisson ${b.name}`] = { ...emptyMeta, price: b.price, noSauce: true }
      for (const t of menu.page3.tailles) {
        meta[`Tacos ${t.size} (${t.viandes})`] = {
          ...emptyMeta,
          isTacos: true,
          viandeCount: parseInt(t.viandes, 10) || 1,
          canMenu: true,
          price: t.price,
        }
      }
      setItemMeta(meta)
      setPrices({
        extra: parsePrice(menu.page3.extras.surcharge),
        gratinage: parsePrice(menu.page3.gratinagePrice),
        friteSup: parsePrice(menu.page2.friteSupplementsPrice),
        menu: parsePrice(menu.note.price),
      })

      setViandeOptions(menu.page3.viandes.filter((v) => v.available !== false).map((v) => v.name))
      setSauceOptions(menu.page3.sauces.classiques)
      setExtraOptions(menu.page3.extras.items.filter((e) => e.available !== false).map((e) => e.name))
      setBoissonOptions(menu.page2.boissons.filter((b) => b.available !== false).map((b) => b.name))
      setFriteSupOptions((menu.page2.friteSupplements ?? []).filter((f) => f.available !== false).map((f) => f.name))
      setGratinageOptions((menu.page3.gratinage ?? []).filter((g) => g.available !== false).map((g) => g.name))
    }
    return watchTable('menu-salle', 'menu', loadCatalog, { pollMs: 30000 })
  }, [])

  useEffect(() => {
    async function loadTracking() {
      const { data } = await supabase.from('orders').select('*')
      setOrders((data as Order[]) || [])
    }
    return watchTable('orders-salle', 'orders', loadTracking)
  }, [])

  function addToCart(name: string) {
    const meta = itemMeta[name] || emptyMeta
    show(`Ajouté : ${name}`)
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
        selectedSauces: [],
        selectedExtras: [],
        selectedGratinage: [],
        canMenu: meta.canMenu === true,
        isMenu: false,
        selectedBoisson: null,
        kidsChoices: meta.kidsChoices ?? [],
        selectedKids: null,
        isFrites: meta.isFrites === true,
        price: meta.price ?? 0,
        noSauce: meta.noSauce === true,
        collapsed: false,
        notes: '',
      },
    ])
  }

  function lineTotal(l: CartLine) {
    const options =
      l.selectedExtras.length * prices.extra +
      l.selectedGratinage.length * prices.gratinage +
      (l.isFrites ? l.supplements.length * prices.friteSup : 0) +
      (l.isMenu ? prices.menu : 0)
    return (l.price + options) * l.qty
  }

  const total = cart.reduce((sum, l) => sum + lineTotal(l), 0)

  function removeLine(id: number) {
    setCart((c) => {
      const line = c.find((l) => l.id === id)
      if (line) show(`Retiré : ${line.name}`)
      return c.filter((l) => l.id !== id)
    })
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
    const incomplete = cart.find((l) => l.viandeCount > 0 && l.selectedViandes.length < l.viandeCount)
    if (incomplete) {
      show(`Choisis la viande pour : ${incomplete.name}`)
      return
    }
    setSending(true)

    const items = cart.map((l) => ({
      name: l.name,
      qty: l.qty,
      removed: l.removedIngredients,
      added: [
        ...l.supplements,
        ...l.selectedViandes,
        ...l.selectedSauces,
        ...l.selectedExtras,
        ...l.selectedGratinage.map((g) => `Gratine ${g}`),
        ...(l.isMenu ? [`MENU frites${l.selectedBoisson ? ' + boisson ' + l.selectedBoisson : ''}`] : []),
        ...(l.selectedKids ? [l.selectedKids] : []),
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
        <div className={styles.topBar}>
          <button
            className={`${styles.eyeBtn}${showTotal ? ` ${styles.eyeBtnOn}` : ''}`}
            onClick={() => setShowTotal((v) => !v)}
            title={showTotal ? 'Masquer le total' : 'Afficher le total'}
            aria-pressed={showTotal}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              {!showTotal && <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
            </svg>
            <span>{showTotal ? `${total.toFixed(2)}€` : 'Total'}</span>
          </button>
        </div>

        <div className={styles.layout}>
          <div>
            <p className={styles.blockTitle}>Ajouter au ticket</p>
            {[['Burgers', 'Sandwichs', 'Tacos', 'Menu Kids'], ['Tex-Mex', 'Accompagnements', 'Desserts', 'Boissons']].map((row, r) => (
              <div key={r} className={styles.catTabs}>
                {row.map((label) => {
                  const i = categories.findIndex((c) => c.label === label)
                  if (i === -1) return null
                  return (
                    <button
                      key={label}
                      className={`${styles.catTab}${i === activeCat ? ` ${styles.catTabActive}` : ''}`}
                      onClick={() => setActiveCat(i)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ))}
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
                      <button
                        className={styles.cartLineFold}
                        onClick={() => updateLine(line.id, { collapsed: !line.collapsed })}
                        title={line.collapsed ? 'Déplier' : 'Replier'}
                      >
                        {line.collapsed ? '▸' : '▾'}
                      </button>
                      <span className={styles.cartLineName}>
                        {line.qty > 1 && <b>{line.qty}× </b>}{line.name}
                      </span>
                      {showTotal && <span className={styles.cartLinePrice}>{lineTotal(line).toFixed(2)}€</span>}
                      <button className={styles.cartLineRemove} onClick={() => removeLine(line.id)}>Retirer</button>
                    </div>

                    {line.collapsed && (
                      <div className={styles.cartLineSummary}>
                        {[
                          ...line.removedIngredients.map((r) => `sans ${r}`),
                          ...line.selectedViandes,
                          ...line.selectedSauces,
                          ...line.selectedExtras,
                          ...line.selectedGratinage.map((g) => `gratiné ${g}`),
                          ...(line.isFrites ? line.supplements : []),
                          ...(line.selectedKids ? [line.selectedKids] : []),
                          ...(line.isMenu ? [`menu${line.selectedBoisson ? ` + ${line.selectedBoisson}` : ''}`] : []),
                          ...(line.notes ? [line.notes] : []),
                        ].join(' · ') || 'Aucune option'}
                      </div>
                    )}
                    {isUnavailable && <div className={styles.cartLineWarnText}>Épuisé — retirer ?</div>}

                    {!line.collapsed && line.ingredients.length > 0 && (
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

                    {!line.collapsed && line.isTacos && (
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
                      </>
                    )}

                    {!line.collapsed && line.isFrites && friteSupOptions.length > 0 && (
                      <div className={styles.chipRow}>
                        <span className={styles.chipGroupLabel}>Suppléments</span>
                        {friteSupOptions.map((name) => (
                          <button
                            key={name}
                            className={`${styles.chip}${line.supplements.includes(name) ? ` ${styles.chipAdd}` : ''}`}
                            onClick={() => updateLine(line.id, { supplements: line.supplements.includes(name) ? line.supplements.filter((sp) => sp !== name) : [...line.supplements, name] })}
                          >
                            + {name}
                          </button>
                        ))}
                      </div>
                    )}

                    {!line.collapsed && !line.noSauce && (
                    <div className={styles.chipRow}>
                      <span className={styles.chipGroupLabel}>Sauces</span>
                      {sauceOptions.map((name) => (
                        <button
                          key={name}
                          className={`${styles.chip}${line.selectedSauces.includes(name) ? ` ${styles.chipAdd}` : ''}`}
                          onClick={() => updateLine(line.id, { selectedSauces: line.selectedSauces.includes(name) ? line.selectedSauces.filter((sc) => sc !== name) : [...line.selectedSauces, name] })}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    )}

                    {!line.collapsed && (line.isTacos || line.canMenu) && (
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
                    )}

                    {!line.collapsed && line.kidsChoices.length > 0 && (
                      <div className={styles.chipRow}>
                        <span className={styles.chipGroupLabel}>Choix</span>
                        {line.kidsChoices.map((name) => (
                          <button
                            key={name}
                            className={`${styles.chip}${line.selectedKids === name ? ` ${styles.chipAdd}` : ''}`}
                            onClick={() => updateLine(line.id, { selectedKids: line.selectedKids === name ? null : name })}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}

                    {!line.collapsed && line.isTacos && gratinageOptions.length > 0 && (
                      <div className={styles.chipRow}>
                        <span className={styles.chipGroupLabel}>Gratinage</span>
                        {gratinageOptions.map((name) => (
                          <button
                            key={name}
                            className={`${styles.chip}${line.selectedGratinage.includes(name) ? ` ${styles.chipAdd}` : ''}`}
                            onClick={() => updateLine(line.id, { selectedGratinage: line.selectedGratinage.includes(name) ? line.selectedGratinage.filter((g) => g !== name) : [...line.selectedGratinage, name] })}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}

                    {!line.collapsed && line.canMenu && (
                      <div className={styles.chipRow}>
                        <span className={styles.chipGroupLabel}>Formule</span>
                        <button
                          className={`${styles.chip}${line.isMenu ? ` ${styles.chipAdd}` : ''}`}
                          onClick={() => updateLine(line.id, { isMenu: !line.isMenu, selectedBoisson: line.isMenu ? null : line.selectedBoisson })}
                        >
                          MENU (frites + boisson)
                        </button>
                        {line.isMenu && boissonOptions.map((name) => (
                          <button
                            key={name}
                            className={`${styles.chip}${line.selectedBoisson === name ? ` ${styles.chipAdd}` : ''}`}
                            onClick={() => updateLine(line.id, { selectedBoisson: line.selectedBoisson === name ? null : name })}
                          >
                            Boisson {name}
                          </button>
                        ))}
                      </div>
                    )}

                    {!line.collapsed && (
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
                    )}
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
      <Toast toast={toast} />
    </main>
  )
}
