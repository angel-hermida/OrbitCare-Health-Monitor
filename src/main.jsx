import React from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { MissionProvider } from './store/MissionContext.jsx'
import { PreferencesProvider } from './store/PreferencesContext.jsx'
import './index.css'

// HashRouter (URLs like /#/log) works offline and on any static host with no server setup.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      {/* reducedMotion="user": motion follows the OS "reduce motion" setting (see components/motion.jsx). */}
      <MotionConfig reducedMotion="user">
        <PreferencesProvider>
          <MissionProvider>
            <App />
          </MissionProvider>
        </PreferencesProvider>
      </MotionConfig>
    </HashRouter>
  </React.StrictMode>
)
