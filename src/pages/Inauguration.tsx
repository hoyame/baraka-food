import CountdownScreen from '../components/CountdownScreen'
import { useTitle } from '../hooks/useTitle'

const TARGET = new Date(2026, 7, 17, 19, 30, 0).getTime()

export default function Inauguration() {
  useTitle('Inauguration')
  return (
    <CountdownScreen
      title="INAUGURATION"
      dateLabel="CE SOIR · 19H30"
      target={TARGET}
      openedText="BIENVENUE"
    />
  )
}
