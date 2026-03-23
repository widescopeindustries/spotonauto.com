'use client';

import { useEffect, useRef } from 'react';
import { trackRepairAnswerImpression } from '@/lib/analytics';

interface RepairSectionTrackerProps {
  vehicle: string;
  task: string;
  section: string;
  label?: string;
  target?: string;
  itemCount?: number;
  className?: string;
}

export default function RepairSectionTracker({
  vehicle,
  task,
  section,
  label,
  target,
  itemCount,
  className,
}: RepairSectionTrackerProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || hasTracked.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      trackRepairAnswerImpression({
        vehicle,
        task,
        section,
        label,
        target,
        itemCount,
      });
      hasTracked.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (hasTracked.current) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;

        trackRepairAnswerImpression({
          vehicle,
          task,
          section,
          label,
          target,
          itemCount,
        });
        hasTracked.current = true;
        observer.disconnect();
      },
      {
        threshold: 0.35,
        rootMargin: '0px 0px -15% 0px',
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [vehicle, task, section, label, target, itemCount]);

  return (
    <div
      ref={sentinelRef}
      aria-hidden="true"
      className={className || 'pointer-events-none h-px w-px opacity-0'}
    />
  );
}
