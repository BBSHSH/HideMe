// App.tsx への変更差分
// 既存のコードに以下を追加するだけ

import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Editor from './pages/Editor'

import FileLayout      from './layouts/FileLayout.tsx'
import AllFilesPage    from './pages/file/AllFilesPage'
import VideoAssetsPage from './pages/file/VideoAssetsPage'
import { RecentPage, FavoritesPage, CleanupPage } from './pages/file/PlaceholderPages'

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

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route path="/"        element={<Dashboard user={user ?? {}} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/editor"   element={<Editor />} />

        {/* /file 以下はネスト → FileLayout の <Outlet /> が切り替わる */}
        <Route path="/file" element={<FileLayout />}>
          <Route index          element={<AllFilesPage />} />    {/* /file        → すべて */}
          <Route path="video"    element={<VideoAssetsPage />} /> {/* /file/video  → 動画 */}
          <Route path="recent"   element={<RecentPage />} />      {/* /file/recent → 最近 */}
          <Route path="favorites" element={<FavoritesPage />} />  {/* /file/favorites → お気に入り */}
          <Route path="cleanup"  element={<CleanupPage />} />     {/* /file/cleanup → Cleanup */}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
