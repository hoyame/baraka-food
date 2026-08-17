self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const url = e.notification.data && e.notification.data.url
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      if (url && self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
