import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getItem } from './storage.js'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'

function ProtectedRoute({ children }) {
  const token = getItem('admin_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [token, setToken] = useState(() => getItem('admin_token'))

  useEffect(() => {
    const check = () => setToken(getItem('admin_token'))
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login onLogin={() => setToken(getItem('admin_token'))} />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
