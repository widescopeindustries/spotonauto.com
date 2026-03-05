import React from 'react';

interface WrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

interface StaggerContainerProps extends WrapperProps {
  staggerDelay?: number;
}

interface GlassCardProps extends WrapperProps {
  hoverEffect?: boolean;
}

export function FadeInUp({ children, className = '', delay: _delay, duration: _duration, ...props }: WrapperProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className = '',
  delay: _delay,
  duration: _duration,
  staggerDelay: _staggerDelay,
  ...props
}: StaggerContainerProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className = '', delay: _delay, duration: _duration, ...props }: WrapperProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function ScaleIn({ children, className = '', delay: _delay, duration: _duration, ...props }: WrapperProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  delay: _delay,
  duration: _duration,
  ...props
}: GlassCardProps) {
  const hoverClass = hoverEffect ? 'card-hover' : '';
  const mergedClass = `glass border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-2xl ${hoverClass} ${className}`.trim();
  return (
    <div className={mergedClass} {...props}>
      {children}
    </div>
  );
}
