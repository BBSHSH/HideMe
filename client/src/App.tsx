import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Editor from './pages/Editor'
import Login from './pages/Login'
import FileLayout from './layouts/FileLayout.tsx'
import AllFilesPage from './pages/file/AllFilesPage'
import CollectionDetailPage from './pages/file/CollectionDetailPage'
import VideoAssetsPage from './pages/file/VideoAssetsPage'
import { RecentPage, FavoritesPage, CleanupPage } from './pages/file/PlaceholderPages'
import { useAuth } from './context/AuthContext'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* ログインページ */}
      <Route path="/login" element={<Login />} />

      {/* 保護されたルート */}
      {user ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/editor" element={<Editor />} />

          <Route path="/file" element={<FileLayout />}>
            <Route index element={<AllFilesPage />} />
            <Route path="collection/:id" element={<CollectionDetailPage />} />
            <Route path="video" element={<VideoAssetsPage />} />
            <Route path="recent" element={<RecentPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="cleanup" element={<CleanupPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  )
}

export default App