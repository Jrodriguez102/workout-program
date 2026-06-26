import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import History from './pages/History'
import Progress from './pages/Progress'
import WorkoutSession from './pages/WorkoutSession'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen min-h-dvh text-white" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/session/:day" element={<WorkoutSession />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  )
}