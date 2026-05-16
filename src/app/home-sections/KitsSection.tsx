"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { Package, ArrowRight, Gift, Check } from "lucide-react";
import { getAllKits } from "@/data/kits";

gsap.registerPlugin(ScrollTrigger);

export default function KitsSection() {
  const kits = getAllKits();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
          stagger: 0.1,
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
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-[#0a0a0c] via-[#0f0f14] to-[#0a0a0c]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Package className="h-4 w-4 text-[#FF6B00]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#FF6B00]">
              Manual&apos;s Curated Kits
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl font-display">
            Everything in <span className="text-gradient-orange">One Box</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-400">
            We pulled the exact parts from the factory manual and boxed them up.
            OEM Exact or Smart Budget — you pick.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <Link
              key={kit.slug}
              href={`/kits/oil-change/${kit.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-500 hover:border-[#FF6B00]/30 hover:bg-white/[0.05] hover:shadow-[0_0_50px_-15px_rgba(255,107,0,0.1)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors duration-300">
                    {kit.make} {kit.model}
                  </h3>
                  <p className="text-sm text-gray-500">{kit.yearRange}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20">
                  <Package className="h-5 w-5 text-[#FF6B00]" />
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                  <span>{kit.oilSpec.viscosity} {kit.oilSpec.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                  <span>Exact-fit oil filter</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                  <span>Drain plug gasket + tools</span>
                </div>
              </div>

              <div className="mt-auto border-t border-white/10 pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Smart Budget</p>
                    <p className="text-xl font-bold text-white">
                      ${kit.pricing.smartBudget}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">OEM Exact</p>
                    <p className="text-xl font-bold text-[#FF6B00]">
                      ${kit.pricing.oemExact}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
                  See what&apos;s in the box
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}

          {/* Subscription CTA card */}
          <Link
            href="/kits"
            className="group flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center transition-all duration-500 hover:border-[#FF6B00]/40 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20">
              <Gift className="h-6 w-6 text-[#FF6B00]" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Year-Long Subscription
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              4 oil changes delivered to your door. Starting at $199/year.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
              View all kits
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
