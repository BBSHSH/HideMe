import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Home from './pages/Home'

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
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<Home user={user ?? {}} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App