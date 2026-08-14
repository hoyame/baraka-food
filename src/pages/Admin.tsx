import { useEffect, useRef, useState } from 'react'
import { fetchMenu, saveMenu, uploadImage, imgUrl } from '../lib/api'
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

export default function Admin() {
  useTitle('Admin')
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

  const moveItem = (arr: unknown[], i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
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
          <div className="adm__row">
            <ImgPicker img={menu.note.img} onPick={url => update(d => { d.note.img = url })} />
            <div className="adm__fields adm__fields--inline">
              <label className="adm__inline-label">Photo en haut à droite des écrans</label>
            </div>
            {menu.note.img && (
              <button className="adm__delete" onClick={() => update(d => { d.note.img = '' })}>×</button>
            )}
          </div>
        </section>

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
                <input
                  className="adm__input adm__input--name"
                  value={h.creneaux}
                  placeholder="11h30 – 14h00 · 18h00 – 22h30"
                  disabled={h.ferme}
                  onChange={e => update(d => { d.infos.horaires[i].creneaux = e.target.value })}
                />
              </div>
              <button
                className={`adm__toggle${h.ferme ? '' : ' adm__toggle--on'}`}
                onClick={() => update(d => { d.infos.horaires[i].ferme = !d.infos.horaires[i].ferme })}
              >
                {h.ferme ? 'FERMÉ' : 'OUVERT'}
              </button>
            </div>
          ))}
          <p className="adm__hint">Ces informations alimentent le site vitrine (pied de page et page horaires).</p>
        </section>

        <section className="adm__section">
          <h2>PAGE 1 — <input className="adm__input adm__input--title" value={menu.page1.title} onChange={e => update(d => { d.page1.title = e.target.value })} /></h2>

          <h3>Burgers</h3>
          {menu.page1.burgers.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page1.burgers[i], p))} onMove={dir => update(d => moveItem(d.page1.burgers, i, dir))} onDelete={() => update(d => { d.page1.burgers.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => { d.page1.burgers.push({ id: `burger-${Date.now()}`, label: '', name: '', desc: '', price: 0, img: '', available: true, featured: false }) })}
          >
            + AJOUTER UN BURGER
          </button>

          <h3>Menu Kids</h3>
          <Row {...menu.page2.menuKids} onPatch={p => update(d => Object.assign(d.page2.menuKids, p))} />
        </section>

        <section className="adm__section">
          <h2>PAGE 2 — <input className="adm__input adm__input--title" value={menu.page2.title} onChange={e => update(d => { d.page2.title = e.target.value })} /></h2>

          <h3>Sandwich composé</h3>
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
          <p className="adm__hint">Les viandes proposées sont celles de la section "Viandes" de la page 3. La composition s'affiche sous la formule "1 viande au choix", sur l'écran 2.</p>

          <h3>Sandwich phare</h3>
          <Row {...menu.page2.sandwichPhare} onPatch={p => update(d => Object.assign(d.page2.sandwichPhare, p))} />
          <p className="adm__hint">Mis en avant sur l'écran 2, sur bandeau blanc, au-dessus des viandes.</p>

          <h3>Tex-Mex</h3>
          {menu.page1.texmex.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page1.texmex[i], p))} onMove={dir => update(d => moveItem(d.page1.texmex, i, dir))} onDelete={() => update(d => { d.page1.texmex.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => {
              d.page1.texmex.push({ id: `texmex-${Date.now()}`, name: '', price: 0, img: '', available: true })
            })}
          >
            + AJOUTER UN TEX-MEX
          </button>

          <h3>Frites — photo</h3>
          <div className="adm__row">
            <ImgPicker img={menu.page2.fritesImg} onPick={url => update(d => { d.page2.fritesImg = url })} />
            <div className="adm__fields adm__fields--inline">
              <label className="adm__inline-label">Photo affichée à gauche du bloc frites</label>
            </div>
          </div>

          <h3>Frites — tailles et prix</h3>
          {menu.page2.frites.map((item, i) => (
            <Row key={item.id} {...item} img={undefined} onPatch={p => update(d => Object.assign(d.page2.frites[i], p))} onMove={dir => update(d => moveItem(d.page2.frites, i, dir))} onDelete={() => update(d => { d.page2.frites.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => {
              d.page2.frites.push({ id: `frites-${Date.now()}`, name: '', price: 0, available: true })
            })}
          >
            + AJOUTER UNE TAILLE
          </button>

          <h3>Frites — suppléments à
            <input
              className="adm__input adm__input--price"
              value={menu.page2.friteSupplementsPrice}
              onChange={e => update(d => { d.page2.friteSupplementsPrice = e.target.value })}
            />
          </h3>
          {menu.page2.friteSupplements.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page2.friteSupplements[i], p))} onMove={dir => update(d => moveItem(d.page2.friteSupplements, i, dir))} onDelete={() => update(d => { d.page2.friteSupplements.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => {
              d.page2.friteSupplements.push({ id: `fritesup-${Date.now()}`, name: '', available: true })
            })}
          >
            + AJOUTER UN SUPPLÉMENT FRITES
          </button>

          <h3>Desserts</h3>
          {menu.page2.desserts.map((item, i) => (
            <Row key={item.id} {...item} img={item.img ?? ''} onPatch={p => update(d => Object.assign(d.page2.desserts[i], p))} onMove={dir => update(d => moveItem(d.page2.desserts, i, dir))} onDelete={() => update(d => { d.page2.desserts.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => {
              d.page2.desserts.push({ id: `dessert-${Date.now()}`, name: '', price: 0, img: '', available: true })
            })}
          >
            + AJOUTER UN DESSERT
          </button>

          <h3>Boissons</h3>
          {menu.page2.boissons.map((item, i) => (
            <Row key={item.id} {...item} img={item.img ?? ''} onPatch={p => update(d => Object.assign(d.page2.boissons[i], p))} onMove={dir => update(d => moveItem(d.page2.boissons, i, dir))} onDelete={() => update(d => { d.page2.boissons.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => { d.page2.boissons.push({ id: `boisson-${Date.now()}`, name: '', price: 0, img: '', available: true }) })}
          >
            + AJOUTER UNE BOISSON
          </button>
          <p className="adm__hint">Affichées sur l'écran 1, à droite du Menu Kids. La photo est facultative.</p>
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
              <PriceInput value={t.price} onChange={n => update(d => { d.page3.tailles[i].price = n })} />
              <button
                className={`adm__toggle${t.available ? ' adm__toggle--on' : ''}`}
                onClick={() => update(d => { d.page3.tailles[i].available = !d.page3.tailles[i].available })}
              >
                {t.available ? 'DISPO' : 'ÉPUISÉ'}
              </button>
              <button className="adm__delete" title="Supprimer" onClick={() => update(d => { d.page3.tailles.splice(i, 1) })}>×</button>
            </div>
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => { d.page3.tailles.push({ id: `taille-${Date.now()}`, size: '', viandes: '', price: 0, available: true }) })}
          >
            + AJOUTER UNE TAILLE DE TACOS
          </button>

          <h3>Viandes</h3>
          {menu.page3.viandes.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page3.viandes[i], p))} onMove={dir => update(d => moveItem(d.page3.viandes, i, dir))} onDelete={() => update(d => { d.page3.viandes.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => { d.page3.viandes.push({ id: `viande-${Date.now()}`, name: '', img: '', available: true }) })}
          >
            + AJOUTER UNE VIANDE
          </button>

          <h3>Sauces — photo</h3>
          <div className="adm__row">
            <ImgPicker img={menu.page3.saucesImg} onPick={url => update(d => { d.page3.saucesImg = url })} />
            <div className="adm__fields adm__fields--inline">
              <label className="adm__inline-label">Photo affichée à gauche des sauces</label>
            </div>
          </div>

          <h3>Sauces classiques</h3>
          <div className="adm__row">
            <IngredientEditor
              value={menu.page3.sauces.classiques.join(' · ')}
              onChange={v => update(d => { d.page3.sauces.classiques = v.split(' · ').filter(Boolean) })}
            />
          </div>

          <h3>Gratinage — supplément
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
          {menu.page3.gratinage.map((item, i) => (
            <Row key={item.id} {...item} onPatch={p => update(d => Object.assign(d.page3.gratinage[i], p))} onMove={dir => update(d => moveItem(d.page3.gratinage, i, dir))} onDelete={() => update(d => { d.page3.gratinage.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => {
              d.page3.gratinage.push({ id: `gratinage-${Date.now()}`, name: '', available: true })
            })}
          >
            + AJOUTER UN GRATINAGE
          </button>

          <h3>Extras</h3>
          {menu.page3.extras.items.map((item, i) => (
            <Row key={item.id} {...item} price={item.price ?? 0} onPatch={p => update(d => Object.assign(d.page3.extras.items[i], p))} onMove={dir => update(d => moveItem(d.page3.extras.items, i, dir))} onDelete={() => update(d => { d.page3.extras.items.splice(i, 1) })} />
          ))}
          <button
            className="adm__add"
            onClick={() => update(d => { d.page3.extras.items.push({ id: `extra-${Date.now()}`, name: '', img: '', price: 0, available: true }) })}
          >
            + AJOUTER UN EXTRA
          </button>
        </section>
      </div>
    </div>
  )
}
