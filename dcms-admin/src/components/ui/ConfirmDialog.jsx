import { useEffect, useRef } from 'react'

const toneStyles = {
  primary: {
    button: 'bg-cyan-500 hover:bg-cyan-400 text-slate-900',
    badge: 'bg-cyan-100 text-cyan-700',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  danger: {
    button: 'bg-rose-600 hover:bg-rose-500 text-white',
    badge: 'bg-rose-100 text-rose-700',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  warning: {
    button: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    badge: 'bg-amber-100 text-amber-700',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
        <path d="M11.2 3.8L3.6 17a2 2 0 001.7 3h13.4a2 2 0 001.7-3L12.8 3.8a2 2 0 00-3.6 0z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef(null)
  const selectedTone = toneStyles[tone] || toneStyles.primary

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timeout = setTimeout(() => {
      confirmButtonRef.current?.focus()
    }, 40)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px] animate-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-dialog-card">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={[
              'inline-flex h-9 w-9 items-center justify-center rounded-full',
              selectedTone.badge,
            ].join(' ')}
          >
            {selectedTone.icon}
          </span>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold transition',
              selectedTone.button,
            ].join(' ')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
