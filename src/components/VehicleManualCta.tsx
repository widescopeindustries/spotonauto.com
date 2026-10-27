import Link from 'next/link';

export interface VehicleManualLink {
  href: string;
  label: string;
}

export default function VehicleManualCta({
  href,
  buttonLabel,
  detail,
  links = [],
}: {
  href: string;
  buttonLabel: string;
  detail: string;
  links?: VehicleManualLink[];
}) {
  return (
    <div className="mb-8 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-cyan-300">
            This vehicle&apos;s factory manual
          </h3>
          <p className="text-sm text-gray-300">{detail}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-300"
        >
          {buttonLabel}
        </Link>
      </div>
      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
