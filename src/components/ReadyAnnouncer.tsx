import { useReadyOrders } from '../hooks/useReadyOrders'

export default function ReadyAnnouncer() {
  useReadyOrders({ announce: true })
  return null
}
