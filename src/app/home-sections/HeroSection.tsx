"use client";

import HomeVehiclePicker from "../HomeVehiclePicker";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-[80vh] items-center overflow-hidden"
    >
      {/* Soft graphite background */}
      <div className="absolute inset-0 bg-[#0a0a0c]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#111116] to-[#0a0a0c]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Factory Repair Guides,
            <br />
            <span className="text-cyan-400">Translated for Real People</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-gray-400 sm:text-lg">
            Every torque spec, fluid capacity, and step-by-step procedure —
            straight from the OEM service manual, written so you can actually
            follow it.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <HomeVehiclePicker />
        </div>

        <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            1.4M+ OEM Procedures
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            8,881 DTC Codes
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            304K Vehicle Variants
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            100% Free — No Login
          </div>
        </div>
      </div>
    </section>
  );
}
