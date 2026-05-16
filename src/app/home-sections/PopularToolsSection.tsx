"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import {
  Droplets,
  Battery,
  CircleDot,
  Cog,
  Thermometer,
  Zap,
  ArrowRight,
  ShoppingBag,
  Wrench,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface ToolCard {
  slug: string;
  label: string;
  vehicle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}

const TOP_TOOLS: ToolCard[] = [
  {
    slug: "/tools/toyota-camry-oil-type",
    label: "Oil Type",
    vehicle: "Toyota Camry",
    icon: Droplets,
    iconColor: "text-[#5B8DB8]",
    bgColor: "bg-[#5B8DB8]/10",
    borderColor: "border-[#5B8DB8]/20",
  },
  {
    slug: "/tools/honda-civic-oil-type",
    label: "Oil Type",
    vehicle: "Honda Civic",
    icon: Droplets,
    iconColor: "text-[#5B8DB8]",
    bgColor: "bg-[#5B8DB8]/10",
    borderColor: "border-[#5B8DB8]/20",
  },
  {
    slug: "/tools/bmw-x3-battery-location",
    label: "Battery Location",
    vehicle: "BMW X3",
    icon: Battery,
    iconColor: "text-[#FBBF24]",
    bgColor: "bg-[#FBBF24]/10",
    borderColor: "border-[#FBBF24]/20",
  },
  {
    slug: "/tools/toyota-camry-tire-size",
    label: "Tire Size",
    vehicle: "Toyota Camry",
    icon: CircleDot,
    iconColor: "text-[#EC4899]",
    bgColor: "bg-[#EC4899]/10",
    borderColor: "border-[#EC4899]/20",
  },
  {
    slug: "/tools/nissan-pathfinder-serpentine-belt",
    label: "Serpentine Belt",
    vehicle: "Nissan Pathfinder",
    icon: Cog,
    iconColor: "text-[#06B6D4]",
    bgColor: "bg-[#06B6D4]/10",
    borderColor: "border-[#06B6D4]/20",
  },
  {
    slug: "/tools/chevrolet-silverado-coolant-type",
    label: "Coolant Type",
    vehicle: "Chevrolet Silverado",
    icon: Thermometer,
    iconColor: "text-[#EF4444]",
    bgColor: "bg-[#EF4444]/10",
    borderColor: "border-[#EF4444]/20",
  },
  {
    slug: "/tools/honda-civic-spark-plug-type",
    label: "Spark Plug Type",
    vehicle: "Honda Civic",
    icon: Zap,
    iconColor: "text-[#10B981]",
    bgColor: "bg-[#10B981]/10",
    borderColor: "border-[#10B981]/20",
  },
  {
    slug: "/tools/audi-q5-transmission-fluid-type",
    label: "Transmission Fluid",
    vehicle: "Audi Q5",
    icon: Droplets,
    iconColor: "text-[#8B5CF6]",
    bgColor: "bg-[#8B5CF6]/10",
    borderColor: "border-[#8B5CF6]/20",
  },
];

export default function PopularToolsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

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
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#FF6B00]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#FF6B00]">
              Shop by Spec
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl font-display">
            Most Searched <span className="text-gradient-orange">Specs</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-400">
            The exact oil, battery, tire, and fluid specs people look up every
            day — with links to the right parts on Amazon.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOP_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={tool.slug}
                className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 transition-all duration-500 hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-[0_0_40px_-10px_rgba(0,212,255,0.1)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.bgColor} border ${tool.borderColor}`}
                  >
                    <Icon className={`h-5 w-5 ${tool.iconColor}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {tool.label}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors duration-300">
                  {tool.vehicle}
                </h3>

                <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
                  Get the exact spec
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div ref={ctaRef} className="mt-10 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-[#FF6B00]/40 hover:bg-white/10 hover:shadow-[0_0_30px_-10px_rgba(255,107,0,0.2)]"
          >
            <Wrench className="h-4 w-4 text-[#FF6B00]" />
            Browse all 76 spec lookups
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
