import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { programDays } from '../data/program'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning, Jasmine'
  if (hour < 17) return 'Good afternoon, Jasmine'
  return 'Good evening, Jasmine'
}

const NEXT_DAY = { A: 'B', B: 'C', C: 'A' }

function getTodayWorkout(sessions) {
  const resistanceSessions = sessions.filter((s) => s.workout_day !== 'Stairmaster')
  if (resistanceSessions.length === 0) return 'A'
  const last = resistanceSessions[0].workout_day
  return NEXT_DAY[last] ?? 'A'
}

function hasActiveSession(day) {
  try {
    const raw = sessionStorage.getItem(`workout_session_day_${day}`)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.exercises) && Array.isArray(parsed.sets)
  } catch {}
  return false
}

const DAY_LABELS = {
  A: 'Day A — Squat & Push',
  B: 'Day B — Hinge & Pull',
  C: 'Day C — Lunge & Arms',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    monthlyCount: 0,
    cardioCount: 0,
    latestPR: null,
    todayDay: 'A',
    loading: true,
  })
  const [resumeDay, setResumeDay] = useState(null)
  const [resumeCardio, setResumeCardio] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('completed_at, workout_day')
        .order('completed_at', { ascending: false })

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyCount = (sessions || []).filter(
        (s) => new Date(s.completed_at) >= startOfMonth && s.workout_day !== 'Stairmaster'
      ).length
      const cardioCount = (sessions || []).filter(
        (s) => new Date(s.completed_at) >= startOfMonth && s.workout_day === 'Stairmaster'
      ).length

      const { data: prs } = await supabase
        .from('personal_records')
        .select('exercise_name, weight_lbs, achieved_at')
        .order('achieved_at', { ascending: false })
        .limit(1)

      const todayDay = getTodayWorkout(sessions || [])

      setStats({
        monthlyCount,
        cardioCount,
        latestPR: prs && prs.length > 0 ? prs[0] : null,
        todayDay,
        loading: false,
      })

      setResumeDay(hasActiveSession(todayDay) ? todayDay : null)
      setResumeCardio(hasActiveSession('Stairmaster'))
    }

    fetchStats()
  }, [])

  const workoutLabel = DAY_LABELS[stats.todayDay] ?? DAY_LABELS.A
  const exerciseCount = programDays[stats.todayDay]?.exercises.length ?? 6

  function getMonthlyTarget() {
    const now = new Date()
    const programStart = new Date(2026, 5, 14)
    const isStartMonth =
      now.getFullYear() === programStart.getFullYear() &&
      now.getMonth() === programStart.getMonth()
    if (isStartMonth) return 7
    return 12
  }
  const monthlyTarget = getMonthlyTarget()
  const monthName = new Date().toLocaleString('en-US', { month: 'long' })

  return (
    <div className="p-5 max-w-lg mx-auto">
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
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>{exerciseCount} exercises · 3 sets each</p>
        <button
          onClick={() => navigate(`/session/${stats.todayDay}`)}
          className="accent-btn w-full py-3.5 text-sm"
        >
          {resumeDay ? 'Resume Workout' : 'Start Workout'}
        </button>
      </div>

      {/* Optional Stairmaster Day */}
      <div className="glass-card p-5 mb-4">
        <p className="label-text mb-2">Optional</p>
        <h2 className="text-xl font-light text-white mb-1">Stairmaster & Core</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Stairmaster intervals · 25 min + core circuit</p>
        <button
          onClick={() => navigate('/session/Stairmaster')}
          className="w-full py-3.5 text-sm rounded-2xl font-medium transition-all"
          style={{ border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf', background: 'rgba(45,212,191,0.05)' }}
        >
          {resumeCardio ? 'Resume Stairmaster Day' : 'Start Stairmaster Day'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-card p-4">
          <p className="label-text mb-2">{monthName}</p>
          <p className="text-3xl font-light" style={{ color: '#2dd4bf' }}>
            {stats.loading ? '—' : stats.monthlyCount}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>workouts</p>
        </div>
        <div className="glass-card p-4">
          <p className="label-text mb-2">Target</p>
          <p className="text-3xl font-light" style={{ color: '#2dd4bf' }}>{monthlyTarget}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>this month</p>
        </div>
        <div className="glass-card p-4">
          <p className="label-text mb-2">Cardio</p>
          <p className="text-3xl font-light" style={{ color: '#2dd4bf' }}>
            {stats.loading ? '—' : stats.cardioCount}
          </p>
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