'use client';

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import React from 'react';

// Standard easing for a "classy" feel
const EASING = [0.22, 1, 0.36, 1]; // Custom cubic-bezier like easeOutQuint

interface MotionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

// 1. Simple Fade In Up (The "Standard" Entry)
export const FadeInUp: React.FC<MotionProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  className = "",
  ...props 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration, delay, ease: EASING }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// 2. Stagger Container (For Grids/Lists)
export const StaggerContainer: React.FC<MotionProps & { staggerDelay?: number }> = ({ 
  children, 
  staggerDelay = 0.1, 
  className = "",
  ...props 
}) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      hidden: {},
      show: {
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// 3. Child Item for Stagger Container
export const StaggerItem: React.FC<MotionProps> = ({ 
  children, 
  className = "",
  ...props 
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASING } }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// 4. Scale In (For Buttons/Badges/Icons)
export const ScaleIn: React.FC<MotionProps> = ({ 
  children, 
  delay = 0, 
  className = "",
  ...props 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay, ease: "backOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// 5. Glass Card Hover Effect (Micro-interaction)
export const GlassCard: React.FC<MotionProps & { hoverEffect?: boolean }> = ({ 
  children, 
  className = "",
  hoverEffect = true,
  ...props 
}) => (
  <motion.div
    className={`glass border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-2xl ${className}`}
    whileHover={hoverEffect ? { 
      y: -5, 
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderColor: "rgba(34, 211, 238, 0.3)", // Brand Cyan
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
    } : {}}
    transition={{ duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
);
