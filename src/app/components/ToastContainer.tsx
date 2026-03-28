import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { useToast, type ToastType } from '../context/ToastContext'

const iconMap: Record<ToastType, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

const colorMap: Record<ToastType, { bg: string; border: string; icon: string }> = {
  error: {
    bg: 'bg-red-50/90',
    border: 'border-red-200',
    icon: 'text-red-500',
  },
  success: {
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50/90',
    border: 'border-amber-200',
    icon: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50/90',
    border: 'border-blue-200',
    icon: 'text-blue-500',
  },
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        const colors = colorMap[toast.type]

        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-2.5 px-4 py-3 rounded-xl border
              backdrop-blur-md shadow-lg
              animate-[slideIn_0.25s_ease-out]
              ${colors.bg} ${colors.border}
            `}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors.icon}`} />
            <p className="text-sm text-gray-700 leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
