"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

gsap.registerPlugin(ScrollTrigger);

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
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getTaskCategory(taskSlug: string): TaskCategory {
  const map: Record<string, TaskCategory> = {
    "brake-pad-replacement": { label: "Brakes", color: "#FF6B00", icon: Gauge },
    "brake-rotor-replacement": { label: "Brakes", color: "#FF6B00", icon: Gauge },
    "brake-fluid-flush": { label: "Brakes", color: "#FF6B00", icon: Gauge },
    "oil-change": { label: "Fluids", color: "#5B8DB8", icon: Droplets },
    "transmission-fluid-change": { label: "Fluids", color: "#5B8DB8", icon: Droplets },
    "coolant-flush": { label: "Fluids", color: "#5B8DB8", icon: Droplets },
    "power-steering-fluid-change": { label: "Fluids", color: "#5B8DB8", icon: Droplets },
    "differential-fluid-change": { label: "Fluids", color: "#5B8DB8", icon: Droplets },
    "spark-plug-replacement": { label: "Tune-up", color: "#10B981", icon: Zap },
    "ignition-coil-replacement": { label: "Tune-up", color: "#10B981", icon: Zap },
    "battery-replacement": { label: "Battery", color: "#FBBF24", icon: Battery },
    "alternator-replacement": { label: "Starting", color: "#F59E0B", icon: Zap },
    "starter-replacement": { label: "Starting", color: "#F59E0B", icon: Zap },
    "thermostat-replacement": { label: "Cooling", color: "#06B6D4", icon: Thermometer },
    "water-pump-replacement": { label: "Cooling", color: "#06B6D4", icon: Thermometer },
    "radiator-replacement": { label: "Cooling", color: "#06B6D4", icon: Thermometer },
    "serpentine-belt-replacement": { label: "Belts", color: "#06B6D4", icon: Cog },
    "timing-belt-replacement": { label: "Belts", color: "#06B6D4", icon: Cog },
    "timing-chain-replacement": { label: "Belts", color: "#06B6D4", icon: Cog },
    "headlight-bulb-replacement": { label: "Lighting", color: "#EAB308", icon: Sun },
    "tail-light-replacement": { label: "Lighting", color: "#EAB308", icon: Sun },
    "cabin-air-filter-replacement": { label: "Filters", color: "#8B5CF6", icon: Filter },
    "engine-air-filter-replacement": { label: "Filters", color: "#8B5CF6", icon: Filter },
    "fuel-filter-replacement": { label: "Filters", color: "#8B5CF6", icon: Filter },
    "oxygen-sensor-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "mass-air-flow-sensor-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "catalytic-converter-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "egr-valve-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "fuel-injector-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "fuel-pump-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "muffler-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "turbo-replacement": { label: "Engine", color: "#EF4444", icon: Cpu },
    "wheel-bearing-replacement": { label: "Suspension", color: "#EC4899", icon: MoveVertical },
    "tie-rod-replacement": { label: "Suspension", color: "#EC4899", icon: MoveVertical },
    "ball-joint-replacement": { label: "Suspension", color: "#EC4899", icon: MoveVertical },
    "shock-absorber-replacement": { label: "Suspension", color: "#EC4899", icon: MoveVertical },
    "strut-replacement": { label: "Suspension", color: "#EC4899", icon: MoveVertical },
    "clutch-replacement": { label: "Drivetrain", color: "#6366F1", icon: Cog },
    "cv-axle-replacement": { label: "Drivetrain", color: "#6366F1", icon: Cog },
    "windshield-wiper-replacement": { label: "Other", color: "#6B7280", icon: Wrench },
  };
  return (
    map[taskSlug] ?? { label: "Repair", color: "#6B7280", icon: Wrench }
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
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const parsed = repairs
    .map(parseRepairLink)
    .filter((c): c is RepairCard => c !== null);

  const cards = parsed.length >= 6 ? parsed.slice(0, 6) : [...parsed, ...buildFallbackCards()].slice(0, 6);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.from(headingRef.current.children, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      if (gridRef.current) {
        gsap.from(gridRef.current.children, {
          y: 50,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="manual" className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4 text-[#FF6B00]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#FF6B00]">
              Most Searched Guides
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl font-display">
            Popular <span className="text-gradient-orange">Repairs</span>
          </h2>
          <p className="mx-auto max-w-xl text-[#6E6E80]">
            Factory-grounded repair guides tied to exact vehicles — because a
            2013 Civic oil change and a 2013 F-150 oil change are completely
            different jobs.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.category.icon;
            return (
              <HolographicCard key={card.href} className="h-full">
                <Link href={card.href} className="group block h-full">
                  <div className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${card.category.color}15`,
                          color: card.category.color,
                        }}
                      >
                        {card.year}
                      </span>
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border"
                        style={{
                          backgroundColor: `${card.category.color}10`,
                          color: card.category.color,
                          borderColor: `${card.category.color}20`,
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        {card.category.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-400">
                      {card.vehicleLabel}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors duration-300">
                      {card.taskLabel}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="text-xs text-gray-500">
                        Exact-fit guide
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
                        View Guide
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </HolographicCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
