import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.scss'

const highlights = [
  {
    label: "L'incontournable",
    name: 'Le Crunchy',
    desc: 'Tenders · Jambon de poulet fumé · Crudités · Fromage Edam',
    price: '7,00€',
    img: '/images/burger3.png',
  },
  {
    label: 'Le classique',
    name: 'Kefta Fromage',
    desc: 'Sandwich baguette maison',
    price: '6,00€',
    img: '/images/kefta-fromage.png',
  },
  {
    label: 'Le signature',
    name: 'Poulet Mariné Fromage',
    desc: 'Sandwich baguette maison',
    price: '6,50€',
    img: '/images/poulet-marine-fromage.png',
  },
]

export default function HomePage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroKicker}>Aix-les-Bains · Place Clemenceau</p>
          <h1 className={styles.heroTitle}>
            BARAKA
            <span>FOOD</span>
          </h1>
          <p className={styles.heroDesc}>
            Burgers, sandwichs et tacos faits maison, préparés à la commande en plein cœur d&apos;Aix-les-Bains.
            Produits halal, générosité garantie.
          </p>
          <div className={styles.heroActions}>
            <Link href="/menu" className={styles.btnPrimary}>Voir le menu</Link>
            <a
              href="https://maps.google.com/?q=Place+Clemenceau+73100+Aix-les-Bains"
              target="_blank"
              rel="noreferrer"
              className={styles.btnGhost}
            >
              Nous trouver
            </a>
          </div>
        </div>

        <div className={styles.heroImg}>
          <Image src="/images/burger3.png" alt="Le Crunchy, burger signature Baraka Food" width={520} height={520} priority />
        </div>
      </section>

      <section className={styles.strip}>
        {['Halal', 'Fait maison', 'Produits frais', 'Livraison'].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className={styles.about}>
        <div className={styles.aboutText}>
          <span className={styles.eyebrow}>Notre histoire</span>
          <h2>Le goût du fait maison, l&apos;esprit du quartier</h2>
          <p>
            Installé place Clemenceau, Baraka Food est né d&apos;une envie simple : servir une street food
            généreuse et 100% halal, avec des produits frais préparés chaque jour. Burgers signature, sandwichs
            baguette et tacos composés à la demande, à deux pas du lac d&apos;Aix-les-Bains.
          </p>
        </div>
      </section>

      <section className={styles.highlights}>
        <span className={styles.eyebrow}>Nos incontournables</span>
        <h2 className={styles.highlightsTitle}>Ce qu&apos;on vous conseille</h2>

        <div className={styles.highlightsGrid}>
          {highlights.map((item) => (
            <div key={item.name} className={styles.card}>
              <div className={styles.cardImg}>
                <Image src={item.img} alt={item.name} width={220} height={220} />
              </div>
              <p className={styles.cardLabel}>{item.label}</p>
              <h3 className={styles.cardName}>{item.name}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
              <span className={styles.cardPrice}>{item.price}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.location}>
        <div className={styles.locationText}>
          <span className={styles.eyebrow}>Où nous trouver</span>
          <h2>Place Clemenceau, Aix-les-Bains</h2>
          <p>73100 Aix-les-Bains</p>
          <p>Ouvert tous les jours de 11h30 à 22h30</p>
          <Link href="/menu" className={styles.btnPrimary}>Découvrir le menu</Link>
        </div>
        <div className={styles.locationMap}>
          <iframe
            title="Localisation Baraka Food, Place Clemenceau, Aix-les-Bains"
            src="https://www.google.com/maps?q=Place+Clemenceau+73100+Aix-les-Bains&output=embed"
            loading="lazy"
          />
        </div>
      </section>
    </main>
  )
}
