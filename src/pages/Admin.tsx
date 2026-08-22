import { useEffect, useRef, useState } from 'react'
import { fetchMenuStamped, fetchMenuStamp, saveMenuGuarded, uploadImage, imgUrl } from '../lib/api'
import { resignIn } from '../lib/supabase'
import { watchTable } from '../lib/realtime'
import type { MenuData } from '../lib/api'
import './Admin.scss'
import { useTitle } from '../hooks/useTitle'

type Draft = (fn: (d: MenuData) => void) => void

function ImgPicker({ img, onPick }: { img?: string; onPick: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  if (img === undefined) return <div className="adm__thumb adm__thumb--none" />

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      onPick(await uploadImage(file))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button className={`adm__thumb${img ? '' : ' adm__thumb--empty'}`} onClick={() => inputRef.current?.click()} disabled={busy}>
      {img && <img src={imgUrl(img)} alt="" />}
      <span>{busy ? '...' : img ? '↻' : '+'}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </button>
  )
}

function IngredientEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ingredients = value ? value.split(' · ').filter(Boolean) : []
  const [draft, setDraft] = useState('')

  const commit = (list: string[]) => onChange(list.join(' · '))

  const addIngredient = () => {
    const v = draft.trim()
    if (!v) return
    commit([...ingredients, v])
    setDraft('')
  }

  return (
    <div className="adm__ingredients">
      {ingredients.map((ing, i) => (
        <span key={i} className="adm__ingredient-chip">
          {ing}
          <button type="button" onClick={() => commit(ingredients.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <input
        className="adm__ingredient-input"
        value={draft}
        placeholder="+ Ingrédient"
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addIngredient()
          }
        }}
        onBlur={addIngredient}
      />
    </div>
  )
}

function PriceInput({ value, onChange, className = 'adm__input adm__input--price' }: {
  value: number
  onChange: (n: number) => void
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(value).replace('.', ',')

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      value={shown}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(/(,|\.)(?=.*(,|\.))/g, '')
        setDraft(raw)
        const n = parseFloat(raw.replace(',', '.'))
        if (!Number.isNaN(n)) onChange(n)
      }}
      onBlur={() => {
        if (draft !== null && parseFloat(draft.replace(',', '.')) !== value) {
          const n = parseFloat(draft.replace(',', '.'))
          onChange(Number.isNaN(n) ? 0 : n)
        }
        setDraft(null)
      }}
    />
  )
}

interface RowProps {
  img?: string
  label?: string
  name: string
  desc?: string
  price?: number | string
  available: boolean
  onPatch: (p: Record<string, unknown>) => void
  onMove?: (dir: -1 | 1) => void
  onDelete?: () => void
}

function Row({ img, label, name, desc, price, available, onPatch, onMove, onDelete }: RowProps) {
  return (
    <div className={`adm__row${available ? '' : ' adm__row--off'}`}>
      {onMove && (
        <div className="adm__move">
          <button type="button" onClick={() => onMove(-1)}>▲</button>
          <button type="button" onClick={() => onMove(1)}>▼</button>
        </div>
      )}
      <ImgPicker img={img} onPick={url => onPatch({ img: url })} />
      <div className="adm__fields">
        {label !== undefined && (
          <input className="adm__input adm__input--label" value={label} onChange={e => onPatch({ label: e.target.value })} placeholder="Label" />
        )}
        <input className="adm__input adm__input--name" value={name} onChange={e => onPatch({ name: e.target.value })} placeholder="Nom" />
        {desc !== undefined && (
          <IngredientEditor value={desc} onChange={v => onPatch({ desc: v })} />
        )}
      </div>
      {typeof price === 'number' && (
        <PriceInput value={price} onChange={n => onPatch({ price: n })} />
      )}
      {typeof price === 'string' && (
        <input
          className="adm__input adm__input--price"
          value={price}
          onChange={e => onPatch({ price: e.target.value })}
        />
      )}
      <button
        className={`adm__toggle${available ? ' adm__toggle--on' : ''}`}
        onClick={() => onPatch({ available: !available })}
      >
        {available ? 'DISPO' : 'ÉPUISÉ'}
      </button>
      {onDelete && (
        <button className="adm__delete" title="Supprimer" onClick={onDelete}>×</button>
      )}
    </div>
  )
}

