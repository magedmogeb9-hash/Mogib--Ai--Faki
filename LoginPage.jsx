import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-10">
          <FlaskConical className="w-6 h-6 text-signal-phosphor" strokeWidth={1.5} />
          <span className="font-display font-semibold text-lg">المختبر</span>
        </Link>

        <div className="panel p-8">
          <h1 className="font-display text-xl font-semibold mb-1">تسجيل الدخول</h1>
          <p className="text-sm text-lab-steel mb-6">أهلًا بعودتك إلى المختبر</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-signal-crimson text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'جارٍ الدخول...' : 'دخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-lab-steel mt-6">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-signal-phosphor hover:underline">
            أنشئ حسابًا
          </Link>
        </p>
      </div>
    </div>
  )
}
