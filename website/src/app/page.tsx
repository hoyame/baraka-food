import styles from './page.module.scss'
import MenuTabs from '@/components/MenuTabs'
import { getMenu } from '@/lib/menu'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const menu = await getMenu()

  return (
    <main className={styles.main}>
      <MenuTabs menu={menu} />
    </main>
  )
}
