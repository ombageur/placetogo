'use client';

import * as React from 'react';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}
interface ToastContextValue {
  toast: (t: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);
const DURATION_MS = 6000;
const MAX_VISIBLE = 3;

const ICONS = { success: CircleCheck, error: TriangleAlert, info: Info, warning: TriangleAlert } as const;
const TONES: Record<ToastVariant, string> = {
  success: 'border-primary bg-mint text-primary',
  error: 'border-danger bg-danger-soft text-danger-soft-foreground',
  info: 'border-info-soft-foreground bg-info-soft text-info-soft-foreground',
  warning: 'border-amber-400 bg-amber-50 text-amber-900',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(1);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue['toast']>(
    ({ title, description, variant = 'info' }) => {
      const id = nextId.current++;
      setItems((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, title, description, variant }]);
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION_MS));
    },
    [dismiss],
  );

  React.useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Wilayah live: galat diumumkan tegas (alert), lainnya sopan (status). */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-4 md:right-4 md:top-auto md:items-end">
        {items.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3 shadow-modal',
                TONES[t.variant],
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="text-sm">{t.description}</p>}
              </div>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => dismiss(t.id)}
                className="-m-1.5 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-background/60"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  return ctx;
}
