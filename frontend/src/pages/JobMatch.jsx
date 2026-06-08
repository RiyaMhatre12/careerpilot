import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function JobMatch() {
  const [jd, setJd] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const role = localStorage.getItem('target_role') || ''
  const skills = localStorage.getItem('skills') || ''

  const handleAnalyze = async () => {
    if (!jd.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const skillList = skills.split(',').map(s => s.trim()).filter(s => s)
      const res = await api.post('/jobmatch/analyze', {
        job_description: jd,
        user_skills: skillList,
        target_role: role
      })
      setResult(res.data)
    } catch (err) {
      setError('Analysis failed. Please try again.')
    }
    setLoading(false)
  }

  const recommendationColor = (rec) => {
    if (rec === 'Strong Match') return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (rec === 'Good Match') return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    if (rec === 'Partial Match') return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-red-400 bg-red-500/10 border-red-500/30'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Job Match Analyzer</h2>
          <p className="text-gray-400">Paste a job description to see how well you match</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-3xl">
        {/* User info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="text-2xl">👤</div>
          <div>
            <p className="text-sm font-medium text-white">Analyzing as: <span className="text-violet-400">{role || 'Your Role'}</span></p>
            <p className="text-xs text-gray-500">Skills: {skills || 'No skills found — upload resume first'}</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <label className="block text-sm text-gray-400 mb-3">Paste Job Description</label>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={10}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none text-sm"
            placeholder="Paste the full job description here...

Example:
We are looking for a Frontend Developer with experience in React, TypeScript, and REST APIs. The candidate should have strong knowledge of HTML, CSS, and JavaScript..."
          />
          <p className="text-gray-500 text-xs mt-2">{jd.length} characters</p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!jd.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors mb-6"
        >
          {loading ? '🔍 Analyzing match...' : 'Analyze Job Match'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Match Score */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm mb-1">Job Match Score</p>
              <p className={`text-6xl font-bold ${
                result.match_percentage >= 70 ? 'text-green-400' :
                result.match_percentage >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {result.match_percentage}%
              </p>
              <div className="mt-3">
                <span className={`text-sm px-4 py-1.5 rounded-full border font-medium ${recommendationColor(result.recommendation)}`}>
                  {result.recommendation}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-4 max-w-md mx-auto">{result.summary}</p>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-green-400 mb-3">✓ Matched Skills</h3>
                {result.matched_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((s, i) => (
                      <span key={i} className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No matching skills found</p>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-red-400 mb-3">✗ Missing Skills</h3>
                {result.missing_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((s, i) => (
                      <span key={i} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-400 text-sm">No missing skills — great match!</p>
                )}
              </div>
            </div>

            {/* Strong Points */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-violet-400 mb-3">💪 Your Strong Points for this Job</h3>
              <ul className="space-y-2">
                {result.strong_points?.map((s, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Areas */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-amber-400 mb-3">📈 Areas to Improve for this Job</h3>
              <ul className="space-y-2">
                {result.improvement_areas?.map((s, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">{i + 1}.</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setResult(null); setJd('') }}
                className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white py-3 rounded-lg transition-colors text-sm"
              >
                ← Analyze Another Job
              </button>
              <button
                onClick={() => navigate('/skillgap')}
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                🎯 Fix Skill Gaps →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}