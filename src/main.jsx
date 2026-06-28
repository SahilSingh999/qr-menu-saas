import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SupabaseProvider } from './context/SupabaseContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <CurrencyProvider>
        <SupabaseProvider>
          <App />
        </SupabaseProvider>
      </CurrencyProvider>
    </ThemeProvider>
  </StrictMode>,
)
