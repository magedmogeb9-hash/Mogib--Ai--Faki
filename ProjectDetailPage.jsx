import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles, Play, Github, Download, Loader2 } from 'lucide-react'
import { projectService, trainingJobService, githubService } from '../services/api'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [jobs, setJobs] = useState([])
  const [planForm, setPlanForm] = useState({
    goal_description: '',
    dataset_description: '',
    available_gpu: '',
    budget_usd: '',
  })
  const [planLoading, setPlanLoading] = useState(false)
  const [trainLoading, setTrainLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProject()
    loadJobs()
  }, [id])

  function loadProject() {
    projectService.get(id).then((res) => setProject(res.data))
  }

  function loadJobs() {
    trainingJobService.list().then((res) => {
      setJobs(res.data.filter((j) => j.project_id === id))
    })
  }

  async function handleGeneratePlan(e) {
    e.preventDefault()
    setPlanLoading(true)
    try {
      const payload = {
        ...planForm,
        budget_usd: planForm.budget_usd ? parseFloat(planForm.budget_usd) : null,
      }
      const res = await projectService.generatePlan(id, payload)
      setProject(res.data)
      setMessage('تم توليد خطة التدريب بنجاح')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'تعذّر توليد الخطة')
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleStartTraining() {
    setTrainLoading(true)
    try {
      await trainingJobService.create({
        project_id: id,
        provider: 'huggingface_local',
        hyperparameters: {},
      })
      setMessage('تم إطلاق مهمة التدريب — تابع التقدّم أدناه')
      loadJobs()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'تعذّر بدء التدريب')
    } finally {
      setTrainLoading(false)
    }
  }

  async function handlePushToGithub() {
    if (!repoName) {
      setMessage('يرجى إدخال اسم المستودع أولًا')
      return
    }
    setGithubLoading(true)
    try {
      await githubService.push({ project_id: id, repo_name: repoName, private: true })
      setMessage('تم بدء عملية الرفع إلى GitHub')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'تعذّر الرفع إلى GitHub')
    } finally {
      setGithubLoading(false)
    }
  }

  if (!project) return <div className="px-8 py-10 text-lab-steel font-mono text-sm">جارٍ التحميل...</div>

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">
      <div>
        <p className="label-eyebrow mb-2">{project.project_type}</p>
        <h1 className="font-display text-2xl font-semibold mb-2">{project.name}</h1>
        <p className="text-lab-mist text-sm">{project.description}</p>
      </div>

      {message && (
        <div className="panel p-3 text-sm text-signal-cyan border-signal-cyan/30">{message}</div>
      )}

      {/* قسم توليد خطة التدريب */}
      <section className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-signal-phosphor" />
          <h2 className="font-display font-medium">خطة التدريب الذكية</h2>
        </div>

        {!project.training_plan ? (
          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div>
              <label className="text-xs text-lab-mist block mb-1.5">صف هدف النموذج</label>
              <textarea
                required
                value={planForm.goal_description}
                onChange={(e) => setPlanForm((f) => ({ ...f, goal_description: e.target.value }))}
                className="input-field w-full h-20 resize-none"
                placeholder="مثال: نموذج لتصنيف المراجعات العربية إلى إيجابي/سلبي"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-lab-mist block mb-1.5">نوع GPU المتاح</label>
                <input
                  value={planForm.available_gpu}
                  onChange={(e) => setPlanForm((f) => ({ ...f, available_gpu: e.target.value }))}
                  className="input-field w-full"
                  placeholder="مثال: RTX 4090"
                />
              </div>
              <div>
                <label className="text-xs text-lab-mist block mb-1.5">الميزانية بالدولار (اختياري)</label>
                <input
                  type="number"
                  value={planForm.budget_usd}
                  onChange={(e) => setPlanForm((f) => ({ ...f, budget_usd: e.target.value }))}
                  className="input-field w-full"
                  placeholder="100"
                />
              </div>
            </div>
            <button type="submit" disabled={planLoading} className="btn-primary flex items-center gap-2">
              {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              توليد خطة التدريب
            </button>
          </form>
        ) : (
          <TrainingPlanView plan={project.training_plan} />
        )}
      </section>

      {/* قسم بدء التدريب */}
      {project.training_plan && (
        <section className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-signal-phosphor" />
              <h2 className="font-display font-medium">تشغيل التدريب</h2>
            </div>
            <button onClick={handleStartTraining} disabled={trainLoading} className="btn-primary text-sm">
              {trainLoading ? 'جارٍ الإطلاق...' : 'بدء تدريب جديد'}
            </button>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 && <p className="text-sm text-lab-steel">لا توجد مهام تدريب بعد</p>}
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* قسم رفع GitHub */}
      <section className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Github className="w-4 h-4 text-signal-phosphor" />
          <h2 className="font-display font-medium">رفع المشروع إلى GitHub</h2>
        </div>
        {project.github_repo_url ? (
          <a
            href={project.github_repo_url}
            target="_blank"
            rel="noreferrer"
            className="text-signal-cyan text-sm hover:underline"
          >
            {project.github_repo_url}
          </a>
        ) : (
          <div className="flex gap-3">
            <input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="input-field flex-1"
              placeholder="اسم المستودع، مثال: my-arabic-classifier"
            />
            <button onClick={handlePushToGithub} disabled={githubLoading} className="btn-ghost whitespace-nowrap">
              {githubLoading ? 'جارٍ الرفع...' : 'رفع الآن'}
            </button>
          </div>
        )}
        <p className="text-xs text-lab-steel mt-3">
          يتطلب ربط توكن GitHub الخاص بك من صفحة الإعدادات أولًا.
        </p>
      </section>
    </div>
  )
}

