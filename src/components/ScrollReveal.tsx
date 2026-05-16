'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  stagger?: number;
  scale?: number;
  scrub?: boolean | number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  y = 40,
  x = 0,
  stagger = 0.1,
  scale,
  scrub,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const fromVars: gsap.TweenVars = {
        y,
        x,
        opacity: 0,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
      };

      if (scale !== undefined) {
        fromVars.scale = scale;
      }

      const scrollTriggerConfig: ScrollTrigger.Vars = {
        trigger: ref.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      };

      if (scrub) {
        scrollTriggerConfig.scrub = scrub;
        scrollTriggerConfig.start = 'top 90%';
        scrollTriggerConfig.end = 'bottom 20%';
        delete fromVars.duration;
        delete fromVars.delay;
        delete fromVars.stagger;
        delete fromVars.ease;
      }

      fromVars.scrollTrigger = scrollTriggerConfig;

      gsap.from(ref.current!.children, fromVars);
    }, ref);

    return () => ctx.revert();
  }, [delay, duration, y, x, stagger, scale, scrub]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
