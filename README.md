# المختبر — منصة تخطيط وتدريب نماذج الذكاء الاصطناعي

منصة SaaS متكاملة لتخطيط، إدارة، وتنفيذ تدريب نماذج الذكاء الاصطناعي، مع تكامل مباشر مع GitHub، ودعم دفع عالمي عبر Stripe وPayPal، وإدارة عقود مع الشركات الكبرى.

## نقطة مهمة بخصوص مفاتيح API

**لا يوجد "مفتاح API مفتوح المصدر مجاني وغير مقيد" لتدريب النماذج التجارية (Claude, GPT...) — هذا غير موجود في الواقع.**
بدلًا من ذلك، صُممت هذه المنصة على أساسين:

1. **التدريب المحلي المجاني الفعلي**: عبر مكتبات Hugging Face مفتوحة المصدر بالكامل (transformers, peft, datasets) — يعمل على عتادك الخاص (GPU/CPU) دون أي اشتراك أو مفتاح مدفوع.
2. **مفاتيح اختيارية يربطها كل مستخدم بنفسه**: إن أراد أحد المستخدمين تخطيطًا أذكى عبر Claude أو OpenAI، يربط مفتاحه الخاص من صفحة الإعدادات. المنصة لا تأتي بمفتاح مشترك لأن ذلك تقنيًا وماليًا غير قابل للاستمرار.

## البنية التقنية

```
ai-training-platform/
├── backend/          FastAPI + PostgreSQL + Celery + Redis
├── frontend/         React + Vite + Tailwind CSS
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### الباك إند (FastAPI)
- مصادقة JWT كاملة (تسجيل، دخول، تجديد توكن)
- إدارة مشاريع وخطط تدريب
- محرك تخطيط ذكي (قاعدة معرفية محلية + تكامل اختياري مع Claude)
- تنفيذ تدريب فعلي عبر Hugging Face (LoRA/PEFT لتقليل استهلاك الموارد)
- مهام خلفية عبر Celery (لا تحجب الـ API أثناء التدريب الطويل)
- تكامل GitHub لرفع المشاريع تلقائيًا
- دفع عبر Stripe (يدعم كل البطاقات العالمية + Apple Pay + Google Pay) وPayPal
- إدارة عقود الشركات مع توليد فواتير Stripe رسمية

### الفرونت إند (React + Vite)
- واجهة عربية كاملة RTL بطابع "مختبر" مظلم
- لوحة تحكم، صفحة مشروع تفاعلية، إعدادات، فوترة، عقود

## التشغيل المحلي السريع

### عبر Docker (الطريقة الموصى بها)

```bash
cp backend/.env.example backend/.env
# عدّل القيم الضرورية في backend/.env (على الأقل SECRET_KEY)

docker compose up --build
```

- الواجهة: http://localhost:3000
- توثيق API: http://localhost:8000/docs

### تشغيل يدوي بدون Docker

**الباك إند:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # على Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# شغّل PostgreSQL وRedis محليًا أو عبر Docker منفصل
uvicorn app.main:app --reload
```

**عامل Celery (لتشغيل مهام التدريب الخلفية):**
```bash
celery -A app.core.celery_app worker --loglevel=info
```

**الفرونت إند:**
```bash
cd frontend
npm install
npm run dev
```

## متغيرات البيئة الأساسية

راجع `backend/.env.example` للقائمة الكاملة. الأهم:

| المتغير | مطلوب؟ | الوصف |
|---|---|---|
| `SECRET_KEY` | نعم | مفتاح تشفير JWT والبيانات الحساسة |
| `DATABASE_URL` | نعم | اتصال PostgreSQL |
| `STRIPE_SECRET_KEY` | للدفع فقط | من لوحة تحكم Stripe |
| `ANTHROPIC_API_KEY` | لا | اختياري — للتخطيط المركزي فقط، المستخدمون يربطون مفاتيحهم بأنفسهم عادة |

## الرفع التلقائي إلى GitHub

كل مستخدم يربط توكن GitHub شخصي (Personal Access Token) من صفحة الإعدادات. عند الرفع، تُنشئ المنصة مستودعًا جديدًا (أو تحدّث موجودًا) باسم اختاره المستخدم، وتدفع إليه:
- `README.md` يوصف المشروع
- `training_plan.json` بخطة التدريب الكاملة
- ملفات النموذج المدرّب (للملفات الكبيرة، يُنصح باستخدام Git LFS أو تخزين S3 خارجي)

## الدفع

- **Stripe**: اشتراكات شهرية (Pro/Enterprise) عبر Checkout، وفواتير دفعة واحدة للعقود الكبرى.
- **PayPal**: مسار بديل لإنشاء وتحصيل طلبات دفع لمن يفضّل عدم استخدام بطاقة ائتمان مباشرة.

## القيود الحالية وخطوات الإنتاج التالية

- [ ] إضافة اختبارات شاملة (pytest) لكل مسارات API
- [ ] تفعيل Alembic migrations بدل `create_all` التلقائي
- [ ] إضافة تخزين S3 لملفات النماذج الكبيرة بدل التخزين المحلي فقط
- [ ] طبقة مراقبة (Sentry/Prometheus) للإنتاج
- [ ] قوائم انتظار GPU مخصصة لمهام Celery الثقيلة (worker queues منفصلة)
