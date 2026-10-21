'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Wrench,
  Zap,
  Printer,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  FolderOpen,
  ListOrdered,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import JarvisWiringOverlay from './JarvisWiringOverlay';
import JarvisTorqueTable from './JarvisTorqueTable';
import AdUnit from '@/components/AdUnit';

interface RelatedSection {
  id: string;
  title: string;
  path: string;
  type?: string;
  preview?: string;
}

interface WorkshopManualViewerProps {
  title: string;
  vehicle: string;
  contentHtml: string;
  breadcrumbs: Array<{ label: string; href: string }>;
  parent?: RelatedSection | null;
  siblings: RelatedSection[];
  childSections: RelatedSection[];
  dtcCodes?: RelatedSection[];
  wiringDiagrams?: RelatedSection[];
  isNavigation?: boolean;
  navLinks?: Array<{ label: string; href: string }>;
  vehicleInfo?: {
    make?: string;
    year?: string;
    model?: string;
  };
}


// Set NEXT_PUBLIC_ENABLE_MANUAL_ADS=true in environment once AdSense review approves
const ENABLE_MANUAL_ADS = process.env.NEXT_PUBLIC_ENABLE_MANUAL_ADS === 'true';



export default function WorkshopManualViewer({
  title,
  vehicle,
  contentHtml,
  breadcrumbs,
  parent,
  siblings,
  childSections,
  dtcCodes = [],
  wiringDiagrams = [],
  isNavigation,
  navLinks = [],
  vehicleInfo = {},
}: WorkshopManualViewerProps) {
  const [wiringOpen, setWiringOpen] = useState(false);
  const [torqueOpen, setTorqueOpen] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);

  // Determine previous and next siblings for book-style page flipping
  const prevSibling = siblings.length > 0 ? siblings[0] : null;
  const nextSibling = siblings.length > 1 ? siblings[1] : null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-blue-600/30">
      {/* Top Utility Bar & Breadcrumbs */}
      <div className="border-b border-slate-800/80 bg-[#111622]/90 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1.5 text-xs text-slate-400 overflow-x-auto py-1 max-w-full">
            <Link href="/manual" className="hover:text-blue-400 shrink-0 transition-colors">
              Manuals
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center space-x-1.5 shrink-0">
                <span className="text-slate-600">/</span>
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-[320px]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-blue-400 transition-colors truncate max-w-[150px]">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Quick Action Tools */}
          <div className="flex items-center space-x-2 shrink-0">
            {(wiringDiagrams.length > 0 || (vehicleInfo.make && vehicleInfo.year && vehicleInfo.model)) && (
              <button
                type="button"
                onClick={() => setWiringOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-blue-300 border border-slate-700/80 transition-colors shadow-xs"
                title="View Wiring Diagrams"
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Wiring Diagrams</span>
                <span className="sm:hidden">Wiring</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setTorqueOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700/80 transition-colors shadow-xs"
              title="Fast Torque Specs Table"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Torque Specs</span>
              <span className="sm:hidden">Torque</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/80 transition-colors shadow-xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print / Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Subsections / Chapter Index (if available) */}
          {(childSections.length > 0 || siblings.length > 0) && (
            <aside id="sidebar" className="sidebar lg:col-span-4 space-y-4">
              {/* Parent Chapter Return */}
              {parent && (
                <Link
                  href={parent.path}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#141926] border border-slate-800 hover:border-blue-500/50 hover:bg-[#181f30] text-xs font-semibold text-blue-400 transition-all group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="truncate">Up to: {parent.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Chapter</span>
                </Link>
              )}

              {/* Subsections List (Current Section's Children) */}
              {childSections.length > 0 && (
                <div className="rounded-2xl bg-[#131722] border border-slate-800/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <ListOrdered className="w-4 h-4 text-blue-400" />
                    Section Procedures ({childSections.length})
                  </div>
                  <nav className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                    {childSections.map((child) => (
                      <Link
                        key={child.id}
                        href={child.path}
                        className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors group"
                      >
                        <span className="truncate pr-2">{child.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 shrink-0" />
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Sibling Sections (In this chapter) */}
              {siblings.length > 0 && (
                <div className="rounded-2xl bg-[#131722] border border-slate-800/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <FolderOpen className="w-4 h-4 text-blue-400" />
                    In This Chapter ({siblings.length})
                  </div>
                  <nav className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                    {siblings.map((sib) => (
                      <Link
                        key={sib.id}
                        href={sib.path}
                        className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors group"
                      >
                        <span className="truncate pr-2">{sib.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 shrink-0" />
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Ad Unit: Sidebar Sticky (Desktop) */}
              <div id="sidebar-sticky" className="sticky top-20 pt-2 sidebar-sticky">
                {ENABLE_MANUAL_ADS && (
                  <AdUnit slot="manual-sidebar" format="rectangle" className="my-2" />
                )}
              </div>
            </aside>
          )}

          {/* Center/Main Column: Manual Content */}
          <main className={childSections.length > 0 || siblings.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <div className="rounded-2xl bg-[#131722] border border-slate-800/90 shadow-lg p-6 sm:p-10">
              {/* Header Info */}
              <div className="pb-6 mb-6 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-950/70 text-blue-300 border border-blue-800/60 font-mono">
                    {vehicle}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    FACTORY OEM SERVICE PROCEDURE
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {title}
                </h1>
              </div>

              {/* Ad Unit: Top Procedure Banner */}
              {ENABLE_MANUAL_ADS && (
                <AdUnit slot="manual-top" format="horizontal" className="my-4" />
              )}

              {/* Navigation Index (if page is a directory of links) */}
              {isNavigation && navLinks.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
                    Select a section or procedure below to view factory instructions:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-[#171c2a] hover:border-blue-500/50 hover:bg-[#1c2335] transition-all group"
                      >
                        <span className="text-slate-200 group-hover:text-white font-medium text-sm truncate pr-2">
                          {link.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                /* Actual Service Manual Procedure Content */
                <div className="manual-content prose prose-invert max-w-none text-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: contentHtml }} suppressHydrationWarning />
                </div>
              )}

              {/* Ad Unit: Bottom Procedure Banner */}
              {ENABLE_MANUAL_ADS && (
                <AdUnit slot="manual-bottom" format="horizontal" className="mt-8 mb-4" />
              )}

              {/* Page Flipper Navigation Dock (Book-style Next / Prev) */}
              {!isNavigation && (prevSibling || nextSibling || parent) && (
                <div className="mt-12 pt-8 border-t border-slate-800/90 space-y-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Chapter Navigation
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prevSibling ? (
                      <Link
                        href={prevSibling.path}
                        className="p-4 rounded-xl border border-slate-800 bg-[#171c2a] hover:border-slate-700 hover:bg-[#1a2133] transition-all flex flex-col text-left group"
                      >
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Previous Procedure
                        </span>
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {prevSibling.title}
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}

                    {nextSibling ? (
                      <Link
                        href={nextSibling.path}
                        className="p-4 rounded-xl border border-slate-800 bg-[#171c2a] hover:border-slate-700 hover:bg-[#1a2133] transition-all flex flex-col text-right sm:text-right group"
                      >
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-end gap-1 mb-1">
                          Next Procedure
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {nextSibling.title}
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>

                  {parent && (
                    <div className="text-center pt-2">
                      <Link
                        href={parent.path}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Return to Chapter: <strong>{parent.title}</strong></span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Tool Overlays */}
      <JarvisWiringOverlay
        isOpen={wiringOpen}
        onClose={() => setWiringOpen(false)}
        vehicleInfo={vehicleInfo}
      />
      <JarvisTorqueTable
        isOpen={torqueOpen}
        onClose={() => setTorqueOpen(false)}
        vehicle={vehicle}
        contentHtml={contentHtml}
      />
    </div>
  );
}
