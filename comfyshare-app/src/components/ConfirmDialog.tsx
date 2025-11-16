'use client'

import { ReactNode, useState } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmClassName?: string
  onConfirm: () => void | Promise<void>
  children: (props: { open: () => void }) => ReactNode
}

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmClassName = 'bg-red-600 text-white hover:bg-red-700',
  onConfirm,
  children,
}: ConfirmDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } catch (error) {
      console.error('Error during confirmation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {children({ open: () => setIsOpen(true) })}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
            <p className="mt-3 text-neutral-600">{message}</p>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className={`rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 ${confirmClassName}`}
              >
                {isProcessing ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