function heuresDe(creneaux: string): (number | '')[] {
  const plages = [...(creneaux || '').matchAll(/(\d{1,2})\s*[h:H]?\d*\s*[-\u2013]\s*(\d{1,2})/g)]
  const vals: (number | '')[] = ['', '', '', '']
  plages.slice(0, 2).forEach((m, i) => {
    vals[i * 2] = parseInt(m[1], 10)
    vals[i * 2 + 1] = parseInt(m[2], 10)
  })
  return vals
}

function creneauxDe(vals: (number | '')[]): string {
  const plages: string[] = []
  for (let i = 0; i < 4; i += 2) {
    const a = vals[i]
    const b = vals[i + 1]
    if (a !== '' && b !== '') plages.push(`${a}h - ${b}h`)
  }
  return plages.join(' \u00b7 ')
}

function HeureInput({ value, onChange, disabled }: { value: number | ''; onChange: (v: number | '') => void; disabled?: boolean }) {
  return (
    <input
      className="adm__input adm__input--heure"
      type="number"
      min={0}
      max={23}
      step={1}
      placeholder="--"
      value={value}
      disabled={disabled}
      onChange={e => {
        const raw = e.target.value
        if (raw === '') return onChange('')
        const n = Math.max(0, Math.min(23, Math.floor(Number(raw))))
        onChange(Number.isNaN(n) ? '' : n)
      }}
    />
  )
}