function TrainingPlanView({ plan }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-lab-void rounded-md p-3">
          <p className="text-xs text-lab-steel mb-1">النهج</p>
          <p className="text-lab-paper font-mono">{plan.approach}</p>
        </div>
        <div className="bg-lab-void rounded-md p-3">
          <p className="text-xs text-lab-steel mb-1">ساعات GPU المقدّرة</p>
          <p className="text-lab-paper font-mono">{plan.estimated_gpu_hours}</p>
        </div>
        <div className="bg-lab-void rounded-md p-3">
          <p className="text-xs text-lab-steel mb-1">التكلفة التقديرية</p>
          <p className="text-signal-phosphor font-mono">${plan.estimated_cost_usd}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-lab-mist mb-2">النماذج الأساسية المقترحة</p>
        <div className="flex flex-wrap gap-2">
          {plan.recommended_base_models?.map((m) => (
            <span key={m} className="text-xs font-mono bg-lab-void border border-lab-edge px-2 py-1 rounded">
              {m}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-lab-mist mb-2">خطوات التنفيذ</p>
        <ol className="space-y-2">
          {plan.steps?.map((step) => (
            <li key={step.order} className="flex gap-3 text-sm">
              <span className="text-signal-phosphor font-mono">{String(step.order).padStart(2, '0')}</span>
              <div>
                <p className="text-lab-paper">{step.title}</p>
                <p className="text-lab-steel text-xs">{step.details}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {plan.notes && <p className="text-xs text-lab-steel italic border-t border-lab-edge pt-3">{plan.notes}</p>}
    </div>
  )
}

const jobStatusLabels = {
  queued: 'بانتظار التنفيذ',
  running: 'قيد التنفيذ',
  succeeded: 'اكتمل بنجاح',
  failed: 'فشل',
  cancelled: 'أُلغي',
}

function JobRow({ job }) {
  return (
    <div className="flex items-center justify-between bg-lab-void rounded-md p-3">
      <div>
        <p className="text-sm text-lab-paper font-mono">{jobStatusLabels[job.status] || job.status}</p>
        <p className="text-xs text-lab-steel">التقدّم: {job.progress_percent}%</p>
      </div>
      {job.status === 'succeeded' && (
        <a href={trainingJobService.downloadUrl(job.id)} className="btn-ghost text-xs flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          تحميل النموذج
        </a>
      )}
    </div>
  )
}
