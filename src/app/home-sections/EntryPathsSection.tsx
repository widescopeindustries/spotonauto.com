"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";

export default function EntryPathsSection() {
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            How can we help?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-400">
            Pick the path that matches where you are right now.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Path 1: I know what's wrong */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link
              href="/repair"
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-[#12121A]/80 p-8 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:bg-[#12121A]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                <BookOpen className="h-6 w-6 text-cyan-400" />
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                You know what is wrong
              </h3>
              <p className="mt-2 text-gray-400">
                You just need the factory service data — torque specs, fluid
                capacities, wiring diagrams, and step-by-step procedures for your
                exact year, make, and model.
              </p>

              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                Open the repair hub
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>

          {/* Path 2: I don't know what's wrong */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/diagnose"
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-[#12121A]/80 p-8 backdrop-blur-sm transition-all hover:border-[#FF6B00]/40 hover:bg-[#12121A]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/10">
                <Sparkles className="h-6 w-6 text-[#FF6B00]" />
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-[#FF9500] transition-colors">
                Factory AI Technician
              </h3>
              <p className="mt-2 text-gray-400">
                Researching a problem you cannot pinpoint? Our AI technician is
                100% grounded in factory service manuals. Describe the symptom,
                noise, or warning light and it guides you through the same
                diagnostic trees the dealership uses.
              </p>

              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-[#FF6B00] group-hover:text-[#FF9500] transition-colors">
                Start diagnosis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
