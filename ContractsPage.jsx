import { useEffect, useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { contractService } from '../services/api'

const statusLabels = {
  draft: 'مسودة',
  sent: 'مُرسل',
  negotiating: 'قيد التفاوض',
  signed: 'موقّع',
  active: 'نشط',
  completed: 'مكتمل',
  cancelled: 'ملغى',
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    contact_email: '',
    contact_person: '',
    scope_of_work: '',
    total_value: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContracts()
  }, [])

  function loadContracts() {
    contractService.list().then((res) => setContracts(res.data))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await contractService.create({
        ...form,
        total_value: form.total_value ? parseFloat(form.total_value) : null,
      })
      setShowForm(false)
      setForm({ company_name: '', contact_email: '', contact_person: '', scope_of_work: '', total_value: '' })
      loadContracts()
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateInvoice(id) {
    const res = await contractService.generateInvoice(id)
    if (res.data.invoice_url) {
      window.open(res.data.invoice_url, '_blank')
    }
    loadContracts()
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="label-eyebrow mb-2">عقود الشركات</p>
          <h1 className="font-display text-2xl font-semibold">إدارة العقود مع الشركات الكبرى</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          عقد جديد
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="panel p-6 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">اسم الشركة</label>
              <input
                required
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">بريد جهة الاتصال</label>
              <input
                type="email"
                required
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-lab-mist block mb-1.5">نطاق العمل</label>
            <textarea
              value={form.scope_of_work}
              onChange={(e) => setForm((f) => ({ ...f, scope_of_work: e.target.value }))}
              className="input-field w-full h-20 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-lab-mist block mb-1.5">قيمة العقد بالدولار</label>
            <input
              type="number"
              value={form.total_value}
              onChange={(e) => setForm((f) => ({ ...f, total_value: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء العقد'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {contracts.map((c) => (
          <div key={c.id} className="panel p-5 flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium">{c.company_name}</h3>
              <p className="text-xs text-lab-steel font-mono">
                {statusLabels[c.status]} · {c.contact_email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {c.total_value && (
                <span className="text-signal-phosphor font-mono text-sm">
                  ${Number(c.total_value).toLocaleString()}
                </span>
              )}
              <button
                onClick={() => handleGenerateInvoice(c.id)}
                className="btn-ghost text-xs flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                توليد فاتورة
              </button>
            </div>
          </div>
        ))}
        {contracts.length === 0 && !showForm && (
          <p className="text-sm text-lab-steel text-center py-12">لا توجد عقود بعد</p>
        )}
      </div>
    </div>
  )
}
