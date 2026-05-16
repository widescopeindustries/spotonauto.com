"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function EntryPathsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading reveal
      if (headingRef.current) {
        gsap.from(headingRef.current.children, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // Cards stagger — each fades up independently like Osaka → Kyoto → Tokyo
      if (cardsRef.current) {
        gsap.from(cardsRef.current.children, {
          y: 60,
          opacity: 0,
          duration: 0.9,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-32">
      {/* Subtle section background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-14 text-center">
          <span className="inline-block text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/70 mb-3">
            Start Here
          </span>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl font-display">
            How can we help?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-400">
            Pick the path that matches where you are right now.
          </p>
        </div>

        <div ref={cardsRef} className="grid gap-6 md:grid-cols-2">
          {/* Path 1: I know what's wrong */}
          <Link
            href="/repair"
            className="group relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 overflow-hidden transition-all duration-500 hover:border-cyan-500/30 hover:bg-white/[0.05] hover:shadow-[0_0_60px_-15px_rgba(0,212,255,0.15)]"
          >
            {/* Hover gradient sweep */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <BookOpen className="h-6 w-6 text-cyan-400" />
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                You know what is wrong
              </h3>
              <p className="mt-2 text-gray-400 leading-relaxed">
                You just need the factory service data — torque specs, fluid
                capacities, wiring diagrams, and step-by-step procedures for your
                exact year, make, and model.
              </p>

              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                Open the repair hub
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Path 2: Talk to Manuel */}
          <Link
            href="/diagnose"
            className="group relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 overflow-hidden transition-all duration-500 hover:border-[#FF6B00]/30 hover:bg-white/[0.05] hover:shadow-[0_0_60px_-15px_rgba(255,107,0,0.12)]"
          >
            {/* Hover gradient sweep */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,0,0.05) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20">
                <Sparkles className="h-6 w-6 text-[#FF6B00]" />
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-[#FF9500] transition-colors duration-300">
                Talk to Manuel
              </h3>
              <p className="mt-2 text-gray-400 leading-relaxed">
                Hey, I&apos;m Manuel — your factory-trained AI mechanic. Tell me what&apos;s
                wrong: read me a code, describe a noise, or just say &quot;it won&apos;t start.&quot;
                I&apos;ll walk you through the exact diagnostic flowchart from the OEM
                manual, step by step. No typing required — just talk.
              </p>

              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
                Ask Manuel
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
