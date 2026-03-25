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
  return (
    <div
      aria-hidden="true"
      className={className || 'pointer-events-none h-px w-px opacity-0'}
      data-track-impression={JSON.stringify({
        event_category: 'repair_section_impression',
        vehicle,
        task,
        section,
        label,
        target,
        itemCount,
      })}
    />
  );
}
