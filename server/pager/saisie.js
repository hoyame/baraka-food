const form = document.getElementById('form')
const input = document.getElementById('code')
const errorEl = document.getElementById('error')

form.addEventListener('submit', (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  const code = input.value.trim()
  if (!code) {
    errorEl.textContent = 'Merci de saisir un numéro'
    return
  }
  window.location.href = `/suivi/${encodeURIComponent(code.toUpperCase())}`
})
