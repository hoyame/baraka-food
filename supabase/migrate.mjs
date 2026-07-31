import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SUPABASE_URL = 'https://dunywwhlojoeeuvxbqtn.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UPLOADS_DIR = path.join(__dirname, '..', 'server', 'uploads')
const MENU_FILE = path.join(__dirname, '..', 'server', 'data', 'menu.json')

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquant')
  process.exit(1)
}

async function uploadImage(filename) {
  const filePath = path.join(UPLOADS_DIR, filename)
  const body = fs.readFileSync(filePath)

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-images/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`upload ${filename} failed: ${res.status} ${text}`)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/menu-images/${filename}`
}

async function main() {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.png'))
  const urlMap = {}

  for (const file of files) {
    urlMap[`/uploads/${file}`] = await uploadImage(file)
    console.log(`uploaded ${file}`)
  }

  const menu = JSON.parse(fs.readFileSync(MENU_FILE, 'utf-8'))
  const menuStr = JSON.stringify(menu)
  let rewritten = menuStr
  for (const [oldPath, newUrl] of Object.entries(urlMap)) {
    rewritten = rewritten.split(`"${oldPath}"`).join(`"${newUrl}"`)
  }
  const finalMenu = JSON.parse(rewritten)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/menu`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: 1, data: finalMenu, updated_at: new Date().toISOString() }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`seed menu failed: ${res.status} ${text}`)
  }

  console.log('menu seeded')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
