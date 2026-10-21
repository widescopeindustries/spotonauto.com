import Link from "next/link";
import { BookOpen, Stethoscope, ArrowRight } from "lucide-react";

export default function EntryPathsSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-slate-800/60 bg-[#0B0F17]">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">
            Technical Service Navigation
          </span>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl tracking-tight">
            Select Your Workshop Workflow
          </h2>
          <p className="mx-auto mt-2.5 max-w-lg text-slate-400 text-sm sm:text-base">
            Choose direct procedure specifications or diagnostic fault tree navigation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Path 1: Direct Manual Procedures */}
          <Link
            href="/repair"
            className="group relative flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 transition-all duration-200 hover:border-sky-500/40 hover:bg-slate-800/50 shadow-xs"
          >
            <div className="relative">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <BookOpen className="h-5 w-5" />
              </div>

              <h3 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                OEM Repair &amp; Service Procedures
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Direct factory documentation &mdash; fastener torque specifications, fluid capacities,
                pinout diagrams, and teardown steps indexed by vehicle year, make, and model.
              </p>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-mono font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
                <span>Open Repair Procedure Index</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Path 2: Diagnostic Fault Tree */}
          <Link
            href="/diagnose"
            className="group relative flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 transition-all duration-200 hover:border-sky-500/40 hover:bg-slate-800/50 shadow-xs"
          >
            <div className="relative">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Stethoscope className="h-5 w-5" />
              </div>

              <h3 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                Diagnostic Troubleshooting Flowcharts
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Step-by-step diagnostic trees for OBD-II trouble codes, electrical short-to-ground
                tests, and mechanical symptom isolation straight from factory service bulletins.
              </p>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-mono font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
                <span>Start Diagnostic Session</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
