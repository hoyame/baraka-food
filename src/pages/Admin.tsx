import { useEffect, useRef, useState } from 'react'
import { fetchMenu, saveMenu, uploadImage, imgUrl } from '../lib/api'
import type { MenuData } from '../lib/api'
import './Admin.scss'

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
    <button className="adm__thumb" onClick={() => inputRef.current?.click()} disabled={busy}>
      <img src={imgUrl(img)} alt="" />
      <span>{busy ? '...' : '↻'}</span>
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

interface RowProps {
  img?: string
  label?: string
  name: string
  desc?: string
  price?: number | string
  available: boolean
  onPatch: (p: Record<string, unknown>) => void
}

function Row({ img, label, name, desc, price, available, onPatch }: RowProps) {
  return (
    <div className={`adm__row${available ? '' : ' adm__row--off'}`}>
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
        <input
          className="adm__input adm__input--price"
          type="number"
          step="0.01"
          value={price}
          onChange={e => onPatch({ price: parseFloat(e.target.value) || 0 })}
        />
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
    </div>
  )
}

export default function Admin() {
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchMenu().then(setMenu).catch(() => setStatus('Serveur injoignable — lance `npm run server`'))
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

  const save = async () => {
    if (!menu) return
    setStatus('Enregistrement...')
    try {
      await saveMenu(menu)
      setDirty(false)
      setStatus('Enregistré ✓')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('Erreur — serveur injoignable')
    }
  }

  if (!menu) return <div className="adm adm--loading">{status || 'Chargement...'}</div>

  return (
    <div className="adm">
      <header className="adm__header">
        <h1>ADMIN — BARAKA FOOD</h1>
        <div className="adm__header-right">
          <span className="adm__status">{status || (dirty ? 'Modifications non enregistrées' : '')}</span>
          <button className="adm__save" onClick={save} disabled={!dirty}>ENREGISTRER</button>
        </div>
      </header>

      <div className="adm__body">
        <section className="adm__section">
          <h2>GÉNÉRAL</h2>
          <div className="adm__row">
            <div className="adm__fields">
              <input className="adm__input adm__input--name" value={menu.note.label} onChange={e => update(d => { d.note.label = e.target.value })} />
            </div>
            <input className="adm__input adm__input--price" value={menu.note.price} onChange={e => update(d => { d.note.price = e.target.value })} />
          </div>
        </section>

        <section className="adm__section">
          <h2>PAGE 1 — <input className="adm__input adm__input--title" value={menu.page1.title} onChange={e => update(d => { d.page1.title = e.target.value })} /></h2>

          <h3>Burgers</h3>
          {menu.page1.burgers.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page1.burgers[i], p))} />
          ))}

          <h3>Texmex</h3>
          {menu.page1.texmex.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page1.texmex[i], p))} />
          ))}
        </section>

        <section className="adm__section">
          <h2>SUPPLÉMENTS (pages 1 &amp; 2)</h2>
          {menu.supplements.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.supplements[i], p))} />
          ))}
        </section>

        <section className="adm__section">
          <h2>PAGE 2 — <input className="adm__input adm__input--title" value={menu.page2.title} onChange={e => update(d => { d.page2.title = e.target.value })} /></h2>

          <h3>Classiques</h3>
          {menu.page2.classiques.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page2.classiques[i], p))} />
          ))}

          <h3>Crunchy</h3>
          <Row {...menu.page2.crunchy} onPatch={p => update(d => Object.assign(d.page2.crunchy, p))} />

          <h3>Menu Kids</h3>
          <Row {...menu.page2.menuKids} onPatch={p => update(d => Object.assign(d.page2.menuKids, p))} />

          <h3>Frites</h3>
          {menu.page2.frites.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page2.frites[i], p))} />
          ))}

          <h3>Desserts</h3>
          {menu.page2.desserts.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page2.desserts[i], p))} />
          ))}

          <h3>Boissons</h3>
          {menu.page2.boissons.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page2.boissons[i], p))} />
          ))}
        </section>

        <section className="adm__section">
          <h2>PAGE 3 — <input className="adm__input adm__input--title" value={menu.page3.title} onChange={e => update(d => { d.page3.title = e.target.value })} /></h2>

          <h3>Tailles</h3>
          {menu.page3.tailles.map((t, i) => (
            <div key={t.id} className={`adm__row${t.available ? '' : ' adm__row--off'}`}>
              <div className="adm__fields adm__fields--inline">
                <input className="adm__input adm__input--size" value={t.size} onChange={e => update(d => { d.page3.tailles[i].size = e.target.value })} />
                <input className="adm__input adm__input--name" value={t.viandes} onChange={e => update(d => { d.page3.tailles[i].viandes = e.target.value })} />
              </div>
              <input
                className="adm__input adm__input--price"
                type="number"
                step="0.01"
                value={t.price}
                onChange={e => update(d => { d.page3.tailles[i].price = parseFloat(e.target.value) || 0 })}
              />
              <button
                className={`adm__toggle${t.available ? ' adm__toggle--on' : ''}`}
                onClick={() => update(d => { d.page3.tailles[i].available = !d.page3.tailles[i].available })}
              >
                {t.available ? 'DISPO' : 'ÉPUISÉ'}
              </button>
            </div>
          ))}

          <h3>Viandes</h3>
          {menu.page3.viandes.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page3.viandes[i], p))} />
          ))}

          <h3>Sauces classiques</h3>
          <textarea
            className="adm__textarea"
            value={menu.page3.sauces.classiques.join(', ')}
            onChange={e => update(d => { d.page3.sauces.classiques = e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          />

          <h3>Sauces piquantes</h3>
          <textarea
            className="adm__textarea"
            value={menu.page3.sauces.piquantes.join(', ')}
            onChange={e => update(d => { d.page3.sauces.piquantes = e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          />

          <h3>Extras — surcharge
            <input
              className="adm__input adm__input--price"
              value={menu.page3.extras.surcharge}
              onChange={e => update(d => { d.page3.extras.surcharge = e.target.value })}
            />
          </h3>
          {menu.page3.extras.items.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page3.extras.items[i], p))} />
          ))}
        </section>
      </div>
    </div>
  )
}
