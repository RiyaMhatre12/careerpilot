import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Roadmap() {
  const [skills, setSkills] = useState(localStorage.getItem('skills') || '')
  const [role, setRole] = useState(localStorage.getItem('target_role') || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [completedTopics, setCompletedTopics] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Load saved roadmap on mount
  useEffect(() => {
    const s = searchParams.get('skills')
    const r = searchParams.get('role')
    if (s) setSkills(s)
    if (r) setRole(r)

    api.get('/skills/roadmap/saved').then(res => {
      if (res.data.roadmap) {
        setResult(res.data.roadmap)
        setCompletedTopics(res.data.completed_topics || [])
      }
      setLoadingSaved(false)
      if (s && r && !res.data.roadmap) {
        handleGenerate(s, r)
      }
    }).catch(() => setLoadingSaved(false))
  }, [])

  const handleGenerate = async (s, r) => {
    const skillsToUse = s || skills
    const roleToUse = r || role
    if (!skillsToUse || !roleToUse) return
    setLoading(true)
    setError('')
    setResult(null)
    setCompletedTopics([])
    try {
      const skillList = skillsToUse.split(',').map(s => s.trim()).filter(s => s)
      const res = await api.post('/skills/roadmap', {
        user_skills: skillList,
        target_role: roleToUse
      })
      setResult(res.data)
    } catch (err) {
      setError('Generation failed. Please try again.')
    }
    setLoading(false)
  }

  const toggleTopic = async (topic) => {
    const updated = completedTopics.includes(topic)
      ? completedTopics.filter(t => t !== topic)
      : [...completedTopics, topic]
    setCompletedTopics(updated)
    try {
      await api.post('/skills/roadmap/progress', { completed_topics: updated })
    } catch (err) {
      console.log('Progress save failed', err)
    }
  }

  const allTopics = result?.stages?.flatMap(s => s.topics) || []
  const progressPercent = allTopics.length
    ? Math.round((completedTopics.length / allTopics.length) * 100)
    : 0

  const stageColors = [
    'border-violet-500 bg-violet-500/10',
    'border-blue-500 bg-blue-500/10',
    'border-emerald-500 bg-emerald-500/10',
    'border-amber-500 bg-amber-500/10',
    'border-pink-500 bg-pink-500/10',
  ]

  const dotColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500']

  if (loadingSaved) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Loading your roadmap...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Learning Roadmap</h2>
          <p className="text-gray-400">Your personalized step-by-step learning path</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-4xl">
        {!result ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-400">Generating your personalized roadmap...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Your Current Skills</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={e => setSkills(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                      placeholder="HTML, CSS, JavaScript"
                    />
                    <p className="text-gray-500 text-xs mt-1">Separate with commas</p>
                  </div>
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
                </div>
                <button
                  onClick={() => handleGenerate()}
                  disabled={!skills || !role || loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  🗺️ Generate My Roadmap
                </button>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mt-4">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900/40 to-blue-900/40 border border-violet-500/30 rounded-2xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-violet-300 mb-1">{result.title}</h3>
              <div className="flex items-center gap-6 mt-3 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{result.estimated_weeks}</p>
                  <p className="text-gray-400 text-sm">weeks total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{result.stages?.length}</p>
                  <p className="text-gray-400 text-sm">stages</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{allTopics.length}</p>
                  <p className="text-gray-400 text-sm">topics</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{completedTopics.length}</p>
                  <p className="text-gray-400 text-sm">completed</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-violet-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Progress: {progressPercent}%</span>
                <span>{completedTopics.length}/{allTopics.length} topics done</span>
              </div>
            </div>

            {/* Stages */}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700"></div>
              <div className="space-y-6">
                {result.stages?.map((stage, i) => {
                  const stageTopicsDone = stage.topics?.filter(t => completedTopics.includes(t)).length
                  const stageProgress = stage.topics?.length
                    ? Math.round((stageTopicsDone / stage.topics.length) * 100)
                    : 0

                  return (
                    <div key={i} className="relative pl-16">
                      <div className={`absolute left-3.5 top-6 w-5 h-5 rounded-full ${dotColors[i % dotColors.length]} border-2 border-gray-950 z-10`}></div>
                      <div className={`border ${stageColors[i % stageColors.length]} rounded-2xl p-6`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Stage {i + 1}</span>
                            <h4 className="text-xl font-bold mt-0.5">{stage.stage_name}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{stage.duration_weeks}</p>
                            <p className="text-gray-400 text-xs">weeks</p>
                          </div>
                        </div>

                        {/* Stage progress */}
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${stageProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-4">{stageTopicsDone}/{stage.topics?.length} topics completed</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">📚 Topics</p>
                            <div className="space-y-2">
                              {stage.topics?.map((t, j) => (
                                <button
                                  key={j}
                                  onClick={() => toggleTopic(t)}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    completedTopics.includes(t)
                                      ? 'bg-green-500/20 text-green-400 line-through'
                                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    completedTopics.includes(t)
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-600'
                                  }`}>
                                    {completedTopics.includes(t) && <span className="text-white text-xs">✓</span>}
                                  </span>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">🛠️ Projects</p>
                            <ul className="space-y-1">
                              {stage.projects?.map((p, j) => (
                                <li key={j} className="text-gray-300 text-sm flex items-center gap-2">
                                  <span className="text-emerald-400 text-xs">◆</span> {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => handleGenerate()}
              className="mt-8 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white px-6 py-2 rounded-lg transition-colors text-sm"
            >
              ↺ Regenerate Roadmap
            </button>
          </div>
        )}
      </div>
    </div>
  )
}