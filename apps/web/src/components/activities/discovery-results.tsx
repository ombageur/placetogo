import { CalendarSearch } from 'lucide-react';
import type { DiscoveryFeedState } from '@/hooks/use-discovery-feed';
import { ActivityCard } from './activity-card';
import { ActivityCardSkeletonList } from './activity-card-skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';

export function DiscoveryResults({ feed, emptyHint }: { feed: DiscoveryFeedState; emptyHint?: string }) {
  if (feed.status === 'loading') return <ActivityCardSkeletonList />;
  if (feed.status === 'error') return <ErrorState description="Tidak dapat memuat ajakan." onRetry={feed.retry} />;
  if (feed.items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarSearch className="size-7" />}
        title="Belum ada ajakan"
        description={emptyHint ?? 'Coba ubah filter atau kata kunci pencarian.'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {feed.items.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
      {feed.hasMore && (
        <Button variant="secondary" fullWidth loading={feed.loadingMore} onClick={feed.loadMore}>
          Muat lebih banyak
        </Button>
      )}
    </div>
  );
}
