import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { programDays } from '../data/program'

export default function Log() {
  const [workoutDay, setWorkoutDay] = useState('A')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [sets, setSets] = useState([{ weight: '', reps: '' }])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const exercises = programDays[workoutDay].exercises

  const addSet = () => setSets([...sets, { weight: '', reps: '' }])

  const updateSet = (index, field, value) => {
    const updated = [...sets]
    updated[index][field] = value
    setSets(updated)
  }

  const handleSave = async () => {
    if (!selectedExercise) return
    const validSets = sets.filter((s) => s.weight !== '' && s.reps !== '')
    if (validSets.length === 0) return

    setSaving(true)
    setError(null)

    try {
      const rows = validSets.map((s, i) => ({
        workout_day: workoutDay,
        exercise_name: selectedExercise,
        set_number: i + 1,
        reps: parseInt(s.reps),
        weight_lbs: parseFloat(s.weight),
      }))

      const { error: logError } = await supabase.from('exercise_logs').insert(rows)
      if (logError) throw logError

      const maxWeight = Math.max(...validSets.map((s) => parseFloat(s.weight)))
      const { data: existing } = await supabase
        .from('personal_records')
        .select('weight_lbs')
        .eq('exercise_name', selectedExercise)
        .single()

      if (!existing || maxWeight > existing.weight_lbs) {
        await supabase.from('personal_records').upsert({
          exercise_name: selectedExercise,
          weight_lbs: maxWeight,
          achieved_at: new Date().toISOString(),
        }, { onConflict: 'exercise_name' })
      }

      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setSelectedExercise('')
        setSets([{ weight: '', reps: '' }])
      }, 2000)
    } catch (err) {
      setError('Failed to save. Check your connection and try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-1">Log Set</h1>
      <p className="text-zinc-400 text-sm mb-6">Track your workout as you go</p>

      <div className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Workout Day</p>
        <div className="flex gap-3">
          {['A', 'B'].map((day) => (
            <button
              key={day}
              onClick={() => { setWorkoutDay(day); setSelectedExercise('') }}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                workoutDay === day
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Exercise</p>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Select an exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.name} value={ex.name}>{ex.name}</option>
          ))}
        </select>
      </div>

      {selectedExercise && (
        <div className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Sets</p>
          {sets.map((set, index) => (
            <div key={index} className="flex items-center gap-3 mb-3">
              <span className="text-zinc-500 text-sm w-8">#{index + 1}</span>
              <input
                type="number"
                placeholder="lbs"
                value={set.weight}
                onChange={(e) => updateSet(index, 'weight', e.target.value)}
                className="flex-1 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="number"
                placeholder="reps"
                value={set.reps}
                onChange={(e) => updateSet(index, 'reps', e.target.value)}
                className="flex-1 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          ))}
          <button
            onClick={addSet}
            className="w-full border border-zinc-700 text-zinc-400 py-2 rounded-xl text-sm mt-1 hover:border-violet-500 hover:text-violet-400 transition-colors"
          >
            + Add Set
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

      {selectedExercise && (
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full font-semibold py-4 rounded-xl transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : saving
              ? 'bg-violet-800 text-violet-300 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save Exercise'}
        </button>
      )}
    </div>
  )
}
