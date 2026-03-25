import Link from 'next/link';
import { ReactNode } from 'react';

interface RepairTrackedLinkProps {
  href: string;
  className?: string;
  vehicle: string;
  task: string;
  section: string;
  target: string;
  label: string;
  children: ReactNode;
}

export default function RepairTrackedLink({
  href,
  className,
  vehicle,
  task,
  section,
  target,
  label,
  children,
}: RepairTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      data-track-click={JSON.stringify({
        event_category: 'repair_answer',
        vehicle,
        task,
        section,
        target,
        label,
        href,
      })}
    >
      {children}
    </Link>
  );
}
