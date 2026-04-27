import Link from 'next/link';

export interface GraphProcedure {
  id: string;
  title: string;
  url: string | null;
  system: string;
  vehicleName: string | null;
  vehicleYear: number | null;
}

export interface GraphProcedurePanelProps {
  code: string;
  component: string | null;
  description: string | null;
  totalProcedures: number;
  procedures: GraphProcedure[];
}

export default function GraphProcedurePanel({
  code,
  component,
  description,
  totalProcedures,
  procedures,
}: GraphProcedurePanelProps) {
  if (!component || procedures.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">
            OEM Procedures for {code}
          </h3>
          <p className="text-sm text-emerald-200/80 mt-1">
            {description || `${code} affects the ${component}.`} Found {totalProcedures.toLocaleString()} OEM service manual procedures.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/25">
          {component}
        </span>
      </div>

      <div className="space-y-2">
        {procedures.map((proc) => (
          <div
            key={proc.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:border-emerald-500/30 transition"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {proc.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {proc.system}
                </span>
                {proc.vehicleName && (
                  <span className="text-[10px] text-gray-500">
                    {proc.vehicleYear} {proc.vehicleName}
                  </span>
                )}
              </div>
            </div>
            {proc.url ? (
              <Link
                href={proc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 shrink-0 text-xs text-emerald-400 hover:text-emerald-200 transition"
              >
                View →
              </Link>
            ) : (
              <span className="ml-4 shrink-0 text-xs text-gray-600">No link</span>
            )}
          </div>
        ))}
      </div>

      {totalProcedures > procedures.length && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Showing {procedures.length} of {totalProcedures.toLocaleString()} procedures
          </p>
        </div>
      )}
    </section>
  );
}
