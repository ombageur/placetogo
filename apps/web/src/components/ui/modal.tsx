'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Modal berbasis <dialog> native: showModal() memberi jebakan fokus, penutupan dengan Esc,
 * dan membuat latar inert tanpa pustaka tambahan. Fokus kembali ke pemicu saat ditutup.
 * Mobile tampil sebagai bottom sheet, tablet ke atas di tengah.
 */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(e) => {
        // Klik pada area backdrop (elemen dialog itu sendiri) menutup modal.
        if (e.target === ref.current) ref.current?.close();
      }}
      className={cn(
        'fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-background p-0 text-foreground shadow-modal backdrop:bg-black/50',
        'md:inset-auto md:m-auto md:w-full md:max-w-md md:rounded-3xl',
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-primary">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => ref.current?.close()}
            className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-mint"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {description && (
          <p id={descId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {children}
        {footer && <div className="flex flex-col gap-2 pt-1">{footer}</div>}
      </div>
    </dialog>
  );
}
