import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#ffffff',
              border: '1px solid rgba(124, 58, 237, 0.18)',
              color: '#1a1040',
              fontFamily: '"Plus Jakarta Sans", "Outfit", sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
            },
            success: {
              iconTheme: { primary: '#7c3aed', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)