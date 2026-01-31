import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hide the loading spinner when app is ready
const hideLoader = () => {
  document.body.classList.add('app-ready')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hide loader after initial render
hideLoader()
