import Link from 'next/link';

interface ConversionZoneProps {
  vehicleLabel?: string;
  intentLabel?: string;
}

export default function ConversionZone({
  vehicleLabel = 'your vehicle',
  intentLabel = 'repair',
}: ConversionZoneProps) {
  return (
    <section className="conversion-zone">
      <h3>Get the Complete Maintenance Schedule for {vehicleLabel}</h3>
      <p>
        Oil, filters, belts, brakes, and fluid intervals sent to your inbox.
        Unsubscribe anytime.
      </p>
      <form
        className="mb-5 flex flex-wrap justify-center gap-2"
        action="/contact"
        method="get"
        data-track-submit='{"event_name":"email_capture_conversion","event_category":"email_capture","surface":"conversion_zone"}'
      >
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          aria-label="Email address"
        />
        <button type="submit">Get My Free Schedule</button>
      </form>

      <p className="text-sm">Not sure you want to DIY? Compare local shop pricing first.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link
          href="/second-opinion"
          className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200"
          data-track-click='{"event_name":"quote_request_submission","event_category":"quote_request","surface":"conversion_zone"}'
        >
          Get Free Quote Check
        </Link>
        <Link
          href={`/diagnose?q=${encodeURIComponent(intentLabel)}`}
          className="inline-flex items-center justify-center rounded-lg border border-cyan-200/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
        >
          Diagnose Another Issue
        </Link>
      </div>
    </section>
  );
}
