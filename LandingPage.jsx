import { Link } from 'react-router-dom'
import { FlaskConical, ArrowLeft, Cpu, GitBranch, Building2, Zap } from 'lucide-react'

const features = [
  {
    icon: Cpu,
    title: 'تخطيط تلقائي بالذكاء الاصطناعي',
    desc: 'صف هدفك بجملة واحدة، والمحرك يقترح النموذج الأساسي، خطوات التدريب، والتكلفة التقديرية.',
  },
  {
    icon: Zap,
    title: 'تدريب محلي مجاني بالكامل',
    desc: 'يعمل عبر مكتبات Hugging Face مفتوحة المصدر دون أي اشتراك إجباري أو مفتاح مدفوع.',
  },
  {
    icon: GitBranch,
    title: 'رفع تلقائي إلى GitHub',
    desc: 'كل مشروع، خطة تدريب، وملف نموذج يُرفع مباشرة إلى مستودعك الخاص بتوكنك أنت.',
  },
  {
    icon: Building2,
    title: 'عقود وفوترة للشركات',
    desc: 'إدارة كاملة لدورة حياة العقد مع الشركات الكبرى، من العرض حتى الفاتورة الموقّعة.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-signal-phosphor" strokeWidth={1.5} />
          <span className="font-display font-semibold text-lg">المختبر</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-lab-mist hover:text-lab-paper transition-colors">
            تسجيل الدخول
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            ابدأ مجانًا
          </Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 label-eyebrow mb-6 px-3 py-1 border border-signal-phosphor/30 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-phosphor animate-pulse" />
          محرك تدريب مفتوح المصدر — لا اشتراك إجباري
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-semibold leading-tight mb-6">
          من فكرة إلى نموذج مدرّب،
          <br />
          <span className="text-signal-phosphor">بخطة واحدة واضحة.</span>
        </h1>
        <p className="text-lab-mist text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          صف هدفك، واحصل على خطة تدريب كاملة: النموذج الأساسي، الخطوات، التكلفة التقديرية.
          درّب محليًا مجانًا، أو اربط مفتاحك الخاص لتخصيص أعمق. ثم ارفع كل شيء إلى GitHub بنقرة واحدة.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary flex items-center gap-2">
            ابدأ مشروعك الأول
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-ghost">
            لدي حساب بالفعل
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="panel p-6 hover:border-signal-phosphor/40 transition-colors">
              <Icon className="w-5 h-5 text-signal-phosphor mb-4" strokeWidth={1.5} />
              <h3 className="font-display font-medium text-lab-paper mb-2">{title}</h3>
              <p className="text-sm text-lab-mist leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-lab-edge py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-lab-steel font-mono">
          المختبر — منصة تخطيط وتدريب نماذج الذكاء الاصطناعي
        </div>
      </footer>
    </div>
  )
}
