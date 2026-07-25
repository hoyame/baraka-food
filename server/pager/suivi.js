const code = window.location.pathname.split('/').pop().toUpperCase()

const codeLabel = document.getElementById('code-label')
const box = document.getElementById('box')
const title = document.getElementById('title')
const desc = document.getElementById('desc')
const errorEl = document.getElementById('error')

codeLabel.textContent = `Commande ${code}`

let lastStatus = null

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch (err) {
    // audio non disponible
  }

  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
}

const copy = {
  attente: {
    title: 'Commande enregistrée',
    desc: 'Votre commande va être prise en charge en cuisine.',
  },
  preparation: {
    title: 'En préparation',
    desc: 'On vous prévient dès que c\'est prêt.',
  },
  pret_cuisine: {
    title: 'Bientôt prête',
    desc: 'Votre commande arrive au comptoir.',
  },
  disponible: {
    title: 'Votre commande est prête !',
    desc: 'Merci de venir la récupérer au comptoir.',
  },
}

function render(order) {
  if (!order) {
    box.classList.remove('is-ready')
    title.textContent = 'Commande introuvable'
    desc.textContent = 'Vérifiez le numéro avec le comptoir.'
    return
  }

  const info = copy[order.status] || copy.preparation

  if (order.status === 'disponible') {
    box.classList.add('is-ready')
    if (lastStatus !== 'disponible') beep()
  } else {
    box.classList.remove('is-ready')
  }

  title.textContent = info.title
  desc.textContent = info.desc
  lastStatus = order.status
}

function findOrder(orders) {
  return orders.find(o => o.code === code)
}

const source = new EventSource('/api/orders/stream')
source.onmessage = (e) => {
  errorEl.textContent = ''
  render(findOrder(JSON.parse(e.data)))
}
source.onerror = () => {
  errorEl.textContent = 'Connexion perdue, nouvelle tentative…'
}
