export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationsGranted(): boolean {
  return notificationsSupported() && Notification.permission === 'granted'
}

export async function registerSw(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch {}
  }
}

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false
  await registerSw()
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export async function notify(title: string, body: string, url?: string): Promise<void> {
  if (!notificationsGranted()) return
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'baraka-commande',
    data: url ? { url } : undefined,
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
      return
    }
  } catch {}
  try {
    new Notification(title, options)
  } catch {}
}
