'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Saved me $400 on a diagnostic fee! The AI pinpointed the exact issue with my oxygen sensor.",
      author: "Mike T.",
      role: "DIY Enthusiast",
      rating: 5,
    },
    {
      quote: "Fixed my brakes in 30 minutes. The step-by-step guide was incredibly detailed and easy to follow.",
      author: "Sarah K.",
      role: "First-time Mechanic",
      rating: 5,
    },
    {
      quote: "The AI knew exactly what was wrong. Even my mechanic was impressed with the accuracy.",
      author: "James R.",
      role: "Car Owner",
      rating: 5,
    },
    {
      quote: "Best automotive tool I've ever used. Worth every penny for the peace of mind alone.",
      author: "David L.",
      role: "Fleet Manager",
      rating: 5,
    },
    {
      quote: "Diagnosed a transmission issue that two shops couldn't figure out. Absolutely incredible.",
      author: "Emily W.",
      role: "Auto Shop Owner",
      rating: 5,
    },
    {
      quote: "The parts comparison feature alone saved me $200 on my last repair. Game changer!",
      author: "Chris M.",
      role: "Weekend Warrior",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs tracking-[0.3em] text-cyan-400 uppercase mb-4 block">
            Social Proof
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            WHAT <span className="text-cyan-400">MECHANICS</span> SAY
          </h2>
        </motion.div>

        {/* Marquee Container */}
        <div className="space-y-6 overflow-hidden">
          {/* Row 1 - Left */}
          <div className="relative">
            <div className="flex gap-6 animate-marquee-left hover:[animation-play-state:paused]">
              {[...testimonials.slice(0, 3), ...testimonials.slice(0, 3)].map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[350px] glass rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Quote className="w-8 h-8 text-cyan-400/30 mb-4" />
                  <p className="font-body text-gray-300 mb-4">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-white">
                        {testimonial.author[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-body font-semibold text-white text-sm">
                        {testimonial.author}
                      </div>
                      <div className="font-body text-xs text-gray-500">{testimonial.role}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 - Right */}
          <div className="relative">
            <div className="flex gap-6 animate-marquee-right hover:[animation-play-state:paused]">
              {[...testimonials.slice(3, 6), ...testimonials.slice(3, 6)].map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[350px] glass rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Quote className="w-8 h-8 text-cyan-400/30 mb-4" />
                  <p className="font-body text-gray-300 mb-4">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-white">
                        {testimonial.author[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-body font-semibold text-white text-sm">
                        {testimonial.author}
                      </div>
                      <div className="font-body text-xs text-gray-500">{testimonial.role}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
