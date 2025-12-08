/**
 * @fileoverview Application entry point.
 * Initializes the React application and renders the main Reader component.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import Reader from './components/Reader.jsx'

/**
 * Application initialization.
 * Creates the React root and renders the Reader component with default configuration.
 * The Reader is rendered in strict mode for development checks.
 */
createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <Reader size={800} fontSize={16} />
  </React.StrictMode>
)
