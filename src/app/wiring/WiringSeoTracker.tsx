interface WiringSeoTrackerProps {
  vehicle: string;
  system: string;
}

/** Renders an invisible element with impression data; picked up by TrackingScript. */
export default function WiringSeoTracker({ vehicle, system }: WiringSeoTrackerProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none h-px w-px opacity-0"
      data-track-impression={JSON.stringify({
        event_category: 'wiring_seo_view',
        vehicle,
        system,
      })}
    />
  );
}
