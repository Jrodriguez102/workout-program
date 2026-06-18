import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning, Jasmine'
  if (hour < 17) return 'Good afternoon, Jasmine'
  return 'Good evening, Jasmine'
}

function getTodayWorkout(sessions) {
  if (sessions.length === 0) return 'A'
  const last = sessions[0].workout_day
  return last === 'A' ? 'B' : 'A'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    monthlyCount: 0,
    latestPR: null,
    todayDay: 'A',
    loading: true,
  })

  useEffect(() => {
    async function fetchStats() {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('completed_at, workout_day')
        .order('completed_at', { ascending: false })

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyCount = (sessions || []).filter(
        (s) => new Date(s.completed_at) >= startOfMonth
      ).length

      const { data: prs } = await supabase
        .from('personal_records')
        .select('exercise_name, weight_lbs, achieved_at')
        .order('achieved_at', { ascending: false })
        .limit(1)

      setStats({
        monthlyCount,
        latestPR: prs && prs.length > 0 ? prs[0] : null,
        todayDay: getTodayWorkout(sessions || []),
        loading: false,
      })
    }

    fetchStats()
  }, [])

  const workoutLabel =
    stats.todayDay === 'A' ? 'Day A — Squat & Push' : 'Day B — Hinge & Pull'

  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })

  return (
    <div className="p-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-light text-white mb-1 tracking-wide">{getGreeting()}</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Ready to move today?</p>
      </div>

      {/* Today's Workout */}
      <div className="glass-card p-5 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)', transform: 'translate(30%, -30%)' }} />
        <p className="label-text mb-2">Today's Workout</p>
        <h2 className="text-xl font-light text-white mb-1">{workoutLabel}</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>6 exercises · 3 sets each</p>
        <button
          onClick={() => navigate(`/session/${stats.todayDay}`)}
          className="accent-btn w-full py-3.5 text-sm"
        >
          Start Workout
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-4">
          <p className="label-text mb-2">{monthName}</p>
          <p className="text-3xl font-light" style={{ color: '#2dd4bf' }}>
            {stats.loading ? '—' : stats.monthlyCount}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>workouts completed</p>
        </div>
        <div className="glass-card p-4">
          <p className="label-text mb-2">Target</p>
          <p className="text-3xl font-light" style={{ color: '#2dd4bf' }}>12</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>this month</p>
        </div>
      </div>

      {/* Latest PR */}
      <div className="glass-card p-5">
        <p className="label-text mb-3">Latest PR</p>
        {stats.loading ? (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</p>
        ) : stats.latestPR ? (
          <div className="flex items-center justify-between">
            <p className="text-white font-light">{stats.latestPR.exercise_name}</p>
            <p className="text-sm font-medium" style={{ color: '#2dd4bf' }}>{stats.latestPR.weight_lbs} lbs</p>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No PRs yet — start logging</p>
        )}
      </div>
    </div>
  )
}
