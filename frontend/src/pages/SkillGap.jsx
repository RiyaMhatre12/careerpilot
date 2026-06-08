import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function SkillGap() {
  const [skills, setSkills] = useState(localStorage.getItem('skills') || '')
  const [role, setRole] = useState(localStorage.getItem('target_role') || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAnalyze = async () => {
    if (!skills || !role) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const skillList = skills.split(',').map(s => s.trim()).filter(s => s)
      const res = await api.post('/skills/gap', {
        user_skills: skillList,
        target_role: role
      })
      setResult(res.data)
    } catch (err) {
      setError('Analysis failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Skill Gap Analyzer</h2>
          <p className="text-gray-400">AI-powered semantic skill matching using Sentence-BERT</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-3xl">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Your Current Skills</label>
            <input
              type="text"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              placeholder="HTML, CSS, JavaScript, Python"
            />
            <p className="text-gray-500 text-xs mt-1">Separate skills with commas</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              placeholder="Frontend Developer, Data Analyst"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!skills || !role || loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors mb-6"
        >
          {loading ? '🔍 Analyzing with ML + AI...' : 'Analyze Skill Gap'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">

            {/* ML Badge */}
            {result.ml_powered && (
              <div className="bg-violet-500/10 border border-violet-500/30 text-violet-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                🤖 <strong>ML-Powered:</strong> Using Sentence-BERT embeddings + cosine similarity for semantic matching
              </div>
            )}

            {/* Match Score */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm mb-1">Semantic Skill Match</p>
              <p className={`text-6xl font-bold ${
                result.match_percentage >= 70 ? 'text-green-400' :
                result.match_percentage >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {result.match_percentage}%
              </p>
              <p className="text-gray-500 text-sm mt-1">match for {role}</p>
            </div>

            {/* Matched Skills with Confidence */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-green-400 mb-4">✓ Matched Skills</h3>
              {result.matched_details?.length > 0 ? (
                <div className="space-y-3">
                  {result.matched_details.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 text-sm font-medium">{m.required}</span>
                        <span className="text-gray-500 text-xs">← matched via</span>
                        <span className="text-violet-400 text-sm">{m.matched_with}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${m.confidence}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-xs font-medium">{m.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No matching skills found</p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-red-400 mb-3">✗ Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills?.map((s, i) => (
                  <span key={i} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Priority to Learn */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-violet-400 mb-3">🎯 Top Skills to Learn Next</h3>
              <ul className="space-y-2">
                {result.priority_to_learn?.map((s, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                    <span className="text-violet-400 font-bold">{i + 1}.</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => navigate(`/roadmap?skills=${encodeURIComponent(skills)}&role=${encodeURIComponent(role)}`)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              🗺️ Generate Roadmap for {role} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}