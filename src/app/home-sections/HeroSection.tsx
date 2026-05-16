"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HomeVehiclePicker from "../HomeVehiclePicker";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgTextRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax on giant background text — moves slower than scroll (layered depth)
      if (bgTextRef.current) {
        gsap.to(bgTextRef.current, {
          y: 300,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // Subtle parallax on grid background
      if (gridRef.current) {
        gsap.to(gridRef.current, {
          y: 100,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 2,
          },
        });
      }

      // Headline word-by-word stagger reveal on load
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll(".word");
        gsap.from(words, {
          y: 80,
          opacity: 0,
          rotateX: -40,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.2,
        });
      }

      // Subline fade up
      if (sublineRef.current) {
        gsap.from(sublineRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.8,
        });
      }

      // Picker glass container scale + fade in
      if (pickerRef.current) {
        gsap.from(pickerRef.current, {
          y: 50,
          opacity: 0,
          scale: 0.95,
          duration: 1,
          ease: "power3.out",
          delay: 1.0,
        });
      }

      // Stats stagger in with glass effect
      if (statsRef.current) {
        gsap.from(statsRef.current.children, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          delay: 1.3,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative flex min-h-[100vh] items-center overflow-hidden"
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-[#0a0a0c]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0d0d12] to-[#0a0a0c]" />

      {/* Animated grid lines — subtle parallax layer */}
      <div
        ref={gridRef}
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow — top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/[0.04] blur-[150px] rounded-full pointer-events-none" />

      {/* Orange accent glow — bottom right */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#FF6B00]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Giant layered background text — "OEM" sits BEHIND content like "Japan" behind mountains */}
      <div
        ref={bgTextRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none select-none z-0"
      >
        <span
          className="block text-[22vw] font-black tracking-tighter text-white/[0.025] whitespace-nowrap font-display leading-none"
          style={{
            WebkitTextStroke: "1px rgba(0, 212, 255, 0.04)",
          }}
        >
          OEM
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Perspective container for 3D text reveal */}
          <div className="perspective-1000">
            <h1
              ref={headlineRef}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl font-display preserve-3d"
            >
              <span className="word inline-block">Silence</span>{" "}
              <span className="word inline-block">The</span>
              <br className="hidden sm:block" />
              <span className="word inline-block text-cyan-400 glow-text">
                Check
              </span>{" "}
              <span className="word inline-block text-cyan-400 glow-text">
                Engine
              </span>{" "}
              <span className="word inline-block text-cyan-400 glow-text">
                Light
              </span>
            </h1>
          </div>

          <p
            ref={sublineRef}
            className="mx-auto mt-6 max-w-xl text-base text-gray-400 sm:text-lg leading-relaxed"
          >
            Factory repair data for your exact year, make, and model — DTC
            codes, wiring diagrams, torque specs, and step-by-step procedures.
            The same manuals the pros use, organized so you can fix it yourself.
          </p>
        </div>

        {/* Glass morphism vehicle picker — frosted over the grid */}
        <div ref={pickerRef} className="mx-auto mt-10 max-w-3xl">
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_80px_-20px_rgba(0,212,255,0.12)] overflow-hidden">
            {/* Inner gradient border shimmer */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, transparent 50%, rgba(255,107,0,0.05) 100%)",
            }} />
            <div className="relative">
              <div className="mb-4 text-center">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/70">
                  What are you working on?
                </span>
              </div>
              <HomeVehiclePicker />
            </div>
          </div>
        </div>

        {/* Glass morphism stat pills */}
        <div
          ref={statsRef}
          className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3 text-sm"
        >
          {[
            { label: "1.4M+ OEM Procedures", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(0,212,255,0.4)]" },
            { label: "8,881 DTC Codes", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(0,212,255,0.4)]" },
            { label: "304K Vehicle Variants", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(0,212,255,0.4)]" },
            { label: "100% Free — No Login", color: "bg-green-400", glow: "shadow-[0_0_8px_rgba(74,222,128,0.4)]" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-5 py-2.5 text-gray-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.07]"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${stat.color} ${stat.glow}`}
              />
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
