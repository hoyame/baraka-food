import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { defaultMenu } from './defaultMenu.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const MENU_FILE = path.join(DATA_DIR, 'menu.json')
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets')

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

if (!fs.existsSync(MENU_FILE)) {
  fs.writeFileSync(MENU_FILE, JSON.stringify(defaultMenu, null, 2))
}

for (const file of fs.readdirSync(ASSETS_DIR)) {
  if (!file.endsWith('.png')) continue
  const dest = path.join(UPLOADS_DIR, file)
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(path.join(ASSETS_DIR, file), dest)
  }
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    cb(null, `${base}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/api/menu', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.sendFile(MENU_FILE)
})

app.put('/api/menu', (req, res) => {
  fs.writeFileSync(MENU_FILE, JSON.stringify(req.body, null, 2))
  res.json({ ok: true })
})

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

const DIST_DIR = path.join(__dirname, '..', 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  const nets = os.networkInterfaces()
  const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address)
  const prod = fs.existsSync(DIST_DIR)
  console.log(`Baraka Food ${prod ? '(prod)' : '(api seule)'} sur http://localhost:${PORT}`)
  for (const ip of ips) {
    console.log(`  ecrans : http://${ip}:${prod ? PORT : 5173}/1 /2 /3`)
    console.log(`  admin  : http://${ip}:${prod ? PORT : 5173}/admin`)
  }
})
