import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.register(form)
      await login({ email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'تعذّر إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-10">
          <FlaskConical className="w-6 h-6 text-signal-phosphor" strokeWidth={1.5} />
          <span className="font-display font-semibold text-lg">المختبر</span>
        </Link>

        <div className="panel p-8">
          <h1 className="font-display text-xl font-semibold mb-1">إنشاء حساب</h1>
          <p className="text-sm text-lab-steel mb-6">ابدأ مشروعك الأول مجانًا</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">الاسم الكامل</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">اسم الشركة (اختياري)</label>
              <input
                value={form.company_name}
                onChange={(e) => update('company_name', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">كلمة المرور</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-field w-full"
                placeholder="8 أحرف على الأقل"
              />
            </div>

            {error && <p className="text-signal-crimson text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-lab-steel mt-6">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-signal-phosphor hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
