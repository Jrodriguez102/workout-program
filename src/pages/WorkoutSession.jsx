import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { programDays } from '../data/program'

export default function WorkoutSession() {
  const { day } = useParams()
  const navigate = useNavigate()
  const program = programDays[day]

  const [exercises, setExercises] = useState(program.exercises)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sets, setSets] = useState(
    program.exercises.map((ex) =>
      Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', seconds: '', done: false }))
    )
  )
  const [showSwap, setShowSwap] = useState(false)
  const [cardioMinutes, setCardioMinutes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const currentExercise = exercises[currentIndex]
  const currentSets = sets[currentIndex]
  const isHold = currentExercise.isHold

  const updateSet = (setIndex, field, value) => {
    setSets(sets.map((s, i) =>
      i === currentIndex
        ? s.map((set, j) => (j === setIndex ? { ...set, [field]: value } : set))
        : s
    ))
  }

  const toggleDone = (setIndex) => {
    setSets(sets.map((s, i) =>
      i === currentIndex
        ? s.map((set, j) => (j === setIndex ? { ...set, done: !set.done } : set))
        : s
    ))
  }

  const handleSwap = (altName) => {
    setExercises(exercises.map((ex, i) => {
      if (i !== currentIndex) return ex
      const altDemo = ex.alternativeDemos?.[altName] ?? ex.demo
      return { ...ex, name: altName, demo: altDemo }
    }))
    setShowSwap(false)
  }

  const allSetsDone = currentSets.every((s) => s.done)
  const isLastExercise = currentIndex === exercises.length - 1

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowSwap(false)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    setError(null)
    try {
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ workout_day: day })
      if (sessionError) throw sessionError

      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]
        const isHoldEx = exercise.isHold
        const doneSets = sets[i].filter((s) => {
          if (!s.done) return false
          if (isHoldEx) return s.seconds !== ''
          return s.weight !== '' && s.reps !== ''
        })
        if (doneSets.length === 0) continue

        const rows = doneSets.map((s, j) => ({
          workout_day: day,
          exercise_name: exercise.name,
          set_number: j + 1,
          reps: isHoldEx ? null : parseInt(s.reps),
          weight_lbs: isHoldEx ? null : parseFloat(s.weight),
          seconds: isHoldEx ? parseInt(s.seconds) : null,
        }))

        const { error: logError } = await supabase.from('exercise_logs').insert(rows)
        if (logError) throw logError

        if (!isHoldEx) {
          const maxWeight = Math.max(...doneSets.map((s) => parseFloat(s.weight)))
          const { data: existing } = await supabase
            .from('personal_records')
            .select('weight_lbs')
            .eq('exercise_name', exercise.name)
            .single()
          if (!existing || maxWeight > existing.weight_lbs) {
            await supabase.from('personal_records').upsert(
              { exercise_name: exercise.name, weight_lbs: maxWeight, achieved_at: new Date().toISOString() },
              { onConflict: 'exercise_name' }
            )
          }
        }
      }
      navigate('/')
    } catch (err) {
      setError('Failed to save workout. Try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex items-start justify-between mb-2 pt-2">
        <div>
          <p className="label-text mb-1">Day {day} — {program.focus}</p>
          <h1 className="text-2xl font-light text-white">{currentExercise.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{currentExercise.pattern}</p>
        </div>
        <span className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{currentIndex + 1} / {exercises.length}</span>
      </div>

      <div className="w-full rounded-full h-1 mb-6 mt-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-1 rounded-full transition-all"
          style={{
            width: `${((currentIndex + 1) / exercises.length) * 100}%`,
            background: 'linear-gradient(90deg, #2dd4bf, #38bdf8)',
          }}
        />
      </div>

      <div className="glass-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="label-text mb-1">Target</p>
            <p className="text-white font-light">{currentExercise.sets} sets × {currentExercise.reps}</p>
          </div>
          <div className="flex gap-2">
            {currentExercise.demo && (
              <a
                href={currentExercise.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Watch demo
              </a>
            )}
            <button
              onClick={() => setShowSwap(!showSwap)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }}
            >
              Swap
            </button>
          </div>
        </div>

        {showSwap && (
          <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="label-text mb-2">Alternatives</p>
            <div className="space-y-2">
              {currentExercise.alternatives.map((alt) => (
                <button
                  key={alt}
                  onClick={() => handleSwap(alt)}
                  className="w-full text-left text-sm font-light text-white px-4 py-3 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-5 mb-4">
        <p className="label-text mb-4">Sets</p>
        {currentSets.map((set, index) => (
          <div key={index} className="flex items-center gap-2 mb-3 w-full min-w-0">
            <span className="text-xs w-6" style={{ color: 'rgba(255,255,255,0.3)' }}>#{index + 1}</span>
            {isHold ? (
              <input
                type="number"
                placeholder="seconds"
                value={set.seconds}
                onChange={(e) => updateSet(index, 'seconds', e.target.value)}
                className="input-field min-w-0 flex-1 px-3 py-2.5 text-sm"
              />
            ) : (
              <>
                <input
                  type="number"
                  placeholder="lbs"
                  value={set.weight}
                  onChange={(e) => updateSet(index, 'weight', e.target.value)}
                  className="input-field min-w-0 flex-1 px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="reps"
                  value={set.reps}
                  onChange={(e) => updateSet(index, 'reps', e.target.value)}
                  className="input-field min-w-0 flex-1 px-3 py-2.5 text-sm"
                />
              </>
            )}
            <button
              onClick={() => toggleDone(index)}
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
              style={set.done
                ? { background: 'linear-gradient(135deg, #2dd4bf, #38bdf8)', color: '#0f0d10' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {set.done ? '✓' : '○'}
            </button>
          </div>
        ))}
      </div>

      {isLastExercise && (
        <div className="glass-card p-5 mb-4">
          <p className="label-text mb-1">Cardio Finisher</p>
          <p className="text-sm font-light mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{program.cardio}</p>
          <input
            type="number"
            placeholder="Minutes completed"
            value={cardioMinutes}
            onChange={(e) => setCardioMinutes(e.target.value)}
            className="input-field w-full px-4 py-3 text-sm"
          />
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

      {isLastExercise ? (
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-medium transition-all"
          style={saving
            ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
            : { background: 'linear-gradient(135deg, #2dd4bf, #38bdf8)', color: '#0f0d10' }
          }
        >
          {saving ? 'Saving...' : 'Finish Workout'}
        </button>
      ) : (
        <button
          onClick={handleNext}
          disabled={!allSetsDone}
          className="w-full py-4 rounded-2xl text-sm font-medium transition-all"
          style={allSetsDone
            ? { background: 'linear-gradient(135deg, #2dd4bf, #38bdf8)', color: '#0f0d10' }
            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
          }
        >
          Next Exercise
        </button>
      )}
    </div>
  )
}