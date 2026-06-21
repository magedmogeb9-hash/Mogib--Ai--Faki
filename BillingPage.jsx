import { useState } from 'react'
import { Check } from 'lucide-react'
import { paymentService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const plans = [
  {
    id: 'free',
    name: 'مجاني',
    price: '0',
    features: ['تدريب محلي غير محدود', 'مشاريع غير محدودة', 'رفع GitHub بتوكنك الخاص', 'دعم عبر المجتمع'],
  },
  {
    id: 'pro',
    name: 'احترافي',
    price: '49',
    features: ['كل مزايا المجاني', 'تخزين سحابي 100GB', 'أولوية في طابور التدريب', 'دعم فني مباشر'],
  },
  {
    id: 'enterprise',
    name: 'مؤسسات',
    price: '499',
    features: ['كل مزايا الاحترافي', 'عقود وفوترة مخصصة', 'SLA مضمون', 'مدير حساب مخصص'],
  },
]

export default function BillingPage() {
  const [loading, setLoading] = useState(null)
  const { user } = useAuth()

  async function handleSubscribe(planId) {
    if (planId === 'free') return
    setLoading(planId)
    try {
      const res = await paymentService.createStripeCheckout({
        plan: planId,
        success_url: window.location.origin + '/billing?success=true',
        cancel_url: window.location.origin + '/billing',
      })
      window.location.href = res.data.checkout_url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <p className="label-eyebrow mb-2">الفوترة</p>
      <h1 className="font-display text-2xl font-semibold mb-2">خطط الاشتراك</h1>
      <p className="text-lab-mist text-sm mb-8">الدفع آمن عبر Stripe — يدعم كل البطاقات العالمية وApple Pay وGoogle Pay</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = user?.subscription_plan === plan.id
          return (
            <div
              key={plan.id}
              className={`panel p-6 ${plan.id === 'pro' ? 'border-signal-phosphor/40' : ''}`}
            >
              <h3 className="font-display font-medium mb-1">{plan.name}</h3>
              <p className="text-2xl font-display font-semibold mb-4">
                ${plan.price}
                <span className="text-sm text-lab-steel font-body">/شهريًا</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-lab-mist">
                    <Check className="w-4 h-4 text-signal-phosphor shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || loading === plan.id}
                className={isCurrent ? 'btn-ghost w-full' : 'btn-primary w-full'}
              >
                {isCurrent ? 'خطتك الحالية' : loading === plan.id ? 'جارٍ التحويل...' : 'اشترك الآن'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
