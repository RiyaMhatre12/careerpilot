import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Quiz() {
  const [step, setStep] = useState('setup')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const role = localStorage.getItem('target_role') || ''
  const skills = localStorage.getItem('skills') || ''

  const startQuiz = async () => {
    setLoading(true)
    try {
      const skillList = skills.split(',').map(s => s.trim()).filter(s => s)
      const res = await api.post('/quiz/generate', {
        target_role: role,
        skills: skillList,
        num_questions: 10
      })
      setQuestions(res.data.questions)
      setAnswers([])
      setCurrent(0)
      setSelected(null)
      setShowExplanation(false)
      setStep('quiz')
    } catch (err) {
      alert('Failed to generate quiz. Try again.')
    }
    setLoading(false)
  }

  const handleSelect = (index) => {
    if (selected !== null) return
    setSelected(index)
    setShowExplanation(true)
  }

  const handleNext = () => {
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    setSelected(null)
    setShowExplanation(false)
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      submitQuiz(newAnswers)
    }
  }

  const submitQuiz = async (finalAnswers) => {
    setLoading(true)
    try {
      const res = await api.post('/quiz/submit', {
        questions: questions,
        answers: finalAnswers
      })
      setResult(res.data)
      setStep('results')
    } catch (err) {
      alert('Submission failed. Try again.')
    }
    setLoading(false)
  }

  const q = questions[current]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Topic Quiz</h2>
          <p className="text-gray-400">Test your knowledge for {role || 'your target role'}</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </button>
      </div>

      {step === 'setup' && (
        <div className="max-w-2xl">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2">Ready for your quiz?</h3>
              <p className="text-gray-400 text-sm">10 multiple choice questions based on your target role and skills</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Target Role</span>
                <span className="text-violet-400 font-medium">{role || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Questions</span>
                <span className="text-white">10 MCQ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pass Score</span>
                <span className="text-green-400">60% to unlock Interview</span>
              </div>
            </div>
            <button
              onClick={startQuiz}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Generating Questions...' : '🚀 Start Quiz'}
            </button>
          </div>
        </div>
      )}

      {step === 'quiz' && q && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            {questions.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${
                i < current ? 'bg-violet-500' :
                i === current ? 'bg-violet-400' : 'bg-gray-700'
              }`} />
            ))}
          </div>
          <p className="text-gray-500 text-sm mb-6">Question {current + 1} of {questions.length}</p>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
            <p className="text-lg font-medium leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-3 mb-4">
            {q.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected === null
                    ? 'bg-gray-900 border-gray-700 hover:border-violet-500 text-gray-300'
                    : i === q.correct
                    ? 'bg-green-500/20 border-green-500 text-green-300'
                    : selected === i
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-gray-900 border-gray-700 text-gray-500'
                }`}
              >
                <span className="font-bold mr-3 text-gray-400">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-4 mb-4 text-sm ${
              selected === q.correct
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              <p className="font-semibold mb-1">
                {selected === q.correct ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              <p className="text-gray-300">{q.explanation}</p>
            </div>
          )}

          {selected !== null && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Submitting...' : current + 1 === questions.length ? 'Submit Quiz' : 'Next Question →'}
            </button>
          )}
        </div>
      )}

      {step === 'results' && result && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-gradient-to-r from-violet-900/40 to-blue-900/40 border border-violet-500/30 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-1">Quiz Score</p>
            <p className={`text-6xl font-bold ${
              result.score >= 70 ? 'text-green-400' :
              result.score >= 60 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {result.score}%
            </p>
            <p className="text-gray-400 mt-2">{result.correct} out of {result.total} correct</p>
            <p className={`text-sm font-medium mt-2 ${
              result.score >= 60 ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.score >= 70 ? '🎉 Excellent! Interview unlocked!' :
               result.score >= 60 ? '👍 Passed! Interview unlocked!' :
               '❌ Below 60% — retake to unlock Interview'}
            </p>
          </div>

          {/* Review */}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className={`bg-gray-900 border rounded-2xl p-5 ${
                answers[i] === q.correct ? 'border-green-500/30' : 'border-red-500/30'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={answers[i] === q.correct ? 'text-green-400' : 'text-red-400'}>
                    {answers[i] === q.correct ? '✓' : '✗'}
                  </span>
                  <p className="text-sm font-medium">{q.question}</p>
                </div>
                <p className="text-xs text-gray-400 mb-1 ml-5">
                  Your answer: <span className={answers[i] === q.correct ? 'text-green-400' : 'text-red-400'}>
                    {q.options?.[answers[i]] || 'Not answered'}
                  </span>
                </p>
                {answers[i] !== q.correct && (
                  <p className="text-xs text-gray-400 mb-1 ml-5">
                    Correct: <span className="text-green-400">{q.options?.[q.correct]}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 ml-5">{q.explanation}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setStep('setup'); setResult(null) }}
              className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white py-3 rounded-lg transition-colors text-sm"
            >
              Retake Quiz
            </button>
            {result.score >= 60 ? (
              <button
                onClick={() => navigate('/interview')}
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                🎤 Start Interview →
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center">
                Need 60% to unlock Interview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}