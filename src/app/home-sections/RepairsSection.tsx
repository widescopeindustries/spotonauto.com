import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Gauge,
  Droplets,
  Zap,
  Battery,
  Thermometer,
  Sun,
  Filter,
  Cpu,
  MoveVertical,
  Cog,
  Wrench,
} from "lucide-react";
import HolographicCard from "@/components/home/HolographicCard";
import { TIER_1_RESCUE_PAGES } from "@/data/rescuePriority";


interface RepairLink {
  href: string;
  label: string;
}

interface RepairsSectionProps {
  repairs: RepairLink[];
}

function toTitleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TaskCategory {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getTaskCategory(taskSlug: string): TaskCategory {
  const map: Record<string, TaskCategory> = {
    "brake-pad-replacement": { label: "Brakes", icon: Gauge },
    "brake-rotor-replacement": { label: "Brakes", icon: Gauge },
    "brake-fluid-flush": { label: "Brakes", icon: Gauge },
    "oil-change": { label: "Fluids", icon: Droplets },
    "transmission-fluid-change": { label: "Fluids", icon: Droplets },
    "coolant-flush": { label: "Fluids", icon: Droplets },
    "power-steering-fluid-change": { label: "Fluids", icon: Droplets },
    "differential-fluid-change": { label: "Fluids", icon: Droplets },
    "spark-plug-replacement": { label: "Ignition", icon: Zap },
    "ignition-coil-replacement": { label: "Ignition", icon: Zap },
    "battery-replacement": { label: "Electrical", icon: Battery },
    "alternator-replacement": { label: "Charging", icon: Zap },
    "starter-replacement": { label: "Starting", icon: Zap },
    "thermostat-replacement": { label: "Cooling", icon: Thermometer },
    "water-pump-replacement": { label: "Cooling", icon: Thermometer },
    "radiator-replacement": { label: "Cooling", icon: Thermometer },
    "serpentine-belt-replacement": { label: "Drive Belts", icon: Cog },
    "timing-belt-replacement": { label: "Timing", icon: Cog },
    "timing-chain-replacement": { label: "Timing", icon: Cog },
    "headlight-bulb-replacement": { label: "Lighting", icon: Sun },
    "tail-light-replacement": { label: "Lighting", icon: Sun },
    "cabin-air-filter-replacement": { label: "Filtration", icon: Filter },
    "engine-air-filter-replacement": { label: "Filtration", icon: Filter },
    "fuel-filter-replacement": { label: "Filtration", icon: Filter },
    "oxygen-sensor-replacement": { label: "Engine Sensors", icon: Cpu },
    "mass-air-flow-sensor-replacement": { label: "Engine Sensors", icon: Cpu },
    "catalytic-converter-replacement": { label: "Exhaust", icon: Cpu },
    "egr-valve-replacement": { label: "Emissions", icon: Cpu },
    "fuel-injector-replacement": { label: "Fuel System", icon: Cpu },
    "fuel-pump-replacement": { label: "Fuel System", icon: Cpu },
    "muffler-replacement": { label: "Exhaust", icon: Cpu },
    "turbo-replacement": { label: "Forced Induction", icon: Cpu },
    "wheel-bearing-replacement": { label: "Chassis", icon: MoveVertical },
    "tie-rod-replacement": { label: "Steering", icon: MoveVertical },
    "ball-joint-replacement": { label: "Suspension", icon: MoveVertical },
    "shock-absorber-replacement": { label: "Suspension", icon: MoveVertical },
    "strut-replacement": { label: "Suspension", icon: MoveVertical },
    "clutch-replacement": { label: "Drivetrain", icon: Cog },
    "cv-axle-replacement": { label: "Drivetrain", icon: Cog },
    "windshield-wiper-replacement": { label: "Maintenance", icon: Wrench },
  };
  return (
    map[taskSlug] ?? { label: "Procedure", icon: Wrench }
  );
}

interface RepairCard {
  year: string;
  vehicleLabel: string;
  taskLabel: string;
  href: string;
  category: TaskCategory;
}

function parseRepairLink(link: RepairLink): RepairCard | null {
  const match = link.href.match(
    /\/repair\/(\d{4})\/([^/]+)\/([^/]+)\/([^/]+)/
  );
  if (!match) return null;

  const [, year, makeSlug, modelSlug, taskSlug] = match;
  const taskLabel = toTitleCase(taskSlug);
  const category = getTaskCategory(taskSlug);

  const escapedTask = taskLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const vehicleLabel = link.label
    .replace(new RegExp(`\\s+${escapedTask}$`, "i"), "")
    .trim();

  return {
    year,
    vehicleLabel:
      vehicleLabel || `${toTitleCase(makeSlug)} ${toTitleCase(modelSlug)}`,
    taskLabel,
    href: link.href,
    category,
  };
}

function buildFallbackCards(): RepairCard[] {
  return TIER_1_RESCUE_PAGES.slice(0, 6).map((entry) => {
    const taskLabel = toTitleCase(entry.task);
    const category = getTaskCategory(entry.task);
    return {
      year: String(entry.year),
      vehicleLabel: `${entry.year} ${entry.make} ${entry.model}`,
      taskLabel,
      href: entry.href,
      category,
    };
  });
}

export default function RepairsSection({ repairs }: RepairsSectionProps) {
  const parsed = repairs
    .map(parseRepairLink)
    .filter((c): c is RepairCard => c !== null);

  const cards = parsed.length >= 6 ? parsed.slice(0, 6) : [...parsed, ...buildFallbackCards()].slice(0, 6);

  return (
    <section id="manual" className="relative overflow-hidden py-16 md:py-24 border-t border-slate-800/60 bg-[#0C101A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Verified Workshop Procedures
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl tracking-tight">
            Factory Repair Guides
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl text-slate-400 text-sm sm:text-base">
            Exact torque tolerances, socket sizes, and step-by-step factory service sequences
            tailored to specific chassis and powertrain configurations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.category.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-200 hover:border-sky-500/40 hover:bg-slate-800/50 shadow-xs"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-mono font-semibold text-slate-300">
                    {card.year}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-800/60 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-300">
                    <Icon className="h-3 w-3 text-sky-400" />
                    {card.category.label}
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-400">
                  {card.vehicleLabel}
                </p>

                <h3 className="mt-1 text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                  {card.taskLabel}
                </h3>

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-800/60 font-mono text-xs">
                  <span className="text-slate-500">
                    OEM Service Data
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
                    View Procedure
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
