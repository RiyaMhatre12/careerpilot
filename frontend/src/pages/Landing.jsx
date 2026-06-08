import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-violet-400">CareerPilot</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-sm bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm px-4 py-1 rounded-full mb-6">
          AI-Powered Career Platform
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Launch Your Career<br />
          <span className="text-violet-400">With AI Guidance</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          CareerPilot helps you build resumes, identify skill gaps, generate learning roadmaps, and prepare for interviews — all in one place.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Start for Free
          </button>
          <button
            onClick={() => navigate('/login')}
            className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to get placed</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📄', title: 'Resume Analyzer', desc: 'Get ATS score and AI suggestions to improve your resume instantly.' },
            { icon: '🎯', title: 'Skill Gap Analyzer', desc: 'Compare your skills with industry requirements for your target role.' },
            { icon: '🗺️', title: 'AI Roadmap', desc: 'Get a personalized step-by-step learning path to reach your goal.' },
            { icon: '💼', title: 'Portfolio Generator', desc: 'Auto-generate a professional portfolio website from your resume.' },
            { icon: '🎤', title: 'Mock Interview', desc: 'Practice with AI-generated questions and get instant feedback.' },
            { icon: '💡', title: 'Job Recommendations', desc: 'Get matched with jobs and internships based on your profile.' },
          ].map((f, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-800 py-16">
        <div className="flex flex-col md:flex-row justify-center gap-16 text-center">
          {[
            { number: '10+', label: 'AI Features' },
            { number: '100%', label: 'Free to Use' },
            { number: '24/7', label: 'AI Available' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-bold text-violet-400">{s.number}</p>
              <p className="text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-8 py-6 text-center text-gray-500 text-sm">
        © 2025 CareerPilot. Built with AI for students.
      </div>
    </div>
  )
}