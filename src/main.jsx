import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { CompareSetProvider } from './lib/compareSet.jsx'
import { FleetPickProvider } from './lib/fleetPick.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <FleetPickProvider>
        <CompareSetProvider>
          <App />
        </CompareSetProvider>
      </FleetPickProvider>
    </HashRouter>
  </StrictMode>,
)
