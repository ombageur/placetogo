import Link from 'next/link';
import Image from 'next/image';
import type { ActivityDoc } from '@placetogo/shared';
import { getCategoryOrInterestImage } from './category-icons';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { categoryLabel, cityLabel, formatActivityDateTime, formatDistanceKm, getPaymentTypeInfo } from '@/lib/activities/format';

export function ActivityCard({ activity }: { activity: ActivityDoc & { distanceKm?: number } }) {
  const isFull = activity.participantCount >= activity.capacity;
  const paymentInfo = getPaymentTypeInfo(activity.paymentType);

  return (
    <Link
      href={`/jelajah/${activity.id}`}
      className="group flex flex-col gap-2.5 rounded-3xl border border-border bg-background p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-mint px-2.5 py-1 rounded-full border border-mint-strong/30">
          <Image
            src={getCategoryOrInterestImage(activity.categoryId)}
            alt=""
            width={24}
            height={24}
            className="size-5 shrink-0 rounded-full object-contain"
          />
          <span>{categoryLabel(activity.categoryId)}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${paymentInfo.className}`}
        >
          <FaIcon icon={paymentInfo.icon} className="text-[11px]" />
          <span>{paymentInfo.label}</span>
        </span>
      </div>

      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
        {activity.title}
      </h3>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FaIcon icon="fa-location-dot" className="text-xs text-primary shrink-0" />
        <span className="truncate">
          {activity.venueName}, {cityLabel(activity.cityId)}
        </span>
        {activity.distanceKm !== undefined && (
          <span className="ml-auto shrink-0 font-bold text-primary bg-mint px-2 py-0.5 rounded-full text-[11px]">
            {formatDistanceKm(activity.distanceKm)}
          </span>
        )}
      </p>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <FaIcon icon="fa-calendar-days" className="text-xs text-muted-foreground" />
          {formatActivityDateTime(activity.startsAt)}
        </span>
        <span className="flex items-center gap-1 font-bold text-muted-foreground">
          <FaIcon icon="fa-users" className="text-xs text-primary" />
          <span className={isFull ? 'text-danger' : undefined}>
            {activity.participantCount}/{activity.capacity}
          </span>
        </span>
      </div>
    </Link>
  );
}
