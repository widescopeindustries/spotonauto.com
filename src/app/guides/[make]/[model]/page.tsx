import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES } from '@/data/vehicles';
import { getToolPagesForVehicle, TOOL_TYPE_META } from '@/data/tools-pages';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/MotionWrappers';
import { Wrench } from 'lucide-react';

interface PageProps {
  params: Promise<{
    make: string;
    model: string;
  }>;
}

function slugifyPart(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

export async function generateMetadata({ params }: PageProps) {
  const { make, model } = await params;
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    (m) => slugifyPart(m) === make.toLowerCase()
  );
  const originalModel = originalMake
    ? Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).find((m) => slugifyPart(m) === model.toLowerCase())
    : null;
  const canonicalMake = originalMake ? slugifyPart(originalMake) : make.toLowerCase();
  const canonicalModel = originalModel ? slugifyPart(originalModel) : model.toLowerCase();
  const displayMake = originalMake || make.charAt(0).toUpperCase() + make.slice(1).replace(/-/g, ' ');
  const displayModel = originalModel || model.charAt(0).toUpperCase() + model.slice(1).replace(/-/g, ' ');
  return {
    title: `${displayMake} ${displayModel} DIY Repair Guides | SpotOnAuto`,
    description: `Complete step-by-step DIY repair guides for the ${displayMake} ${displayModel}. Fix common issues yourself and save.`,
    alternates: {
      canonical: `https://spotonauto.com/guides/${canonicalMake}/${canonicalModel}`,
    },
    ...(NOINDEX_MAKES.has(make.toLowerCase()) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ModelGuidesPage({ params }: PageProps) {
  const { make, model } = await params;
  
  // Find matching make in our data
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    m => slugifyPart(m) === make.toLowerCase()
  );

  if (!originalMake) notFound();

  // Find matching model
  const originalModel = Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).find(
    m => slugifyPart(m) === model.toLowerCase()
  );

  if (!originalModel) notFound();

  const production = VEHICLE_PRODUCTION_YEARS[originalMake][originalModel];
  const toolPages = getToolPagesForVehicle(originalMake, originalModel);
  const featuredToolPages = toolPages.slice(0, 8);
  
  // We'll link to 2013 as a representative year or the latest year available in our sitemap range
  const targetYear = Math.min(2013, production.end);

  const faqItems = [
    {
      question: `Can I do my own repairs on a ${originalMake} ${originalModel}?`,
      answer: `Yes, many ${originalMake} ${originalModel} repairs are DIY-friendly. Common jobs like oil changes, brake pads, air filters, and battery replacement can be done at home with basic hand tools. You can save $100–$400 per repair compared to a shop.`,
    },
    {
      question: `What are the most common repairs for a ${originalMake} ${originalModel}?`,
      answer: `The most common ${originalMake} ${originalModel} repairs include oil changes, brake pad and rotor replacement, spark plug replacement, battery replacement, and cabin/engine air filter changes. These are standard maintenance items for any vehicle.`,
    },
    {
      question: `How much can I save doing DIY repairs on my ${originalMake} ${originalModel}?`,
      answer: `DIY repairs on a ${originalMake} ${originalModel} typically save $80–$200 per job in labor costs alone. Over a year of routine maintenance, most owners save $300–$800 compared to dealership or independent shop pricing.`,
    },
    {
      question: `What tools do I need to work on a ${originalMake} ${originalModel}?`,
      answer: `A basic metric socket set, combination wrenches, jack and jack stands, a torque wrench, and common consumables like brake cleaner cover most ${originalMake} ${originalModel} DIY jobs. Specialty tools are rarely needed for routine maintenance.`,
    },
    {
      question: `Where can I find parts for my ${originalMake} ${originalModel}?`,
      answer: `You can find ${originalMake} ${originalModel} parts on Amazon with fast Prime shipping, at local auto parts stores like AutoZone or O'Reilly, or from online specialists. OEM part numbers help ensure correct fitment for your specific year and trim.`,
    },
  ];

  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Guides", item: "https://spotonauto.com/guides" },
            { "@type": "ListItem", position: 2, name: originalMake, item: `https://spotonauto.com/guides/${make}` },
            { "@type": "ListItem", position: 3, name: `${originalMake} ${originalModel}`, item: `https://spotonauto.com/guides/${make}/${model}` },
          ],
        }) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <FadeInUp>
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/guides/${make}`} className="text-cyan-400 hover:underline">← Back to {originalMake}</Link>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            <span className="text-cyan-400">{originalMake} {originalModel}</span> Guides
          </h1>
          <p className="text-gray-400 mb-12 max-w-2xl">
            Comprehensive DIY maintenance and repair guides for the {originalMake} {originalModel} ({production.start} - {production.end}).
          </p>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALID_TASKS.map((task) => (
            <StaggerItem key={task}>
              <Link
                href={`/repair/${targetYear}/${make}/${model}/${task}`}
                className="flex items-center gap-4 glass p-6 hover:border-cyan-400/50 transition-all group"
              >
                <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                  <Wrench className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors capitalize">
                    {task.replace(/-/g, ' ')}
                  </h3>
                  <p className="text-sm text-gray-500">Step-by-step guide & parts list</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {featuredToolPages.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">
                {originalMake} {originalModel} Specs & Fitment
              </h2>
              <Link href="/tools" className="text-sm text-cyan-400 hover:underline">
                Browse all spec pages →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredToolPages.map((page) => {
                const meta = TOOL_TYPE_META[page.toolType] || { label: 'Guide', icon: '🔧' };
                return (
                  <Link
                    key={page.slug}
                    href={`/tools/${page.slug}`}
                    className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition group"
                  >
                    <p className="text-sm text-cyan-400 mb-1">{meta.icon} {meta.label}</p>
                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                      {originalMake} {originalModel}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Spec page →</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Frequently Asked Questions — GEO optimized for AI search citation */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <dt className="px-5 py-4 font-semibold text-white">
                  {faq.question}
                </dt>
                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
