import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Listing from './pages/Listing'
import Model from './pages/Model'
import FleetIntake from './pages/FleetIntake'
import PackageLayout from './pages/PackageLayout'
import PackageResults from './pages/PackageResults'
import PackageUnit from './pages/PackageUnit'
import FullCompare from './pages/FullCompare'
import Checkout from './pages/Checkout'
import Budget from './pages/Budget'

export default function App() {
  const location = useLocation()
  const path = location.pathname
  const isHome = path === '/' || path === ''

  return (
    <div className={`app-shell ${isHome ? 'chrome-home' : ''}`}>
      {!isHome && <Header />}
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intake" element={<FleetIntake />} />
          <Route path="/package/:packageId" element={<PackageLayout />}>
            <Route index element={<PackageResults />} />
            <Route path="unit/:unitId" element={<PackageUnit />} />
            <Route path="compare" element={<FullCompare />} />
          </Route>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/shop" element={<Browse />} />
          <Route path="/model/:slug" element={<Model />} />
          <Route path="/listing/:id" element={<Listing />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
    </div>
  )
}
