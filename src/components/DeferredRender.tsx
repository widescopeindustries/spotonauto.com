'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

interface DeferredRenderProps {
  children: ReactNode;
  rootMargin?: string;
  placeholderClassName?: string;
}

export default function DeferredRender({
  children,
  rootMargin = '500px 0px',
  placeholderClassName = 'min-h-[140px]',
}: DeferredRenderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={hostRef}>
      {isVisible ? children : <div className={placeholderClassName} aria-hidden="true" />}
    </div>
  );
}
