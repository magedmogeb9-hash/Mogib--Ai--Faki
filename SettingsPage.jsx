import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { userService } from '../services/api'

export default function SettingsPage() {
  const [status, setStatus] = useState(null)
  const [keys, setKeys] = useState({ anthropic_api_key: '', openai_api_key: '', github_token: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    userService.getApiKeysStatus().then((res) => setStatus(res.data))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await userService.updateApiKeys(keys)
      const res = await userService.getApiKeysStatus()
      setStatus(res.data)
      setKeys({ anthropic_api_key: '', openai_api_key: '', github_token: '' })
      setMessage('تم حفظ المفاتيح بنجاح')
    } catch {
      setMessage('تعذّر حفظ المفاتيح')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <p className="label-eyebrow mb-2">الإعدادات</p>
      <h1 className="font-display text-2xl font-semibold mb-2">مفاتيح API الخاصة بك</h1>
      <p className="text-lab-mist text-sm mb-8 leading-relaxed">
        المنصة تعمل بالكامل دون أي مفتاح مدفوع عبر التدريب المحلي المجاني. ربط مفاتيحك الخاصة هنا
        اختياري تمامًا، ويُستخدم فقط لتخصيص أعمق (تخطيط بمساعدة Claude) أو الرفع التلقائي لـ GitHub.
        كل مفتاح يُشفّر فور استلامه ولا يُعرض مجددًا في أي مكان.
      </p>

      {status && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatusBadge label="Anthropic" connected={status.anthropic_connected} />
          <StatusBadge label="OpenAI" connected={status.openai_connected} />
          <StatusBadge label="GitHub" connected={status.github_connected} />
        </div>
      )}

      <form onSubmit={handleSave} className="panel p-6 space-y-5">
        <div>
          <label className="text-xs text-lab-mist block mb-1.5">مفتاح Anthropic API (اختياري)</label>
          <input
            type="password"
            value={keys.anthropic_api_key}
            onChange={(e) => setKeys((k) => ({ ...k, anthropic_api_key: e.target.value }))}
            className="input-field w-full font-mono text-sm"
            placeholder="sk-ant-..."
          />
        </div>
        <div>
          <label className="text-xs text-lab-mist block mb-1.5">مفتاح OpenAI API (اختياري)</label>
          <input
            type="password"
            value={keys.openai_api_key}
            onChange={(e) => setKeys((k) => ({ ...k, openai_api_key: e.target.value }))}
            className="input-field w-full font-mono text-sm"
            placeholder="sk-..."
          />
        </div>
        <div>
          <label className="text-xs text-lab-mist block mb-1.5">توكن GitHub الشخصي (لرفع المشاريع)</label>
          <input
            type="password"
            value={keys.github_token}
            onChange={(e) => setKeys((k) => ({ ...k, github_token: e.target.value }))}
            className="input-field w-full font-mono text-sm"
            placeholder="ghp_..."
          />
        </div>

        {message && <p className="text-sm text-signal-cyan">{message}</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'جارٍ الحفظ...' : 'حفظ المفاتيح'}
        </button>
      </form>
    </div>
  )
}

function StatusBadge({ label, connected }) {
  return (
    <div className="panel p-3 flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {connected ? (
        <Check className="w-4 h-4 text-signal-phosphor" />
      ) : (
        <X className="w-4 h-4 text-lab-steel" />
      )}
    </div>
  )
}
