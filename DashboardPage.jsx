import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Beaker, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { projectService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const statusConfig = {
  draft: { label: 'مسودة', color: 'text-lab-steel', icon: Clock },
  planning: { label: 'قيد التخطيط', color: 'text-signal-cyan', icon: Beaker },
  training: { label: 'قيد التدريب', color: 'text-signal-amber', icon: Loader2 },
  completed: { label: 'مكتمل', color: 'text-signal-phosphor', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'text-signal-crimson', icon: XCircle },
  archived: { label: 'مؤرشف', color: 'text-lab-steel', icon: Clock },
}

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    projectService
      .list()
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <p className="label-eyebrow mb-2">لوحة التحكم</p>
        <h1 className="font-display text-2xl font-semibold">
          أهلًا، {user?.full_name?.split(' ')[0] || user?.email}
        </h1>
        <p className="text-lab-mist text-sm mt-1">
          لديك {projects.length} {projects.length === 1 ? 'مشروع' : 'مشاريع'}
        </p>
      </div>

      {loading && <p className="text-lab-steel text-sm font-mono">جارٍ التحميل...</p>}

      {!loading && projects.length === 0 && (
        <div className="panel p-12 text-center">
          <Beaker className="w-10 h-10 text-lab-steel mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="font-display text-lab-paper mb-2">لا توجد مشاريع بعد</h3>
          <p className="text-sm text-lab-steel mb-6">ابدأ بإنشاء أول مشروع تدريب لك</p>
          <Link to="/projects/new" className="btn-primary inline-block">
            إنشاء مشروع جديد
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const status = statusConfig[project.status] || statusConfig.draft
          const StatusIcon = status.icon
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="panel p-5 hover:border-signal-phosphor/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-medium text-lab-paper group-hover:text-signal-phosphor transition-colors">
                  {project.name}
                </h3>
                <div className={`flex items-center gap-1.5 text-xs font-mono ${status.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>
              <p className="text-sm text-lab-mist line-clamp-2 mb-3">
                {project.description || 'بدون وصف'}
              </p>
              <div className="flex items-center gap-2 text-xs text-lab-steel font-mono">
                <span>{project.project_type}</span>
                {project.base_model_id && (
                  <>
                    <span>·</span>
                    <span className="truncate">{project.base_model_id}</span>
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
