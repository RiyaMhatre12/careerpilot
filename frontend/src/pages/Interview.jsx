import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Interview() {
  const [step, setStep] = useState('setup')
  const [role, setRole] = useState(localStorage.getItem('target_role') || '')
  const [skills, setSkills] = useState(localStorage.getItem('skills') || '')
  const [type, setType] = useState('technical')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  // Check lock on page load
  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data.quiz_score < 60) {
        alert(`Mock Interview is locked. Your quiz score is ${res.data.quiz_score}%. You need at least 60% to unlock.`)
        navigate('/dashboard')
      } else {
        setChecking(false)
      }
    }).catch(() => {
      navigate('/')
    })
  }, [])

  if (checking) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Checking access...</p>
    </div>
  )

  const startInterview = async () => {
    if (!role || !skills) return
    setLoading(true)
    try {
      const skillList = skills.split(',').map(s => s.trim()).filter(s => s)
      const res = await api.post('/interview/questions', {
        target_role: role,
        skills: skillList,
        interview_type: type
      })
      setQuestions(res.data.questions)
      setCurrent(0)
      setEvaluations([])
      setStep('interview')
    } catch (err) {
      alert('Failed to load questions. Try again.')
    }
    setLoading(false)
  }

  const saveScore = async (score) => {
    try {
      await api.post('/interview/save-score', { score })
      await api.post('/auth/calculate-readiness')
    } catch (err) {
      console.log('Score save failed', err)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/interview/evaluate', {
        question: questions[current],
        answer: answer,
        role: role
      })
      const newEval = { question: questions[current], answer, ...res.data }
      const newEvaluations = [...evaluations, newEval]
      setEvaluations(newEvaluations)
      setAnswer('')
      if (current + 1 < questions.length) {
        setCurrent(current + 1)
      } else {
        const finalScore = Math.round(
          newEvaluations.reduce((a, e) => a + e.score, 0) /
          newEvaluations.length * 10
        )
        await saveScore(finalScore)
        setStep('results')
      }
    } catch (err) {
      alert('Evaluation failed. Try again.')
    }
    setLoading(false)
  }

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((a, e) => a + e.score, 0) / evaluations.length * 10)
    : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Mock Interview</h2>
          <p className="text-gray-400">Practice with AI-generated questions and get instant feedback</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </button>
      </div>

      {step === 'setup' && (
        <div className="max-w-2xl">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
            {role && skills && (
              <div className="bg-violet-500/10 border border-violet-500/30 text-violet-400 px-4 py-3 rounded-lg text-sm">
                ✓ Auto-filled from your profile. You can edit if needed.
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Target Role</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                placeholder="Frontend Developer, Data Scientist"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Your Skills</label>
              <input
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                placeholder="HTML, CSS, JavaScript, React"
              />
              <p className="text-gray-500 text-xs mt-1">Separate with commas</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Interview Type</label>
              <div className="flex gap-3">
                {['technical', 'hr', 'coding'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      type === t
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startInterview}
              disabled={!role || !skills || loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Loading Questions...' : '🎤 Start Interview'}
            </button>
          </div>
        </div>
      )}

      {step === 'interview' && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            {questions.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${
                i < current ? 'bg-violet-500' : i === current ? 'bg-violet-400' : 'bg-gray-700'
              }`} />
            ))}
          </div>
          <p className="text-gray-500 text-sm mb-2">Question {current + 1} of {questions.length}</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <p className="text-lg font-medium leading-relaxed">{questions[current]}</p>
          </div>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={6}
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 mb-4 resize-none"
            placeholder="Type your answer here..."
          />
          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Evaluating...' : current + 1 === questions.length ? 'Submit Final Answer' : 'Submit & Next →'}
          </button>
        </div>
      )}

      {step === 'results' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-gradient-to-r from-violet-900/40 to-blue-900/40 border border-violet-500/30 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-1">Overall Interview Score</p>
            <p className={`text-6xl font-bold ${
              avgScore >= 70 ? 'text-green-400' :
              avgScore >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {avgScore}%
            </p>
            <p className="text-gray-500 text-sm mt-1">{evaluations.length} questions answered</p>
          </div>

          {evaluations.map((e, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Question {i + 1}</p>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  e.score >= 7 ? 'bg-green-500/20 text-green-400' :
                  e.score >= 5 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {e.score}/10
                </span>
              </div>
              <p className="font-medium mb-3">{e.question}</p>
              <p className="text-gray-400 text-sm mb-4 italic">Your answer: {e.answer}</p>
              <div className="space-y-2">
                <p className="text-green-400 text-sm">✓ {e.what_was_good}</p>
                <p className="text-amber-400 text-sm">→ {e.what_to_improve}</p>
                <p className="text-gray-300 text-sm">{e.feedback}</p>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setStep('setup'); setEvaluations([]); setQuestions([]) }}
              className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white py-3 rounded-lg transition-colors text-sm"
            >
              ← Start New Interview
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              View Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}