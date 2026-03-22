import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const initialState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  tone: 'primary',
}

export const useConfirmDialog = () => {
  const resolverRef = useRef(null)
  const [dialogState, setDialogState] = useState(initialState)

  const closeDialog = (result) => {
    setDialogState(initialState)
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }

  const confirm = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    tone = 'primary',
  }) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      tone,
    })

    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }

  const confirmationDialog = (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      tone={dialogState.tone}
      onCancel={() => closeDialog(false)}
      onConfirm={() => closeDialog(true)}
    />
  )

  return { confirm, confirmationDialog }
}
