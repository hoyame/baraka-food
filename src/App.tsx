import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import Menu1 from './pages/Menu1'
import Menu2 from './pages/Menu2'
import Menu3 from './pages/Menu3'
import Admin from './pages/Admin'
import Orders from './pages/Orders'
import Countdown from './pages/Countdown'
import Inauguration from './pages/Inauguration'
import './styles/global.scss'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/1" element={<Menu1 />} />
        <Route path="/2" element={<Menu2 />} />
        <Route path="/3" element={<Menu3 />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/colldown" element={<Countdown />} />
        <Route path="/inauguration" element={<Inauguration />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
