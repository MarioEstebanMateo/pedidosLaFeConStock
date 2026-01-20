import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OrderProvider } from './context/OrderContext'
import Home from '../src/components/Home'
import ReviewOrder from '../src/components/ReviewOrder'
import Admin from '../src/components/Admin'
import AdminLogin from '../src/components/AdminLogin'
import Footer from './components/Footer'

function App() {
  return (
    <OrderProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/review" element={<ReviewOrder />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/lafeadmin" element={<Admin />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </OrderProvider>
  )
}

export default App
