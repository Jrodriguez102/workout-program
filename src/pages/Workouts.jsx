import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { programDays } from '../data/program'

function hasActiveSession(day) {
  try {
    const raw = sessionStorage.getItem(`workout_session_day_${day}`)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.exercises) && Array.isArray(parsed.sets)
  } catch {}
  return false
}

export default function Workouts() {
  const navigate = useNavigate()
  const [activeSessions, setActiveSessions] = useState({})

  useEffect(() => {
    const active = {}
    Object.keys(programDays).forEach((day) => {
      active[day] = hasActiveSession(day)
    })
    setActiveSessions(active)
  }, [])

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-light text-white mb-1 tracking-wide">Program</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>3 days per week · Alternating A/B</p>
      </div>

      {Object.entries(programDays).map(([day, program]) => (
        <div key={day} className="glass-card p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)', transform: 'translate(30%, -30%)' }} />

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#2dd4bf' }}>Day {day}</span>
              <p className="text-lg font-light text-white mt-0.5">{program.focus}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
              {program.exercises.length} exercises
            </span>
          </div>

          <div className="mb-4">
            {program.exercises.map((ex, i) => (
              <div key={ex.name} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < program.exercises.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div>
                  <p className="text-sm font-light text-white">{ex.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{ex.pattern}</p>
                </div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{ex.sets} × {ex.reps}</p>
              </div>
            ))}
          </div>

          <div className="mb-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {program.cardio ? `Cardio finisher: ${program.cardio}` : program.cardioNote}
            </p>
          </div>

          <button
            onClick={() => navigate(`/session/${day}`)}
            className="accent-btn w-full py-3.5 text-sm"
          >
            {activeSessions[day] ? `Resume Day ${day}` : `Start Day ${day}`}
          </button>
        </div>
      ))}
    </div>
  )
}
