import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { exerciseNames } from '../data/program'

export default function Progress() {
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0])
  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState({ totalWorkouts: 0, maxWeight: 0, improvement: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('logged_at, weight_lbs')
        .eq('exercise_name', selectedExercise)
        .order('logged_at', { ascending: true })

      const { count } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })

      if (!logs || logs.length === 0) {
        setChartData([])
        setStats({ totalWorkouts: count || 0, maxWeight: 0, improvement: null })
        setLoading(false)
        return
      }

      const byDate = {}
      for (const log of logs) {
        const date = new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!byDate[date] || log.weight_lbs > byDate[date]) byDate[date] = log.weight_lbs
      }

      const points = Object.entries(byDate).map(([date, weight]) => ({ date, weight }))
      const maxWeight = Math.max(...points.map((p) => p.weight))
      const firstWeight = points[0].weight
      const improvement = points.length > 1
        ? Math.round(((maxWeight - firstWeight) / firstWeight) * 100)
        : null

      setChartData(points)
      setStats({ totalWorkouts: count || 0, maxWeight, improvement })
      setLoading(false)
    }

    fetchData()
  }, [selectedExercise])

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-light text-white mb-1 tracking-wide">Progress</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Strength over time</p>
      </div>

      {/* Exercise Selector */}
      <div className="glass-card p-5 mb-4">
        <p className="label-text mb-2">Exercise</p>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="input-field w-full px-4 py-3 text-sm"
        >
          {exerciseNames.map((ex) => (
            <option key={ex} value={ex} style={{ background: '#1a1520' }}>{ex}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="glass-card p-5 mb-4">
        <p className="label-text mb-1">Weight Progression</p>
        <p className="text-white font-light mb-4">{selectedExercise}</p>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No data yet for this exercise</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(26,21,32,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={{ fill: '#2dd4bf', r: 3 }}
                activeDot={{ r: 5, fill: '#38bdf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Workouts', value: stats.totalWorkouts },
          { label: 'Max lbs', value: stats.maxWeight > 0 ? stats.maxWeight : '—' },
          { label: 'Strength', value: stats.improvement !== null ? `+${stats.improvement}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className="text-xl font-light" style={{ color: '#2dd4bf' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
