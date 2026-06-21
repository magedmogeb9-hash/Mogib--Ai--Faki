import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../services/api'

const projectTypes = [
  { value: 'fine_tune', label: 'ضبط دقيق لنموذج موجود (Fine-tune)' },
  { value: 'from_scratch', label: 'تدريب من الصفر' },
  { value: 'lora_peft', label: 'تدريب خفيف LoRA/PEFT' },
  { value: 'rag_pipeline', label: 'نظام استرجاع معزز RAG' },
  { value: 'data_synthesis', label: 'توليد بيانات تدريب صناعية' },
]

export default function NewProjectPage() {
  const [form, setForm] = useState({ name: '', description: '', project_type: 'lora_peft' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await projectService.create(form)
      navigate(`/projects/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'تعذّر إنشاء المشروع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <p className="label-eyebrow mb-2">مشروع جديد</p>
      <h1 className="font-display text-2xl font-semibold mb-8">إنشاء مشروع تدريب</h1>

      <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
        <div>
          <label className="text-xs text-lab-mist block mb-1.5">اسم المشروع</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="input-field w-full"
            placeholder="مثال: مصنّف المراجعات العربية"
          />
        </div>

        <div>
          <label className="text-xs text-lab-mist block mb-1.5">الوصف</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="input-field w-full h-24 resize-none"
            placeholder="صف هدف المشروع باختصار..."
          />
        </div>

        <div>
          <label className="text-xs text-lab-mist block mb-1.5">نوع المشروع</label>
          <select
            value={form.project_type}
            onChange={(e) => update('project_type', e.target.value)}
            className="input-field w-full"
          >
            {projectTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-signal-crimson text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء المشروع ومتابعة التخطيط'}
        </button>
      </form>
    </div>
  )
}
