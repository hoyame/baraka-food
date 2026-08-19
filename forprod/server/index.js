import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const stamp = () => new Date().toLocaleString('fr-FR')

process.on('unhandledRejection', (err) => {
  console.error(stamp(), '[fatal] promesse rejetee non geree :', err?.message || err)
})
process.on('uncaughtException', (err) => {
  console.error(stamp(), '[fatal] exception non geree :', err?.message || err, err?.stack || '')
})

const app = express()

const SUPABASE_IMAGES = 'https://dunywwhlojoeeuvxbqtn.supabase.co/storage/v1/object/public/menu-images/'
const CACHE_DIR = path.join(__dirname, 'cache-img')
fs.mkdirSync(CACHE_DIR, { recursive: true })

const TYPES_IMG = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' }

app.get('/img/:fichier', async (req, res) => {
  const fichier = req.params.fichier
  if (!/^[a-zA-Z0-9._-]+$/.test(fichier)) return res.status(400).end()
  const type = TYPES_IMG[fichier.split('.').pop().toLowerCase()]
  if (!type) return res.status(400).end()

  const local = path.join(CACHE_DIR, fichier)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.setHeader('Content-Type', type)

  if (fs.existsSync(local)) return res.sendFile(local)

  try {
    const distant = await fetch(SUPABASE_IMAGES + encodeURIComponent(fichier))
    if (!distant.ok) return res.status(distant.status).end()
    const donnees = Buffer.from(await distant.arrayBuffer())
    fs.writeFileSync(local, donnees)
    res.end(donnees)
  } catch {
    res.status(502).end()
  }
})

const DIST_DIR = path.join(__dirname, '..', 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  const nets = os.networkInterfaces()
  const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address)
  const prod = fs.existsSync(DIST_DIR)
  console.log(`Baraka Food écrans ${prod ? '(prod)' : '(build manquant, lance `npm run build`)'} sur http://localhost:${PORT}`)
  for (const ip of ips) {
    console.log(`  ecrans : http://${ip}:${prod ? PORT : 5173}/1 /2 /3`)
    console.log(`  admin  : http://${ip}:${prod ? PORT : 5173}/admin`)
  }
})