const ICONES: Record<string, React.ReactNode> = (() => {
  const I = (d: string) => (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return {
    general: I('M4 6h16M4 12h16M4 18h16M8 4v4M14 10v4M10 16v4'),
    infos: I('M12 21s-6-5.2-6-9.8A6 6 0 0 1 18 11.2C18 15.8 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'),
    articles: I('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'),
    burgers: I('M4 10a8 4.5 0 0 1 16 0zM4 13h16M5 16h14a0 0 0 0 1 0 3H5a0 0 0 0 1 0-3z'),
    kids: I('M12 3l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.3 8.6l5.3-.8z'),
    sandwich: I('M3 14l9-7 9 7-2 3H5zM6 17h12'),
    phare: I('M12 2l2 5h5l-4 3.5L16.5 16 12 13l-4.5 3L9 10.5 5 7h5z'),
    tailles: I('M3 19L12 4l9 15zM8.5 19L12 12l3.5 7'),
    viandes: I('M15 4a5 5 0 0 1 0 10l-4 4-2-2 4-4a5 5 0 0 1 2-8zM6 18l-2 2'),
    sauces: I('M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10z'),
    gratinage: I('M3 17l18-8-2 10H4zM9 14.5a1 1 0 1 0 0 .01M14 12.5a1 1 0 1 0 0 .01'),
    extras: I('M12 5v14M5 12h14'),
    texmex: I('M12 3c2 3 6 4 6 9a6 6 0 0 1-12 0c0-3 2-4 3-6 .5 1.5 2 2 3-3z'),
    frites: I('M7 9l1 11h8l1-11zM9 9V4M12 9V3M15 9V5'),
    desserts: I('M8 10a4 4 0 0 1 8 0zM12 10v7M9 21h6M12 17c-2 0-3 2-3 4M12 17c2 0 3 2 3 4'),
    boissons: I('M6 5h12l-1.5 15h-9zM6 9h12M13 5l2-3'),
  }
})()

export default function Admin() {
  useTitle('Admin')
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState('')
  const [conflict, setConflict] = useState(false)
  const [nav, setNav] = useState('hub')
  const [search, setSearch] = useState('')
  const stampRef = useRef<string | null>(null)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty

  const reload = async () => {
    const { menu: fresh, stamp } = await fetchMenuStamped()
    stampRef.current = stamp
    setMenu(fresh)
    setDirty(false)
    setConflict(false)
  }

  useEffect(() => {
    reload().catch(() => setStatus('Serveur injoignable'))

    return watchTable('menu-admin', 'menu', async () => {
      try {
        const stamp = await fetchMenuStamp()
        if (stamp === stampRef.current) return
        if (!dirtyRef.current) {
          await reload()
          setStatus('Menu mis à jour depuis un autre appareil ✓')
          setTimeout(() => setStatus(''), 3000)
        } else {
          setConflict(true)
        }
      } catch {}
    }, { pollMs: 120000 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update: Draft = fn => {
    setMenu(m => {
      if (!m) return m
      const d = structuredClone(m)
      fn(d)
      return d
    })
    setDirty(true)
  }

  const moveItem = (arr: unknown[], i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  const save = async () => {
    if (!menu) return
    setStatus('Enregistrement...')
    try {
      let result = await saveMenuGuarded(menu, stampRef.current)

      if (!result.ok) {
        const stampBase = await fetchMenuStamp()
        if (stampBase !== stampRef.current) {
          setConflict(true)
          setStatus('')
          return
        }
        setStatus('Session expirée — reconnexion...')
        await resignIn()
        result = await saveMenuGuarded(menu, stampRef.current)
        if (!result.ok) {
          setStatus('Échec — recharge la page et réessaie')
          return
        }
      }

      stampRef.current = result.stamp
      setDirty(false)
      setConflict(false)
      setStatus('Enregistré ✓')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('Erreur — enregistrement impossible, réessaie')
    }
  }

  if (!menu) return <div className="adm adm--loading">{status || 'Chargement...'}</div>

  const filtre = search.trim().toLowerCase()
  const correspond = (nom: string) => !filtre || (nom || '').toLowerCase().includes(filtre)

  interface Categorie {
    id: string
    label: string
    count: number
    matches: number
    rendu: (enRecherche: boolean) => React.ReactNode
  }

  const categories: Categorie[] = [
    {
      id: 'burgers',
      label: 'Burgers',
      count: menu.page1.burgers.length,
      matches: menu.page1.burgers.filter(b => correspond(b.name)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page1.burgers.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page1.burgers[i], p))} onMove={dir => update(d => moveItem(d.page1.burgers, i, dir))} onDelete={() => update(d => { d.page1.burgers.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page1.burgers.push({ id: `burger-${Date.now()}`, label: '', name: '', desc: '', price: 0, img: '', available: true, featured: false }) })}
            >
              + AJOUTER UN BURGER
            </button>
          )}
        </>
      ),
    },
    {
      id: 'kids',
      label: 'Menu Kids',
      count: 1,
      matches: correspond(menu.page2.menuKids.name) ? 1 : 0,
      rendu: () => (
        <Row {...menu.page2.menuKids} onPatch={p => update(d => Object.assign(d.page2.menuKids, p))} />
      ),
    },
    {
      id: 'sandwich',
      label: 'Sandwich composé',
      count: 1,
      matches: correspond('sandwich') ? 1 : 0,
      rendu: () => (
        <>
          <div className={`adm__row${menu.page2.sandwich.available ? '' : ' adm__row--off'}`}>
            <ImgPicker img={menu.page2.sandwich.img} onPick={url => update(d => { d.page2.sandwich.img = url })} />
            <div className="adm__fields adm__fields--inline">
              <label className="adm__inline-label">1 viande</label>
              <PriceInput value={menu.page2.sandwich.prixSimple} onChange={n => update(d => { d.page2.sandwich.prixSimple = n })} />
              <label className="adm__inline-label">Double viande</label>
              <PriceInput value={menu.page2.sandwich.prixDouble} onChange={n => update(d => { d.page2.sandwich.prixDouble = n })} />
            </div>
            <button
              className={`adm__toggle${menu.page2.sandwich.available ? ' adm__toggle--on' : ''}`}
              onClick={() => update(d => { d.page2.sandwich.available = !d.page2.sandwich.available })}
            >
              {menu.page2.sandwich.available ? 'DISPO' : 'ÉPUISÉ'}
            </button>
          </div>
          <div className="adm__row">
            <div className="adm__fields">
              <label className="adm__inline-label">Composition</label>
              <IngredientEditor
                value={menu.page2.sandwich.inclus}
                onChange={v => update(d => { d.page2.sandwich.inclus = v })}
              />
            </div>
          </div>
          <p className="adm__hint">L'écart entre les deux prix devient le supplément viande, partout. La composition s'affiche sous la formule sur l'écran 2.</p>
        </>
      ),
    },
    {
      id: 'phare',
      label: 'Sandwich phare',
      count: 1,
      matches: correspond(menu.page2.sandwichPhare.name) ? 1 : 0,
      rendu: () => (
        <>
          <Row {...menu.page2.sandwichPhare} onPatch={p => update(d => Object.assign(d.page2.sandwichPhare, p))} />
          <p className="adm__hint">Mis en avant sur l'écran 2, sur bandeau blanc, au-dessus des viandes.</p>
        </>
      ),
    },
    {
      id: 'tailles',
      label: 'Tacos — tailles',
      count: menu.page3.tailles.length,
      matches: menu.page3.tailles.filter(t => correspond(`tacos ${t.size}`)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page3.tailles.map((t, i) => (enRecherche && !correspond(`tacos ${t.size}`) ? null : (
            <div key={t.id} className={`adm__row${t.available ? '' : ' adm__row--off'}`}>
              <div className="adm__fields adm__fields--inline">
                <input className="adm__input adm__input--size" value={t.size} onChange={e => update(d => { d.page3.tailles[i].size = e.target.value })} />
                <input className="adm__input adm__input--name" value={t.viandes} onChange={e => update(d => { d.page3.tailles[i].viandes = e.target.value })} />
              </div>
              <PriceInput value={t.price} onChange={n => update(d => { d.page3.tailles[i].price = n })} />
              <button
                className={`adm__toggle${t.available ? ' adm__toggle--on' : ''}`}
                onClick={() => update(d => { d.page3.tailles[i].available = !d.page3.tailles[i].available })}
              >
                {t.available ? 'DISPO' : 'ÉPUISÉ'}
              </button>
              <button className="adm__delete" title="Supprimer" onClick={() => update(d => { d.page3.tailles.splice(i, 1) })}>×</button>
            </div>
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page3.tailles.push({ id: `taille-${Date.now()}`, size: '', viandes: '', price: 0, available: true }) })}
            >
              + AJOUTER UNE TAILLE DE TACOS
            </button>
          )}
        </>
      ),
    },
    {
      id: 'viandes',
      label: 'Viandes',
      count: menu.page3.viandes.length,
      matches: menu.page3.viandes.filter(v => correspond(v.name)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page3.viandes.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page3.viandes[i], p))} onMove={dir => update(d => moveItem(d.page3.viandes, i, dir))} onDelete={() => update(d => { d.page3.viandes.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page3.viandes.push({ id: `viande-${Date.now()}`, name: '', img: '', available: true }) })}
            >
              + AJOUTER UNE VIANDE
            </button>
          )}
        </>
      ),
    },
    {
      id: 'sauces',
      label: 'Sauces',
      count: menu.page3.sauces.classiques.length,
      matches: menu.page3.sauces.classiques.filter(n => correspond(n)).length,
      rendu: () => (
        <>
          <h3>Photo</h3>
          <div className="adm__row">
            <ImgPicker img={menu.page3.saucesImg} onPick={url => update(d => { d.page3.saucesImg = url })} />
            <div className="adm__fields adm__fields--inline">
              <label className="adm__inline-label">Photo affichée à gauche des sauces</label>
            </div>
          </div>
          <h3>Sauces proposées</h3>
          <div className="adm__row">
            <IngredientEditor
              value={menu.page3.sauces.classiques.join(' · ')}
              onChange={v => update(d => { d.page3.sauces.classiques = v.split(' · ').filter(Boolean) })}
            />
          </div>
        </>
      ),
    },
    {
      id: 'gratinage',
      label: 'Gratinage',
      count: menu.page3.gratinage.length,
      matches: menu.page3.gratinage.filter(g => correspond(g.name)).length,
      rendu: (enRecherche) => (
        <>
          {!enRecherche && (
            <>
              <h3>Supplément
                <input
                  className="adm__input adm__input--price"
                  value={menu.page3.gratinagePrice}
                  onChange={e => update(d => { d.page3.gratinagePrice = e.target.value })}
                />
              </h3>
              <div className="adm__row">
                <ImgPicker img={menu.page3.gratinageImg} onPick={url => update(d => { d.page3.gratinageImg = url })} />
                <div className="adm__fields adm__fields--inline">
                  <label className="adm__inline-label">Photo affichée au-dessus de "Gratine ton tacos"</label>
                </div>
              </div>
            </>
          )}
          {menu.page3.gratinage.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page3.gratinage[i], p))} onMove={dir => update(d => moveItem(d.page3.gratinage, i, dir))} onDelete={() => update(d => { d.page3.gratinage.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page3.gratinage.push({ id: `gratinage-${Date.now()}`, name: '', available: true }) })}
            >
              + AJOUTER UN GRATINAGE
            </button>
          )}
        </>
      ),
    },
    {
      id: 'extras',
      label: 'Extras',
      count: menu.page3.extras.items.length,
      matches: menu.page3.extras.items.filter(e => correspond(e.name)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page3.extras.items.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} price={item.price ?? 0} onPatch={p => update(d => Object.assign(d.page3.extras.items[i], p))} onMove={dir => update(d => moveItem(d.page3.extras.items, i, dir))} onDelete={() => update(d => { d.page3.extras.items.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page3.extras.items.push({ id: `extra-${Date.now()}`, name: '', img: '', price: 0, available: true }) })}
            >
              + AJOUTER UN EXTRA
            </button>
          )}
        </>
      ),
    },
    {
      id: 'texmex',
      label: 'Tex-Mex',
      count: menu.page1.texmex.length,
      matches: menu.page1.texmex.filter(t => correspond(t.name)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page1.texmex.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page1.texmex[i], p))} onMove={dir => update(d => moveItem(d.page1.texmex, i, dir))} onDelete={() => update(d => { d.page1.texmex.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page1.texmex.push({ id: `texmex-${Date.now()}`, name: '', price: 0, img: '', available: true }) })}
            >
              + AJOUTER UN TEX-MEX
            </button>
          )}
        </>
      ),
    },
    {
      id: 'frites',
      label: 'Frites',
      count: menu.page2.frites.length,
      matches: menu.page2.frites.filter(f => correspond(`frites ${f.name}`)).length + menu.page2.friteSupplements.filter(f => correspond(f.name)).length,
      rendu: (enRecherche) => (
        <>
          {!enRecherche && (
            <>
              <h3>Photo</h3>
              <div className="adm__row">
                <ImgPicker img={menu.page2.fritesImg} onPick={url => update(d => { d.page2.fritesImg = url })} />
                <div className="adm__fields adm__fields--inline">
                  <label className="adm__inline-label">Photo affichée à gauche du bloc frites</label>
                </div>
              </div>
              <h3>Tailles et prix</h3>
            </>
          )}
          {menu.page2.frites.map((item, i) => (enRecherche && !correspond(`frites ${item.name}`) ? null : (
            <Row key={item.id} {...item} img={undefined} onPatch={p => update(d => Object.assign(d.page2.frites[i], p))} onMove={dir => update(d => moveItem(d.page2.frites, i, dir))} onDelete={() => update(d => { d.page2.frites.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <>
              <button
                className="adm__add"
                onClick={() => update(d => { d.page2.frites.push({ id: `frites-${Date.now()}`, name: '', price: 0, available: true }) })}
              >
                + AJOUTER UNE TAILLE
              </button>
              <h3>Suppléments à
                <input
                  className="adm__input adm__input--price"
                  value={menu.page2.friteSupplementsPrice}
                  onChange={e => update(d => { d.page2.friteSupplementsPrice = e.target.value })}
                />
              </h3>
            </>
          )}
          {menu.page2.friteSupplements.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page2.friteSupplements[i], p))} onMove={dir => update(d => moveItem(d.page2.friteSupplements, i, dir))} onDelete={() => update(d => { d.page2.friteSupplements.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page2.friteSupplements.push({ id: `fritesup-${Date.now()}`, name: '', available: true }) })}
            >
              + AJOUTER UN SUPPLÉMENT FRITES
            </button>
          )}
        </>
      ),
    },
    {
      id: 'desserts',
      label: 'Desserts',
      count: menu.page2.desserts.length,
      matches: menu.page2.desserts.filter(d => correspond(d.name)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page2.desserts.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} img={item.img ?? ''} onPatch={p => update(d => Object.assign(d.page2.desserts[i], p))} onMove={dir => update(d => moveItem(d.page2.desserts, i, dir))} onDelete={() => update(d => { d.page2.desserts.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <button
              className="adm__add"
              onClick={() => update(d => { d.page2.desserts.push({ id: `dessert-${Date.now()}`, name: '', price: 0, img: '', available: true }) })}
            >
              + AJOUTER UN DESSERT
            </button>
          )}
        </>
      ),
    },
    {
      id: 'boissons',
      label: 'Boissons',
      count: menu.page2.boissons.length,
      matches: menu.page2.boissons.filter(b => correspond(b.name)).length,
      rendu: (enRecherche) => (
        <>
          {menu.page2.boissons.map((item, i) => (enRecherche && !correspond(item.name) ? null : (
            <Row key={item.id} {...item} img={item.img ?? ''} onPatch={p => update(d => Object.assign(d.page2.boissons[i], p))} onMove={dir => update(d => moveItem(d.page2.boissons, i, dir))} onDelete={() => update(d => { d.page2.boissons.splice(i, 1) })} />
          )))}
          {!enRecherche && (
            <>
              <button
                className="adm__add"
                onClick={() => update(d => { d.page2.boissons.push({ id: `boisson-${Date.now()}`, name: '', price: 0, img: '', available: true }) })}
              >
                + AJOUTER UNE BOISSON
              </button>
              <p className="adm__hint">Affichées sur l'écran 1, à droite du Menu Kids. La photo est facultative.</p>
            </>
          )}
        </>
      ),
    },
  ]


  return (
    <div className="adm">
      <header className="adm__header">
        <h1>ADMIN<span className="adm__h1-suffix"> — BARAKA FOOD</span></h1>
        <div className="adm__header-right">
          <span className="adm__status">{status || (dirty ? 'Modifications non enregistrées' : '')}</span>
          <button className="adm__save" onClick={save} disabled={!dirty || conflict}>ENREGISTRER</button>
        </div>
      </header>

      {conflict && (
        <div className="adm__conflict">
          <span>
            Le menu a été modifié depuis un autre appareil. Pour ne rien écraser, recharge avant de
            réenregistrer — tes modifications non enregistrées seront perdues.
          </span>
          <button onClick={() => reload().catch(() => setStatus('Serveur injoignable'))}>RECHARGER LE MENU</button>
        </div>
      )}

      <div className="adm__toolbar">
        {!search.trim() && nav !== 'hub' && (
          <button
            className="adm__back"
            onClick={() => setNav(nav === 'articles' || nav === 'general' || nav === 'infos' ? 'hub' : 'articles')}
          >
            ← Retour
          </button>
        )}
        <input
          className="adm__search"
          type="search"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="adm__body">
        {search.trim() ? (
          <>
            <p className="adm__result-title">Résultats pour « {search.trim()} »</p>
            {categories.filter(cat => cat.matches > 0).map(cat => (
              <section key={cat.id} className="adm__section">
                <h2>
                  {cat.label}
                  <button className="adm__goto" onClick={() => { setSearch(''); setNav(cat.id) }}>
                    Ouvrir la catégorie →
                  </button>
                </h2>
                {cat.rendu(true)}
              </section>
            ))}
            {categories.every(cat => cat.matches === 0) && (
              <p className="adm__hint">Aucun article ne correspond.</p>
            )}
          </>
        ) : nav === 'hub' ? (
          <div className="adm__hub">
            {([
              ['general', 'Général', ICONES.general, ''],
              ['infos', 'Contact & horaires', ICONES.infos, ''],
              ['articles', 'Articles', ICONES.articles, String(categories.reduce((n, c) => n + c.count, 0))],
            ] as const).map(([id, label, icone, badge]) => (
              <button key={id} className="adm__tile adm__tile--big" onClick={() => setNav(id)}>
                <span className="adm__tile-icon">{icone}</span>
                {badge && <span className="adm__tile-count">{badge}</span>}
                <span className="adm__tile-label">{label}</span>
              </button>
            ))}
          </div>
        ) : nav === 'articles' ? (
          <div className="adm__hub adm__hub--dense">
            {categories.map(cat => (
              <button key={cat.id} className="adm__tile" onClick={() => setNav(cat.id)}>
                <span className="adm__tile-icon">{ICONES[cat.id]}</span>
                {cat.count > 0 && <span className="adm__tile-count">{cat.count}</span>}
                <span className="adm__tile-label">{cat.label}</span>
              </button>
            ))}
          </div>
        ) : nav === 'general' ? (
          <section className="adm__section">
            <h2>GÉNÉRAL</h2>
            <h3>Bandeau menu</h3>
            <div className="adm__row">
              <div className="adm__fields">
                <input className="adm__input adm__input--name" value={menu.note.label} onChange={e => update(d => { d.note.label = e.target.value })} />
              </div>
              <input className="adm__input adm__input--price" value={menu.note.price} onChange={e => update(d => { d.note.price = e.target.value })} />
            </div>
            <div className="adm__row">
              <ImgPicker img={menu.note.img} onPick={url => update(d => { d.note.img = url })} />
              <div className="adm__fields adm__fields--inline">
                <label className="adm__inline-label">Photo en haut à droite des écrans</label>
              </div>
              {menu.note.img && (
                <button className="adm__delete" onClick={() => update(d => { d.note.img = '' })}>×</button>
              )}
            </div>

            <h3>Titres des écrans</h3>
            {([['Écran 1', 'page1'], ['Écran 2', 'page2'], ['Écran 3', 'page3']] as const).map(([label, page]) => (
              <div key={page} className="adm__row">
                <div className="adm__fields adm__fields--inline">
                  <label className="adm__inline-label">{label}</label>
                  <input
                    className="adm__input adm__input--name"
                    value={menu[page].title}
                    onChange={e => update(d => { d[page].title = e.target.value })}
                  />
                </div>
              </div>
            ))}
          </section>
        ) : nav === 'infos' ? (
          <section className="adm__section">
            <h2>CONTACT &amp; HORAIRES</h2>

            <h3>Coordonnées</h3>
            <div className="adm__row">
              <div className="adm__fields adm__fields--inline">
                <label className="adm__inline-label">Téléphone</label>
                <input
                  className="adm__input adm__input--name"
                  value={menu.infos.telephone}
                  placeholder="04 79 00 00 00"
                  onChange={e => update(d => { d.infos.telephone = e.target.value })}
                />
              </div>
            </div>
            <div className="adm__row">
              <div className="adm__fields adm__fields--inline">
                <label className="adm__inline-label">E-mail</label>
                <input
                  className="adm__input adm__input--name"
                  value={menu.infos.email}
                  placeholder="contact@barakafood.fr"
                  onChange={e => update(d => { d.infos.email = e.target.value })}
                />
              </div>
            </div>

            <h3>Adresse</h3>
            <textarea
              className="adm__textarea"
              value={menu.infos.adresse}
              placeholder={'Place Clemenceau\n73100 Aix-les-Bains'}
              onChange={e => update(d => { d.infos.adresse = e.target.value })}
            />

            <h3>Horaires d&apos;ouverture</h3>
            {menu.infos.horaires.map((h, i) => (
              <div key={h.jour} className={`adm__row${h.ferme ? ' adm__row--off' : ''}`}>
                <div className="adm__fields adm__fields--inline">
                  <label className="adm__inline-label adm__inline-label--day">{h.jour}</label>
                  {(() => {
                    const vals = heuresDe(h.creneaux)
                    const setVal = (j: number, v: number | '') => update(d => {
                      const next = heuresDe(d.infos.horaires[i].creneaux)
                      next[j] = v
                      d.infos.horaires[i].creneaux = creneauxDe(next)
                    })
                    return (
                      <span className="adm__heures">
                        <span className="adm__heures-plage">
                          <span>de</span>
                          <HeureInput value={vals[0]} disabled={h.ferme} onChange={v => setVal(0, v)} />
                          <span>h à</span>
                          <HeureInput value={vals[1]} disabled={h.ferme} onChange={v => setVal(1, v)} />
                          <span>h</span>
                        </span>
                        <span className="adm__heures-plage">
                          <span>puis de</span>
                          <HeureInput value={vals[2]} disabled={h.ferme} onChange={v => setVal(2, v)} />
                          <span>h à</span>
                          <HeureInput value={vals[3]} disabled={h.ferme} onChange={v => setVal(3, v)} />
                          <span>h</span>
                        </span>
                      </span>
                    )
                  })()}
                </div>
                <button
                  className={`adm__toggle${h.ferme ? '' : ' adm__toggle--on'}`}
                  onClick={() => update(d => { d.infos.horaires[i].ferme = !d.infos.horaires[i].ferme })}
                >
                  {h.ferme ? 'FERMÉ' : 'OUVERT'}
                </button>
              </div>
            ))}
            <p className="adm__hint">Ces informations alimentent le site vitrine, les flyers et l'écran des commandes.</p>
          </section>
        ) : (
          (() => {
            const cat = categories.find(c => c.id === nav)
            if (!cat) return null
            return (
              <section className="adm__section">
                <h2>{cat.label}</h2>
                {cat.rendu(false)}
              </section>
            )
          })()
        )}
      </div>
    </div>
  )
}
