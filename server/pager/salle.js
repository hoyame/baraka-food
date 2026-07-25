const catTabsEl = document.getElementById('cat-tabs')
const catalogEl = document.getElementById('catalog')
const cartEl = document.getElementById('cart')
const cartTotalEl = document.getElementById('cart-total')
const sendBtn = document.getElementById('send-btn')
const confirmEl = document.getElementById('confirm')
const confirmCodeEl = document.getElementById('confirm-code')
const trackingListEl = document.getElementById('tracking-list')

function parsePrice(val) {
  if (typeof val === 'number') return val
  const match = String(val || '').match(/[\d.,]+/)
  return match ? parseFloat(match[0].replace(',', '.')) : 0
}

let categories = []
let activeCat = 0
let cart = []
let lineId = 0

async function loadCatalog() {
  const menu = await (await fetch('/api/menu')).json()

  categories = [
    { label: 'Burgers', items: menu.page1.burgers },
    { label: 'Tex-Mex', items: menu.page1.texmex },
    {
      label: 'Sandwichs',
      items: [...menu.page2.classiques, menu.page2.crunchy, menu.page2.menuKids],
    },
    {
      label: 'Accompagnements',
      items: [...menu.page2.frites, ...menu.page2.desserts, ...menu.page2.boissons],
    },
    {
      label: 'Tacos',
      items: menu.page3.tailles.map(t => ({ name: `Tacos ${t.size} (${t.viandes})`, price: t.price, available: t.available })),
    },
    {
      label: 'Suppléments',
      items: [
        ...menu.supplements,
        ...menu.page3.extras.items.map(e => ({ name: e.name, price: parsePrice(menu.page3.extras.surcharge), available: e.available })),
      ],
    },
  ].map(cat => ({
    ...cat,
    items: cat.items
      .filter(it => it && it.available !== false)
      .map(it => ({ name: it.name, price: parsePrice(it.price) })),
  }))

  renderTabs()
  renderCatalog()
}

function renderTabs() {
  catTabsEl.innerHTML = categories.map((cat, i) => `
    <button class="cat-tab${i === activeCat ? ' is-active' : ''}" data-index="${i}">${cat.label}</button>
  `).join('')
}

function renderCatalog() {
  const items = categories[activeCat]?.items || []
  catalogEl.innerHTML = items.map((it, i) => `
    <button class="catalog-item" data-index="${i}">
      <span>${it.name}</span>
      <span>${it.price.toFixed(2)}€</span>
    </button>
  `).join('')
}

catTabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-index]')
  if (!btn) return
  activeCat = Number(btn.dataset.index)
  renderTabs()
  renderCatalog()
})

catalogEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-index]')
  if (!btn) return
  const item = categories[activeCat].items[Number(btn.dataset.index)]
  cart.push({ id: ++lineId, name: item.name, price: item.price, qty: 1, notes: '' })
  renderCart()
})

function renderCart() {
  if (cart.length === 0) {
    cartEl.innerHTML = '<div class="cart-empty">Aucun article</div>'
    cartTotalEl.textContent = ''
    sendBtn.disabled = true
    return
  }

  cartEl.innerHTML = cart.map(line => `
    <div class="cart-line" data-id="${line.id}">
      <div class="cart-line-head">
        <span class="cart-line-name">${line.name} — ${(line.price * line.qty).toFixed(2)}€</span>
        <button class="cart-line-remove" data-action="remove" data-id="${line.id}">Retirer</button>
      </div>
      <div class="cart-line-row">
        <input class="qty-input" type="number" min="1" value="${line.qty}" data-action="qty" data-id="${line.id}" />
        <input class="notes-input" type="text" placeholder="Sans oignon, + sauce..." value="${line.notes}" data-action="notes" data-id="${line.id}" />
      </div>
    </div>
  `).join('')

  const total = cart.reduce((sum, l) => sum + l.price * l.qty, 0)
  cartTotalEl.textContent = `Total ${total.toFixed(2)}€`
  sendBtn.disabled = false
}

cartEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="remove"]')
  if (!btn) return
  cart = cart.filter(l => l.id !== Number(btn.dataset.id))
  renderCart()
})

cartEl.addEventListener('input', (e) => {
  const target = e.target
  const id = Number(target.dataset.id)
  const line = cart.find(l => l.id === id)
  if (!line) return

  if (target.dataset.action === 'qty') {
    line.qty = Math.max(1, parseInt(target.value, 10) || 1)
  } else if (target.dataset.action === 'notes') {
    line.notes = target.value
  }
})

sendBtn.addEventListener('click', async () => {
  if (cart.length === 0) return
  sendBtn.disabled = true

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart.map(({ name, qty, price, notes }) => ({ name, qty, price, notes })) }),
  })

  if (!res.ok) {
    sendBtn.disabled = false
    return
  }

  const order = await res.json()
  cart = []
  renderCart()
  confirmCodeEl.textContent = order.code
  confirmEl.classList.add('is-visible')
  setTimeout(() => confirmEl.classList.remove('is-visible'), 4000)
})

const trackLabel = {
  attente: 'En attente',
  preparation: 'En préparation',
  pret_cuisine: 'Prêt en cuisine — à récupérer',
  disponible: 'Disponible au comptoir',
}

function trackCardHtml(order) {
  const isAlert = order.status === 'pret_cuisine'
  const action = order.status === 'pret_cuisine'
    ? `<button class="track-btn" data-action="disponible" data-code="${order.code}">Mettre au comptoir</button>`
    : order.status === 'disponible'
      ? `<button class="track-btn" data-action="recuperee" data-code="${order.code}">Récupérée</button>`
      : ''

  return `
    <div class="track-card${isAlert ? ' is-alert' : ''}">
      <span class="track-code">${order.code}</span>
      <span class="track-status">${trackLabel[order.status] || order.status}</span>
      ${action}
    </div>
  `
}

function renderTracking(orders) {
  const active = orders
    .filter(o => o.status !== 'recuperee')
    .sort((a, b) => a.createdAt - b.createdAt)

  trackingListEl.innerHTML = active.length
    ? active.map(trackCardHtml).join('')
    : '<div class="cart-empty">Aucune commande en cours</div>'
}

trackingListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn) return
  const { action, code } = btn.dataset

  if (action === 'recuperee') {
    await fetch(`/api/orders/${code}`, { method: 'DELETE' })
  } else {
    await fetch(`/api/orders/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    })
  }
})

loadCatalog()
renderCart()

const source = new EventSource('/api/orders/stream')
source.onmessage = (e) => renderTracking(JSON.parse(e.data))
