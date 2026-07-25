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
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')
const ORDER_SEQ_FILE = path.join(DATA_DIR, 'order-seq.json')
const PAGER_DIR = path.join(__dirname, 'pager')
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets')

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

if (!fs.existsSync(MENU_FILE)) {
  fs.writeFileSync(MENU_FILE, JSON.stringify(defaultMenu, null, 2))
}

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2))
}

if (!fs.existsSync(ORDER_SEQ_FILE)) {
  fs.writeFileSync(ORDER_SEQ_FILE, JSON.stringify({ date: '', seq: 0 }, null, 2))
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

const ORDER_STATUSES = ['attente', 'preparation', 'pret_cuisine', 'disponible', 'recuperee']

function readOrders() {
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'))
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2))
}

function nextOrderCode() {
  const today = new Date().toISOString().slice(0, 10)
  const state = JSON.parse(fs.readFileSync(ORDER_SEQ_FILE, 'utf-8'))
  const seq = state.date === today ? state.seq + 1 : 1
  fs.writeFileSync(ORDER_SEQ_FILE, JSON.stringify({ date: today, seq }, null, 2))
  return `C${seq}`
}

const sseClients = new Set()

function broadcastOrders() {
  const payload = `data: ${JSON.stringify(readOrders())}\n\n`
  for (const client of sseClients) client.write(payload)
}

app.get('/api/orders/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write(`data: ${JSON.stringify(readOrders())}\n\n`)
  sseClients.add(res)
  req.on('close', () => sseClients.delete(res))
})

app.get('/api/orders', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json(readOrders())
})

app.post('/api/orders', (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  if (items.length === 0) return res.status(400).json({ error: 'commande vide' })

  const cleanItems = items.map(it => ({
    name: String(it.name || '').trim(),
    qty: Math.max(1, parseInt(it.qty, 10) || 1),
    price: Number(it.price) || 0,
    notes: String(it.notes || '').trim(),
  })).filter(it => it.name)

  if (cleanItems.length === 0) return res.status(400).json({ error: 'commande vide' })

  const total = cleanItems.reduce((sum, it) => sum + it.price * it.qty, 0)
  const order = {
    code: nextOrderCode(),
    status: 'attente',
    items: cleanItems,
    total,
    createdAt: Date.now(),
  }

  const orders = readOrders()
  orders.push(order)
  writeOrders(orders)
  broadcastOrders()
  res.status(201).json(order)
})

app.patch('/api/orders/:code', (req, res) => {
  const code = req.params.code.toUpperCase()
  const status = req.body.status
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'statut invalide' })
  }

  const orders = readOrders()
  const order = orders.find(o => o.code === code)
  if (!order) return res.status(404).json({ error: 'commande introuvable' })

  order.status = status
  order.updatedAt = Date.now()
  writeOrders(orders)
  broadcastOrders()
  res.json(order)
})

app.delete('/api/orders/:code', (req, res) => {
  const code = req.params.code.toUpperCase()
  const orders = readOrders().filter(o => o.code !== code)
  writeOrders(orders)
  broadcastOrders()
  res.json({ ok: true })
})

app.use('/pager', express.static(PAGER_DIR))
app.get('/cuisine', (_req, res) => {
  res.sendFile(path.join(PAGER_DIR, 'cuisine.html'))
})
app.get('/salle', (_req, res) => {
  res.sendFile(path.join(PAGER_DIR, 'salle.html'))
})
app.get('/suivi', (_req, res) => {
  res.sendFile(path.join(PAGER_DIR, 'saisie.html'))
})
app.get('/suivi/:code', (_req, res) => {
  res.sendFile(path.join(PAGER_DIR, 'suivi.html'))
})

const DIST_DIR = path.join(__dirname, '..', 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/pager') || req.path.startsWith('/suivi') || req.path.startsWith('/cuisine') || req.path.startsWith('/salle')) return next()
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
