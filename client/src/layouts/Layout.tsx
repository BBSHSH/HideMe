// HeaderいらんときはGameLayout.tsxを作る
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

function Layout() {
  return (
    <>
      <Header />
      <main>
        {/* ルーティングされたコンポーネントを表示するプレースホルダー */}
        <Outlet />
      </main>
    </>
  )
}

export default Layout
