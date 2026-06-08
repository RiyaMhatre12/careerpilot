import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api'

export default function Dashboard() {
  const name = localStorage.getItem('name')
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setUser(res.data)
      localStorage.setItem('target_role', res.data.target_role || '')
      localStorage.setItem('skills', res.data.skills?.join(', ') || '')
      setLoading(false)
    }).catch(() => {
      localStorage.clear()
      navigate('/')
    })
  }, [])

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  )

  const resumeDone = user?.resume_uploaded
  const skillGapUnlocked = resumeDone
  const roadmapUnlocked = user?.skill_gap_done
  const quizUnlocked = user?.roadmap_done
  const interviewUnlocked = quizUnlocked && user?.quiz_score >= 60
  const readinessUnlocked = user?.interview_score > 0

  const steps = [resumeDone, user?.skill_gap_done, user?.roadmap_done, user?.quiz_score > 0, user?.interview_score > 0]
  const progress = Math.round((steps.filter(Boolean).length / steps.length) * 100)

  const readiness = user?.readiness_score || 0
  const readinessLabel =
    readiness >= 91 ? 'Industry Ready' :
    readiness >= 71 ? 'Job Ready' :
    readiness >= 41 ? 'Developing' : 'Beginner'
  const readinessColor =
    readiness >= 71 ? 'text-green-400' :
    readiness >= 41 ? 'text-amber-400' : 'text-red-400'

  const features = [
    {
      id: 'resume',
      icon: '📄',
      title: 'Resume Analyzer',
      desc: resumeDone ? `ATS Score: ${user.resume_score}%` : 'Upload your resume to begin',
      unlocked: true,
      done: resumeDone,
      lockedMsg: '',
      action: () => navigate('/resume'),
      btnText: resumeDone ? 'Re-analyze' : 'Upload Resume',
      color: 'violet'
    },
    {
      id: 'skillgap',
      icon: '🎯',
      title: 'Skill Gap Analyzer',
      desc: user?.skill_gap_done ? `Skill Match: ${user.skill_match}%` : 'Discover skills you need',
      unlocked: skillGapUnlocked,
      done: user?.skill_gap_done,
      lockedMsg: 'Upload your resume first',
      action: () => navigate('/skillgap'),
      btnText: user?.skill_gap_done ? 'Re-analyze' : 'Analyze Skills',
      color: 'blue'
    },
    {
      id: 'roadmap',
      icon: '🗺️',
      title: 'Learning Roadmap',
      desc: user?.roadmap_done ? 'Your roadmap is ready' : 'Get a personalized study plan',
      unlocked: roadmapUnlocked,
      done: user?.roadmap_done,
      lockedMsg: 'Complete skill gap analysis first',
      action: () => navigate('/roadmap'),
      btnText: user?.roadmap_done ? 'View Roadmap' : 'Generate Roadmap',
      color: 'emerald'
    },
    {
      id: 'quiz',
      icon: '📝',
      title: 'Topic Quiz',
      desc: user?.quiz_score > 0
        ? `Score: ${user.quiz_score}% ${user.quiz_score >= 60 ? '· Interview unlocked ✓' : '· Need 60% to unlock interview'}`
        : 'Test your knowledge (60% unlocks interview)',
      unlocked: quizUnlocked,
      done: user?.quiz_score > 0,
      lockedMsg: 'Generate your roadmap first',
      action: () => navigate('/quiz'),
      btnText: user?.quiz_score > 0 ? 'Retake Quiz' : 'Take Quiz',
      color: 'amber'
    },
    {
      id: 'interview',
      icon: '🎤',
      title: 'Mock Interview',
      desc: user?.interview_score > 0
        ? `Last Score: ${user.interview_score}%`
        : 'AI-powered interview practice',
      unlocked: interviewUnlocked,
      done: user?.interview_score > 0,
      lockedMsg: quizUnlocked
        ? `Quiz score must be ≥ 60% (yours: ${user?.quiz_score || 0}%)`
        : 'Complete the quiz first',
      action: () => navigate('/interview'),
      btnText: user?.interview_score > 0 ? 'Retake Interview' : 'Start Interview',
      color: 'pink'
    },
    {
      id: 'jobmatch',
      icon: '💼',
      title: 'Job Match Analyzer',
      desc: 'Paste any job description to see your match %',
      unlocked: true,
      done: false,
      lockedMsg: '',
      action: () => navigate('/jobmatch'),
      btnText: 'Analyze Job',
      color: 'violet'
    },
  ]

  const colorMap = {
    violet: 'border-violet-500/40 bg-violet-500/5',
    blue: 'border-blue-500/40 bg-blue-500/5',
    emerald: 'border-emerald-500/40 bg-emerald-500/5',
    amber: 'border-amber-500/40 bg-amber-500/5',
    pink: 'border-pink-500/40 bg-pink-500/5',
  }

  const btnColorMap = {
    violet: 'bg-violet-600 hover:bg-violet-500',
    blue: 'bg-blue-600 hover:bg-blue-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-500',
    amber: 'bg-amber-600 hover:bg-amber-500',
    pink: 'bg-pink-600 hover:bg-pink-500',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Navbar */}
      <nav className="border-b border-white/5 px-8 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-[#0a0a0f]/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-xs font-bold">CP</div>
          <span className="text-lg font-bold text-white">CareerPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">
              {name?.charAt(0).toUpperCase()}
            </div>
            {name}
          </button>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-violet-400">{name}</span> 👋
          </h1>
          <p className="text-gray-400">
            Target Role: <span className="text-white font-medium">{user?.target_role || '—'}</span>
            {user?.experience_level && <span className="text-gray-500"> · {user.experience_level}</span>}
            {user?.domain && <span className="text-gray-500"> · {user.domain}</span>}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Resume Score', value: user?.resume_score ? `${user.resume_score}%` : '—', color: 'text-violet-400' },
            { label: 'Skill Match', value: user?.skill_match ? `${user.skill_match}%` : '—', color: 'text-blue-400' },
            { label: 'Quiz Score', value: user?.quiz_score ? `${user.quiz_score}%` : '—', color: 'text-amber-400' },
            { label: 'Interview Score', value: user?.interview_score ? `${user.interview_score}%` : '—', color: 'text-pink-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-300">Career Journey</p>
            <p className="text-sm font-bold text-violet-400">{progress}% Complete</p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
            <div
              className="bg-gradient-to-r from-violet-500 to-blue-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between">
            {['Resume', 'Skill Gap', 'Roadmap', 'Quiz', 'Interview'].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${steps[i] ? 'bg-violet-400' : 'bg-white/20'}`} />
                <span className={`text-xs ${steps[i] ? 'text-violet-400' : 'text-gray-600'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Score */}
        {readinessUnlocked && readiness > 0 && (
          <div className="bg-gradient-to-r from-violet-900/30 to-blue-900/30 border border-violet-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Career Readiness Score</p>
                <p className={`text-5xl font-bold ${readinessColor}`}>{readiness}%</p>
                <p className={`text-sm mt-1 ${readinessColor}`}>{readinessLabel}</p>
              </div>
              <div className="text-right text-sm space-y-1">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-gray-500 text-xs">Resume</span>
                  <span className="text-white font-medium w-12 text-right">{user?.resume_score || 0}%</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-gray-500 text-xs">Skill Match</span>
                  <span className="text-white font-medium w-12 text-right">{user?.skill_match || 0}%</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-gray-500 text-xs">Quiz</span>
                  <span className="text-white font-medium w-12 text-right">{user?.quiz_score || 0}%</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-gray-500 text-xs">Interview</span>
                  <span className="text-white font-medium w-12 text-right">{user?.interview_score || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.id}
              className={`rounded-2xl p-6 border transition-all ${
                f.unlocked
                  ? `${colorMap[f.color]} hover:border-opacity-70`
                  : 'border-white/5 bg-white/2 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  f.unlocked ? 'bg-white/10' : 'bg-white/5'
                }`}>
                  {f.unlocked ? f.icon : '🔒'}
                </div>
                {f.done && (
                  <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                    ✓ Completed
                  </span>
                )}
              </div>
              <h3 className={`font-semibold text-base mb-1 ${!f.unlocked ? 'text-gray-600' : 'text-white'}`}>
                {f.title}
              </h3>
              <p className={`text-sm mb-5 leading-relaxed ${!f.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                {f.unlocked ? f.desc : f.lockedMsg}
              </p>
              <button
                onClick={() => f.unlocked ? f.action() : alert(f.lockedMsg)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  f.unlocked
                    ? `${btnColorMap[f.color]} text-white`
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                {f.unlocked ? `${f.btnText} →` : 'Locked'}
              </button>
            </div>
          ))}

          {/* Profile Card */}
          <div className="rounded-2xl p-6 border border-white/8 bg-white/3 hover:border-white/15 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">👤</div>
            </div>
            <h3 className="font-semibold text-base mb-1 text-white">Your Profile</h3>
            <p className="text-sm mb-5 text-gray-400 leading-relaxed">View and edit your career information</p>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 text-white transition-all"
            >
              View Profile →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}