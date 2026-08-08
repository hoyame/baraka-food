import { createClient } from '@supabase/supabase-js'
import net from 'net'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  for (const rawLine of readFileSync(path.join(rootDir, '.env'), 'utf8').split('\n')) {
    const m = rawLine.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
  }
} catch {}

const SUPABASE_URL = 'https://dunywwhlojoeeuvxbqtn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bnl3d2hsb2pvZWV1dnhicXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODcxMjUsImV4cCI6MjEwMDU2MzEyNX0.EMLQ8P1gtjeaB0TLuWNNYhF4y0lBXTyeoueLBlvr2oI'
const STAFF_EMAIL = 'staff@barakafood.local'
const STAFF_PASSWORD = 'BarakaStaff2026!'
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100'
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100)

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ESC = '\x1B'
const GS = '\x1D'

const WIDTH = 48

function line(char = '-') {
  return char.repeat(WIDTH) + '\n'
}

function clean(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function buildTicket(order) {
  const date = new Date(order.created_at)
  const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const jour = date.toLocaleDateString('fr-FR')
  let t = ''
  t += ESC + '@'
  t += ESC + 'a' + '\x01'
  t += GS + '!' + '\x11'
  t += 'BARAKA FOOD\n'
  t += GS + '!' + '\x00'
  t += jour + '  ' + heure + '\n'
  t += line('=')
  t += GS + '!' + '\x33'
  t += 'CMD ' + clean(order.code) + '\n'
  t += GS + '!' + '\x00'
  t += line('=')
  t += ESC + 'a' + '\x00'
  for (const item of order.items || []) {
    t += ESC + 'E' + '\x01'
    t += GS + '!' + '\x11'
    t += item.qty + ' x ' + clean(item.name) + '\n'
    t += GS + '!' + '\x00'
    t += ESC + 'E' + '\x00'
    for (const r of item.removed || []) {
      t += GS + '!' + '\x01'
      t += '  >> SANS ' + clean(r).toUpperCase() + '\n'
      t += GS + '!' + '\x00'
    }
    for (const a of item.added || []) {
      t += GS + '!' + '\x01'
      t += '  + ' + clean(a) + '\n'
      t += GS + '!' + '\x00'
    }
    if (item.notes) {
      t += GS + '!' + '\x01'
      t += '  NOTE: ' + clean(item.notes) + '\n'
      t += GS + '!' + '\x00'
    }
    t += line('-')
  }
  const totalArticles = (order.items || []).reduce((n, i) => n + (i.qty || 0), 0)
  t += ESC + 'a' + '\x01'
  t += totalArticles + ' article(s)\n'
  t += ESC + 'a' + '\x00'
  t += '\n\n\n\n'
  t += GS + 'V' + '\x41' + '\x00'
  return t
}

function printOrder(order, attempt = 1) {
  const data = Buffer.from(buildTicket(order), 'binary')
  const socket = net.createConnection({ host: PRINTER_IP, port: PRINTER_PORT, timeout: 5000 })
  socket.on('connect', () => {
    socket.end(data)
    console.log('[print] ticket imprime', order.code)
  })
  socket.on('timeout', () => socket.destroy(new Error('timeout')))
  socket.on('error', (err) => {
    console.error('[print] echec impression', order.code, err.message)
    if (attempt < 3) setTimeout(() => printOrder(order, attempt + 1), 3000)
  })
}

const printed = new Set()

async function main() {
  const { error } = await supabase.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD })
  if (error) console.error('[print] auth supabase echouee:', error.message)

  supabase
    .channel('orders-print')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      const order = payload.new
      if (printed.has(order.code)) return
      printed.add(order.code)
      printOrder(order)
    })
    .subscribe((status) => console.log('[print] realtime:', status))

  console.log('[print] en ecoute des nouvelles commandes, imprimante:', PRINTER_IP + ':' + PRINTER_PORT)
}

main()
