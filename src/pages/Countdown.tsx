import CountdownScreen from '../components/CountdownScreen'
import { useTitle } from '../hooks/useTitle'

const TARGET = new Date(2026, 7, 18, 11, 0, 0).getTime()

export default function Countdown() {
  useTitle('Ouverture')
  return (
    <CountdownScreen
      title="OUVERTURE LE"
      dateLabel="18/08/2026 · 11H00"
      target={TARGET}
      openedText="C'EST OUVERT"
    />
  )
}
