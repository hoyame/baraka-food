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
const CAISSE_HOST = process.env.CAISSE_HOST || '192.168.1.81'
const CAISSE_PORT = Number(process.env.CAISSE_PORT || 515)
const CAISSE_QUEUE = process.env.CAISSE_QUEUE || 'TP85'
const ORDERS_URL = (process.env.ORDERS_URL || 'https://commande.barakafood.fr').replace(/\/+$/, '')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const stamp = () => new Date().toLocaleString('fr-FR')
const log = (...a) => console.log(stamp(), ...a)
const logErr = (...a) => console.error(stamp(), ...a)

process.on('unhandledRejection', (err) => {
  logErr('[fatal] promesse rejetee non geree :', err?.message || err)
})
process.on('uncaughtException', (err) => {
  logErr('[fatal] exception non geree :', err?.message || err, err?.stack || '')
})

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
  t += ESC + 'M' + '\x00'
  t += ESC + 'a' + '\x01'
  t += GS + '!' + '\x11'
  t += 'BARAKA FOOD\n'
  t += GS + '!' + '\x00'
  t += jour + '  ' + heure + '\n'
  t += line('=')
  t += GS + '!' + '\x33'
  t += clean(order.code) + '\n'
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
    log('[print] ticket cuisine imprime', order.code)
  })
  socket.on('timeout', () => socket.destroy(new Error('timeout')))
  socket.on('error', (err) => {
    logErr('[print] echec impression cuisine', order.code, err.message, '(cible ' + PRINTER_IP + ':' + PRINTER_PORT + ')')
    if (attempt < 3) setTimeout(() => printOrder(order, attempt + 1), 3000)
  })
}

function qrCode(data, moduleSize = 7) {
  const len = data.length + 3
  return (
    GS + '(k' + '\x04\x00' + '\x31\x41' + '\x32\x00' +
    GS + '(k' + '\x03\x00' + '\x31\x43' + String.fromCharCode(moduleSize) +
    GS + '(k' + '\x03\x00' + '\x31\x45' + '\x31' +
    GS + '(k' + String.fromCharCode(len & 0xff) + String.fromCharCode((len >> 8) & 0xff) + '\x31\x50\x30' + data +
    GS + '(k' + '\x03\x00' + '\x31\x51\x30'
  )
}

function buildNumberTicket(order) {
  const code = clean(order.code)
  const url = ORDERS_URL + '/' + encodeURIComponent(code)
  let t = ''
  t += ESC + '@'
  t += ESC + 'M' + '\x00'
  t += ESC + 'a' + '\x01'
  t += GS + '!' + '\x55'
  t += code + '\n'
  t += GS + '!' + '\x00'
  t += '\n'
  t += ESC + 'E' + '\x01'
  t += 'SUIVEZ VOTRE COMMANDE\n'
  t += ESC + 'E' + '\x00'
  t += 'DIRECTEMENT DEPUIS VOTRE TELEPHONE\n'
  t += '\n'
  t += qrCode(url)
  t += '\n'
  t += url.replace(/^https?:\/\//, '') + '\n'
  t += '\n'
  t += line('-')
  t += 'SINON, ALLEZ SUR NOTRE SITE INTERNET,\n'
  t += 'CLIQUEZ SUR SUIVRE MA COMMANDE\n'
  t += 'ET RENSEIGNEZ VOTRE NUMERO DE COMMANDE\n'
  t += '\n\n\n'
  t += GS + 'V' + '\x41' + '\x00'
  return t
}

let lpdJob = 0

function sendLpd(host, port, queue, payload) {
  return new Promise((resolve, reject) => {
    const hostname = 'barakafood'
    const jid = String((lpdJob = (lpdJob + 1) % 1000)).padStart(3, '0')
    const dfName = `dfA${jid}${hostname}`
    const cfName = `cfA${jid}${hostname}`
    const control = Buffer.from(`H${hostname}\nPbaraka\nl${dfName}\nU${dfName}\nN${dfName}\n`, 'binary')

    const steps = [
      Buffer.from(`\x02${queue}\n`, 'binary'),
      Buffer.from(`\x02${control.length} ${cfName}\n`, 'binary'),
      Buffer.concat([control, Buffer.from([0])]),
      Buffer.from(`\x03${payload.length} ${dfName}\n`, 'binary'),
      Buffer.concat([payload, Buffer.from([0])]),
    ]

    let step = 0
    let done = false
    const socket = net.createConnection({ host, port, timeout: 8000 })

    const fail = (err) => {
      if (done) return
      done = true
      socket.destroy()
      reject(err)
    }

    socket.on('connect', () => socket.write(steps[step]))

    socket.on('data', (chunk) => {
      if (done) return
      if (chunk[0] !== 0) return fail(new Error(`refus LPD a l etape ${step + 1} (code ${chunk[0]})`))
      step += 1
      if (step < steps.length) {
        socket.write(steps[step])
      } else {
        done = true
        socket.end()
        resolve()
      }
    })

    socket.on('timeout', () => fail(new Error('timeout')))
    socket.on('error', fail)
    socket.on('close', () => {
      if (!done) fail(new Error(`connexion fermee a l etape ${step + 1}`))
    })
  })
}

function printNumberCaisse(order, attempt = 1) {
  const payload = Buffer.from(buildNumberTicket(order), 'binary')
  sendLpd(CAISSE_HOST, CAISSE_PORT, CAISSE_QUEUE, payload)
    .then(() => log('[caisse] numero imprime', order.code))
    .catch((err) => {
      logErr('[caisse] echec impression', order.code, err.message, '(cible ' + CAISSE_HOST + ':' + CAISSE_PORT + ')')
      if (attempt < 3) setTimeout(() => printNumberCaisse(order, attempt + 1), 3000)
    })
}

const printed = new Set()

let channel = null
let resubscribeTimer = null

function subscribe() {
  if (channel) supabase.removeChannel(channel)
  channel = supabase
    .channel('orders-print-' + Date.now())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      const order = payload.new
      if (printed.has(order.code)) return
      printed.add(order.code)
      log('[print] nouvelle commande', order.code)
      printOrder(order)
      printNumberCaisse(order)
    })
    .subscribe((status) => {
      log('[print] realtime:', status)
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        logErr('[print] connexion temps reel perdue, nouvelle tentative dans 5s')
        clearTimeout(resubscribeTimer)
        resubscribeTimer = setTimeout(subscribe, 5000)
      }
    })
}

async function main() {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD })
    if (error) logErr('[print] auth supabase echouee:', error.message)
  } catch (err) {
    logErr('[print] auth supabase injoignable:', err?.message || err)
  }

  subscribe()

  log('[print] en ecoute des nouvelles commandes')
  log('[print] cuisine (raw 9100) :', PRINTER_IP + ':' + PRINTER_PORT)
  log('[caisse] TP85 (LPD 515)   :', CAISSE_HOST + ':' + CAISSE_PORT + ' file ' + CAISSE_QUEUE)
  log('[caisse] QR de suivi      :', ORDERS_URL + '/<code>')

  setInterval(() => log('[print] toujours en ecoute'), 15 * 60 * 1000)
}

main().catch((err) => {
  logErr('[print] demarrage impossible:', err?.message || err, err?.stack || '')
  process.exit(1)
})
