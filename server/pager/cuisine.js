const cols = {
  attente: document.getElementById('col-attente'),
  preparation: document.getElementById('col-preparation'),
  pret_cuisine: document.getElementById('col-pret_cuisine'),
}

const nextStatus = {
  attente: 'preparation',
  preparation: 'pret_cuisine',
}

const nextLabel = {
  attente: 'Démarrer',
  preparation: 'Prêt',
}

function itemsHtml(items) {
  return items.map(it => `
    <div class="item-line">
      <span class="item-name">${it.qty > 1 ? `${it.qty}x ` : ''}${it.name}</span>
    </div>
    ${it.notes ? `<div class="item-notes">${it.notes}</div>` : ''}
  `).join('')
}

function cardHtml(order) {
  const btn = nextStatus[order.status]
    ? `<button class="btn" data-action="${nextStatus[order.status]}" data-code="${order.code}">${nextLabel[order.status]}</button>`
    : ''

  return `
    <div class="card">
      <div class="card-head">
        <span class="code">${order.code}</span>
        <span class="time">${new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="items">${itemsHtml(order.items)}</div>
      ${btn}
    </div>
  `
}

function render(orders) {
  for (const key of Object.keys(cols)) {
    const list = orders
      .filter(o => o.status === key)
      .sort((a, b) => a.createdAt - b.createdAt)

    cols[key].innerHTML = list.length
      ? list.map(cardHtml).join('')
      : '<div class="empty">Aucune commande</div>'
  }
}

document.body.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn) return
  const { action, code } = btn.dataset
  await fetch(`/api/orders/${code}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: action }),
  })
})

const source = new EventSource('/api/orders/stream')
source.onmessage = (e) => render(JSON.parse(e.data))
