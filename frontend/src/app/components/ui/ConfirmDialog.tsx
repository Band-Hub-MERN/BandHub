interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#111113] p-6 shadow-2xl">
        <h3 className="text-[#FAFAFA] font-bold text-lg mb-2">{title}</h3>
        <p className="text-[#8A8A9A] text-sm mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-white/[0.12] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20 text-sm font-semibold transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              danger
                ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                : 'bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
