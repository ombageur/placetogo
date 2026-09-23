import * as React from 'react';
import { Inbox, TriangleAlert } from 'lucide-react';
import { Button } from './button';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-mint px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-background text-primary" aria-hidden="true">
        {icon ?? <Inbox className="size-7" />}
      </div>
      <h2 className="text-primary">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  description = 'Coba lagi beberapa saat lagi.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-danger-soft px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-background text-danger" aria-hidden="true">
        <TriangleAlert className="size-7" />
      </div>
      <h2 className="text-danger-soft-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-danger-soft-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
