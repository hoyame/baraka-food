'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '../page.module.scss'

interface OrderRow {
  code: string
  created_at: string
  items: { name: string; notes: string }[]
}

const normaliserTel = (v: string) => (v || '').replace(/\D/g, '')

export default function LivraisonPage() {
  const router = useRouter()
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  async function rechercher(e: React.FormEvent) {
    e.preventDefault()
    const brut = saisie.trim().toUpperCase()
    if (!brut) {
      setErreur('Entrez votre téléphone ou votre numéro de commande.')
      return
    }
    setErreur('')
    setChargement(true)

    try {
      if (/[A-Z]/.test(brut)) {
        router.push(`/${brut}`)
        return
      }

      const tel = normaliserTel(brut)
      if (tel.length < 9) {
        setErreur('Numéro de téléphone incomplet — 10 chiffres attendus.')
        return
      }

      const { data } = await supabase
        .from('orders')
        .select('code, created_at, items')
        .neq('status', 'recuperee')
        .like('code', 'LV-%')

      const commandes = ((data as OrderRow[]) || [])
        .filter((o) => {
          const entree = (o.items || []).find((i) => i.name === '__CLIENT__')
          if (!entree) return false
          try {
            return normaliserTel(JSON.parse(entree.notes || '{}').tel) === tel
          } catch {
            return false
          }
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      if (commandes.length === 0) {
        setErreur('Aucune livraison en cours pour ce numéro. Vérifiez le numéro donné lors de la commande.')
        return
      }
      router.push(`/${commandes[0].code}`)
    } finally {
      setChargement(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <img className={styles.brand} src="/logo.svg" alt="Baraka Food" />

        <p className={styles.lead}>
          Entrez le numéro de téléphone donné lors de la commande, ou votre numéro de commande, pour suivre votre livraison
        </p>

        <form className={styles.form} onSubmit={rechercher}>
          <input
            className={styles.input}
            type="text"
            inputMode="tel"
            placeholder="Téléphone ou n° de commande"
            maxLength={16}
            value={saisie}
            onChange={(e) => { setSaisie(e.target.value); setErreur('') }}
            autoFocus
          />
          <button className={styles.submit} type="submit" disabled={chargement}>
            {chargement ? 'Recherche…' : 'Suivre ma livraison'}
          </button>
        </form>

        <p className={styles.error}>{erreur}</p>

        <a className={styles.livraisonLink} href="/">Commande sur place ou à emporter ?</a>
      </div>
    </main>
  )
}
