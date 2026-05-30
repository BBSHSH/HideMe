import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Editor from './pages/Editor'
import File from './pages/File'

export type User = {
  avatar?: string
  displayName?: string
  username?: string
  role?: string
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser')
    return stored ? JSON.parse(stored) : null
  })

  const handleLogout = () => {
    setUser(null)
  }

  return (
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<Dashboard user={user ?? {}} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/file" element={<File />} />
        </Route>
      </Routes>
  )
}

export default App