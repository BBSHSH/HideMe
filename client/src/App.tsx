import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Home from './pages/Home'
import Test from './pages/Test'
import MatchPrep from './pages/MatchPrep'
import GuesserMode from './pages/GuesserMode'
import Invited from './pages/Invited'
import RoundInt from './pages/RoundInterval'
import SoloPrep from './pages/SoloPrep'
import InGameLayout from './layouts/InGameLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
        {/* <Outlet />に、自動的にマッチした子Routeが表示される */}
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<Test />} />
          <Route path="/match-prep" element={<MatchPrep />} />
          <Route path="/solo-prep" element={<SoloPrep />} />
        </Route>
        <Route path="/invited" element={<Invited />} />
        <Route path="/roundint" element={<RoundInt />} />
        <Route element={<InGameLayout />}>
          <Route path="/guesser-mode" element={<GuesserMode />} />
        </Route>
      </Routes>
      
    </BrowserRouter>
  )
}

export default App
