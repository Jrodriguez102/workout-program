import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('id, completed_at, workout_day')
        .order('completed_at', { ascending: false })

      if (!sessionData || sessionData.length === 0) {
        setSessions([])
        setLoading(false)
        return
      }

      const enriched = await Promise.all(
        sessionData.map(async (session) => {
          const { data: logs } = await supabase
            .from('exercise_logs')
            .select('exercise_name')
            .eq('workout_day', session.workout_day)
            .gte('logged_at', session.completed_at)
            .order('logged_at', { ascending: true })

          const unique = [...new Set((logs || []).map((l) => l.exercise_name))]
          return { ...session, exercises: unique }
        })
      )

      setSessions(enriched)
      setLoading(false)
    }

    fetchHistory()
  }, [])

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-light text-white mb-1 tracking-wide">History</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Every session you have completed</p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-white font-light mb-1">No workouts yet</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Complete your first session to see it here</p>
        </div>
      ) : (
        sessions.map((session) => {
          const date = new Date(session.completed_at).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })
          const time = new Date(session.completed_at).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit',
          })

          return (
            <div key={session.id} className="glass-card p-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-light">Day {session.workout_day}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{date} · {time}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
                  {session.exercises.length} exercises
                </span>
              </div>
              <div className="space-y-1.5">
                {session.exercises.map((ex) => (
                  <p key={ex} className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>— {ex}</p>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
