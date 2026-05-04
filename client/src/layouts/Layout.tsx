import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import type { User } from '../App'

type Props = {
  user: User | null
  onLogout: () => void
}

export default function Layout({ user, onLogout }: Props) {
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <div className="min-h-screen bg-[#0a141e] text-white">

      <Header user={user ?? {}} onLogout={onLogout} />

      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      <main>
        <Outlet />
      </main>
    </div>
  )
}