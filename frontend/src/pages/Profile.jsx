import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    target_role: '',
    experience_level: '',
    domain: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setUser(res.data)
      setForm({
        target_role: res.data.target_role || '',
        experience_level: res.data.experience_level || '',
        domain: res.data.domain || ''
      })
      setLoading(false)
    }).catch(() => {
      localStorage.clear()
      navigate('/')
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    try {
      const res = await api.put('/auth/update-profile', form)
      if (res.data.role_changed) {
        setSuccess('⚠️ Target role changed — your skill gap, roadmap and interview progress has been reset. Please redo them for your new role.')
      } else {
        setSuccess('✓ Profile updated successfully.')
      }
      localStorage.setItem('target_role', form.target_role)
      const updated = await api.get('/auth/me')
      setUser(updated.data)
      setEditing(false)
    } catch (err) {
      setSuccess('Failed to update. Try again.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Loading profile...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-violet-400">CareerPilot</h1>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </button>
      </div>

      <div className="px-8 py-10 max-w-2xl">
        <h2 className="text-3xl font-bold mb-8">Your Profile</h2>

        {success && (
          <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${
            success.includes('⚠️') ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
            success.includes('✓') ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
            'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {success}
          </div>
        )}

        {/* Avatar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold">{user.name}</h3>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Career Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-300">Career Info</h4>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-lg text-sm">
                ⚠️ Changing your target role will reset your skill gap, roadmap and interview progress.
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Target Role</label>
                <input
                  type="text"
                  value={form.target_role}
                  onChange={e => setForm({...form, target_role: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <button
                      key={level}
                      onClick={() => setForm({...form, experience_level: level})}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.experience_level === level
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Domain</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Web Development', 'Data Science', 'DevOps', 'Mobile Dev', 'AI/ML', 'Cybersecurity'].map(d => (
                    <button
                      key={d}
                      onClick={() => setForm({...form, domain: d})}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.domain === d
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white py-3 rounded-lg transition-colors text-sm font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white py-3 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm">Target Role</span>
                <span className="text-white font-medium">{user.target_role || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm">Experience Level</span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  user.experience_level === 'Beginner' ? 'bg-blue-500/20 text-blue-400' :
                  user.experience_level === 'Intermediate' ? 'bg-amber-500/20 text-amber-400' :
                  user.experience_level === 'Advanced' ? 'bg-green-500/20 text-green-400' :
                  'text-gray-400'
                }`}>
                  {user.experience_level || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm">Domain</span>
                <span className="text-white font-medium">{user.domain || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm">Resume</span>
                <span className={`text-sm font-medium ${user.resume_uploaded ? 'text-green-400' : 'text-gray-500'}`}>
                  {user.resume_uploaded ? '✓ Uploaded' : 'Not uploaded'}
                </span>
              </div>
              {user.resume_score > 0 && (
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <span className="text-gray-400 text-sm">Resume ATS Score</span>
                  <span className={`text-sm font-bold ${
                    user.resume_score >= 70 ? 'text-green-400' :
                    user.resume_score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {user.resume_score}%
                  </span>
                </div>
              )}
              {user.readiness_score > 0 && (
                <div className="flex justify-between items-center pb-3">
                  <span className="text-gray-400 text-sm">Career Readiness</span>
                  <span className={`text-sm font-bold ${
                    user.readiness_score >= 71 ? 'text-green-400' :
                    user.readiness_score >= 41 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {user.readiness_score}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h4 className="font-semibold text-gray-300 mb-4">Your Skills</h4>
          {user.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s, i) => (
                <span key={i} className="bg-violet-500/10 border border-violet-500/30 text-violet-400 px-3 py-1 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Upload your resume to extract skills automatically</p>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => { localStorage.clear(); navigate('/') }}
          className="w-full border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 py-3 rounded-lg transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  )
}