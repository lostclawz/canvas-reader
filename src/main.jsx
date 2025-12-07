import React from 'react'
import { createRoot } from 'react-dom/client'
import Reader from './components/Reader.jsx'

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <Reader size={1000} fontSize={16} />
  </React.StrictMode>
)
