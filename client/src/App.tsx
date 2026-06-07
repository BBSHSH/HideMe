import { Routes, Route, Navigate } from 'react-router-dom'
import { UploadProvider } from './context/UploadContext'
import UploadProgressPanel from './components/file/UploadProgressPanel'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Editor from './pages/Editor'
import Login from './pages/Login'
import DiscordCallback from './pages/DiscordCallback'
import AdminAuthSettings from './pages/AdminAuthSettings'
import FileLayout from './layouts/FileLayout.tsx'
import AllFilesPage from './pages/file/AllFilesPage'
import VideoFilesPage from './pages/file/VideoFilesPage.tsx'
import VideoCollectionRedirect from "./pages/file/VideoCollectionRedirect.tsx";

import CollectionDetailPage from './pages/file/CollectionDetailPage'
import VideoAssetsPage from './pages/file/VideoAssetsPage'
import { RecentPage, FavoritesPage, CleanupPage } from './pages/file/PlaceholderPages'
import Chat from './pages/Chat'
import { useAuth } from './context/AuthContext'

function App() {
  const { user, isAdmin } = useAuth()

  return (
    <UploadProvider>
      <UploadProgressPanel />
      <Routes>
        {/* 認証不要ページ */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/discord/callback" element={<DiscordCallback />} />

        {/* 保護されたルート */}
        {user ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/chat" element={<Chat />} />

            {/* 管理者専用: 認証設定 */}
            {isAdmin && (
              <Route path="/admin/auth-settings" element={<AdminAuthSettings />} />
            )}

            <Route path="/file" element={<FileLayout />}>
              <Route index element={<AllFilesPage />} />
              <Route path="videos" element={<VideoFilesPage />} />
              <Route path="/file/videocollection/:id" element={<VideoCollectionRedirect />} />
              <Route path="/file/video/:fileId" element={<VideoAssetsPage />} />
              <Route path="collection/:id" element={<CollectionDetailPage />} />
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
    </UploadProvider>
  )
}

export default App
