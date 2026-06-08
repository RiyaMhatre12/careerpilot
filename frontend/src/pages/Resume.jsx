import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Resume() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/resume/analyze', formData)
      setResult(res.data)
      if (res.data.extracted_skills?.length > 0) {
        localStorage.setItem('skills', res.data.extracted_skills.join(', '))
      }
      if (res.data.existing_role && res.data.suggested_role &&
        res.data.existing_role.toLowerCase() !== res.data.suggested_role.toLowerCase()) {
        setShowConfirm(true)
      }
    } catch (err) {
      setError('Analysis failed. Please try again.')
    }
    setLoading(false)
  }

  const handleRoleChoice = async (useAiRole) => {
    if (useAiRole) {
      try {
        await api.put('/auth/update-profile', {
          target_role: result.suggested_role,
          experience_level: result.experience_level || 'Beginner',
          domain: result.domain || 'Web Development'
        })
        localStorage.setItem('target_role', result.suggested_role)
      } catch (err) {
        console.log('Role update failed', err)
      }
    }
    setShowConfirm(false)
  }

  const completeness = result?.profile_completeness || 0
  const sections = [
    { label: 'Education', done: result?.has_education },
    { label: 'Experience', done: result?.has_experience },
    { label: 'Projects', done: result?.has_projects },
    { label: 'Certifications', done: result?.has_certifications },
    { label: 'Summary', done: result?.has_summary },
    { label: '5+ Skills', done: result?.extracted_skills?.length >= 5 },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Resume Analyzer</h2>
          <p className="text-gray-400">Upload your resume to get ATS score and AI feedback</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-2xl">
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-lg mb-6 text-sm">
          ⚠️ Please upload <strong>your own resume only</strong>. Your skills and profile will be updated from this file.
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <label className="block text-sm text-gray-400 mb-3">Upload Resume (PDF only)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => { setFile(e.target.files[0]); setResult(null) }}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
          />
          {file && <p className="text-green-400 text-sm mt-2">Selected: {file.name}</p>}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors mb-6"
        >
          {loading ? '🔍 Analyzing with AI...' : 'Analyze Resume'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Role Mismatch Dialog */}
        {showConfirm && result && (
          <div className="bg-gray-900 border border-violet-500/50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-lg mb-2">🤔 Role Mismatch Detected</h3>
            <p className="text-gray-400 text-sm mb-4">
              Your signup role and AI detected role differ. Which do you want to use?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleChoice(false)}
                className="bg-gray-800 border border-gray-700 hover:border-violet-500 text-white py-3 px-4 rounded-lg text-sm transition-colors"
              >
                <p className="text-xs text-gray-400 mb-1">Keep my signup role</p>
                <p className="font-semibold text-violet-400">{result.existing_role}</p>
              </button>
              <button
                onClick={() => handleRoleChoice(true)}
                className="bg-gray-800 border border-gray-700 hover:border-emerald-500 text-white py-3 px-4 rounded-lg text-sm transition-colors"
              >
                <p className="text-xs text-gray-400 mb-1">Use AI suggested role</p>
                <p className="font-semibold text-emerald-400">{result.suggested_role}</p>
              </button>
            </div>
          </div>
        )}

        {/* Multiple uploads warning */}
        {result?.multiple_uploads_warning && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            ⚠️ You have uploaded <strong>{result.upload_count} resumes</strong> today. Make sure you are uploading your own resume.
          </div>
        )}

        {result && (
          <div className="space-y-6">

            {/* ATS Score + Profile Completeness */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">ATS Score</p>
                <p className={`text-5xl font-bold ${
                  result.ats_score >= 70 ? 'text-green-400' :
                  result.ats_score >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {result.ats_score}%
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {result.ats_score >= 70 ? 'Excellent' : result.ats_score >= 50 ? 'Good' : 'Needs work'}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Profile Completeness</p>
                <p className={`text-5xl font-bold ${
                  completeness >= 80 ? 'text-green-400' :
                  completeness >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {completeness}%
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {completeness >= 80 ? 'Complete' : completeness >= 60 ? 'Almost there' : 'Incomplete'}
                </p>
              </div>
            </div>

            {/* Profile Sections */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">📋 Resume Sections Detected</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sections.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    s.done
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    <span>{s.done ? '✓' : '✗'}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              {sections.some(s => !s.done) && (
                <p className="text-gray-500 text-xs mt-3">
                  Add missing sections to improve your profile completeness score
                </p>
              )}
            </div>

            {/* Extracted Skills */}
            {result.extracted_skills?.length > 0 && (
              <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6">
                <h3 className="font-semibold text-emerald-400 mb-3">✓ Skills Extracted from Resume</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {result.extracted_skills.map((s, i) => (
                    <span key={i} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-sm">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-gray-500 text-xs">✓ Saved to your profile automatically</p>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-green-400 mb-3">✓ Strengths</h3>
                <ul className="space-y-2">
                  {result.strengths?.map((s, i) => (
                    <li key={i} className="text-gray-300 text-sm">• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-red-400 mb-3">✗ Weaknesses</h3>
                <ul className="space-y-2">
                  {result.weaknesses?.map((w, i) => (
                    <li key={i} className="text-gray-300 text-sm">• {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Resume Improvements */}
            {result.resume_improvements?.length > 0 && (
              <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6">
                <h3 className="font-semibold text-blue-400 mb-3">📝 Resume Improvements</h3>
                <ul className="space-y-2">
                  {result.resume_improvements.map((r, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 font-bold mt-0.5">{i + 1}.</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Keywords */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-amber-400 mb-3">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords?.map((k, i) => (
                  <span key={i} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-sm">
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-violet-400 mb-3">AI Suggestions</h3>
              <ul className="space-y-2">
                {result.suggestions?.map((s, i) => (
                  <li key={i} className="text-gray-300 text-sm">→ {s}</li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/skillgap')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                🎯 Analyze Skill Gap →
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}