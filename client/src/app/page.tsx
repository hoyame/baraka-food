'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'

export default function SaisiePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Merci de saisir un numéro')
      return
    }
    router.push(`/${trimmed.toUpperCase()}`)
  }

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <img className={styles.brand} src="/logo.svg" alt="Baraka Food" />

        <p className={styles.lead}>Entrez le numéro indiqué sur votre ticket pour suivre votre commande</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="text"
            placeholder="N° de commande"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          <button className={styles.submit} type="submit">Suivre ma commande</button>
        </form>

        <p className={styles.error}>{error}</p>

        <a className={styles.livraisonLink} href="/livraison">Commande en livraison ? Suivez-la ici</a>
      </div>
    </main>
  )
}
