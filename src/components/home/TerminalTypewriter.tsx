"use client";
import { useState, useEffect, useRef } from 'react'

interface TerminalTypewriterProps {
  lines: string[]
  typingSpeed?: number
  className?: string
}

export default function TerminalTypewriter({ lines, typingSpeed = 40, className = '' }: TerminalTypewriterProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentLineIndex >= lines.length) return

    const timer = setTimeout(() => {
      const line = lines[currentLineIndex]
      if (currentCharIndex < line.length) {
        setDisplayedLines((prev) => {
          const newLines = [...prev]
          newLines[currentLineIndex] = line.substring(0, currentCharIndex + 1)
          return newLines
        })
        setCurrentCharIndex((prev) => prev + 1)
      } else {
        setCurrentLineIndex((prev) => prev + 1)
        setCurrentCharIndex(0)
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [currentLineIndex, currentCharIndex, lines, typingSpeed])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedLines])

  return (
    <div
      ref={containerRef}
      className={`font-mono text-sm bg-[#0a0a0f] border border-white/10 rounded-xl p-4 overflow-hidden ${className}`}
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="text-[#6E6E80] text-xs ml-2">spotonauto-diagnostic.exe</span>
      </div>
      <div className="space-y-1">
        {lines.map((_, index) => (
          <div key={index} className="flex">
            <span className="text-[#FF6B00] mr-2 shrink-0">{'>'}</span>
            <span className="text-[#EAEAEA]">
              {displayedLines[index] || ''}
              {index === currentLineIndex && (
                <span className="inline-block w-2 h-4 bg-[#5B8DB8] ml-0.5 animate-pulse" />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}