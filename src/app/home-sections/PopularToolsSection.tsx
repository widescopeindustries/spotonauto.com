"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Droplets,
  Battery,
  CircleDot,
  Zap,
  Cog,
  Thermometer,
  Wrench,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

interface ToolCard {
  slug: string;
  label: string;
  vehicle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
}

const TOP_TOOLS: ToolCard[] = [
  {
    slug: "/tools/toyota-camry-oil-type",
    label: "Oil Type",
    vehicle: "Toyota Camry",
    icon: Droplets,
    iconColor: "text-[#5B8DB8]",
    bgColor: "bg-[#5B8DB8]/10",
  },
  {
    slug: "/tools/honda-civic-oil-type",
    label: "Oil Type",
    vehicle: "Honda Civic",
    icon: Droplets,
    iconColor: "text-[#5B8DB8]",
    bgColor: "bg-[#5B8DB8]/10",
  },
  {
    slug: "/tools/bmw-x3-battery-location",
    label: "Battery Location",
    vehicle: "BMW X3",
    icon: Battery,
    iconColor: "text-[#FBBF24]",
    bgColor: "bg-[#FBBF24]/10",
  },
  {
    slug: "/tools/toyota-camry-tire-size",
    label: "Tire Size",
    vehicle: "Toyota Camry",
    icon: CircleDot,
    iconColor: "text-[#EC4899]",
    bgColor: "bg-[#EC4899]/10",
  },
  {
    slug: "/tools/nissan-pathfinder-serpentine-belt",
    label: "Serpentine Belt",
    vehicle: "Nissan Pathfinder",
    icon: Cog,
    iconColor: "text-[#06B6D4]",
    bgColor: "bg-[#06B6D4]/10",
  },
  {
    slug: "/tools/chevrolet-silverado-coolant-type",
    label: "Coolant Type",
    vehicle: "Chevrolet Silverado",
    icon: Thermometer,
    iconColor: "text-[#EF4444]",
    bgColor: "bg-[#EF4444]/10",
  },
  {
    slug: "/tools/honda-civic-spark-plug-type",
    label: "Spark Plug Type",
    vehicle: "Honda Civic",
    icon: Zap,
    iconColor: "text-[#10B981]",
    bgColor: "bg-[#10B981]/10",
  },
  {
    slug: "/tools/audi-q5-transmission-fluid-type",
    label: "Transmission Fluid",
    vehicle: "Audi Q5",
    icon: Droplets,
    iconColor: "text-[#8B5CF6]",
    bgColor: "bg-[#8B5CF6]/10",
  },
];

export default function PopularToolsSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#FF6B00]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#FF6B00]">
              Shop by Spec
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Most Searched <span className="text-gradient-orange">Specs</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-400">
            The exact oil, battery, tire, and fluid specs people look up every
            day — with links to the right parts on Amazon.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOP_TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Link
                  href={tool.slug}
                  className="group flex h-full flex-col rounded-xl border border-white/10 bg-[#12121A]/80 p-5 backdrop-blur-sm transition-all hover:border-[#FF6B00]/30 hover:bg-[#12121A]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${tool.iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {tool.label}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors">
                    {tool.vehicle}
                  </h3>

                  <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
                    Get the exact spec
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-[#FF6B00]/40 hover:bg-white/10"
          >
            <Wrench className="h-4 w-4 text-[#FF6B00]" />
            Browse all 76 spec lookups
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
