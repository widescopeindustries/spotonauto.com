import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface AuthorProfile {
  slug: string;
  name: string;
  credentials: string;
  bio: string;
  years: string;
  specialization: string;
}

const AUTHORS: AuthorProfile[] = [
  {
    slug: 'spotonauto-editorial-team',
    name: 'SpotOnAuto Editorial Team',
    credentials: 'ASE-aligned technical review process',
    years: '15+ years combined field experience',
    specialization: 'OBD2 diagnostics and maintenance planning',
    bio: 'The SpotOnAuto editorial team combines AI-assisted drafting with human technical review for safety-critical automotive guidance. Every published guide is checked for fitment context, tool requirements, and practical risk points before updates go live.',
  },
  {
    slug: 'lyndon-bedford',
    name: 'Lyndon Bedford',
    credentials: 'Founder, veteran-owned operator',
    years: 'Military + hands-on automotive operations background',
    specialization: 'DIY workflow clarity and repair risk communication',
    bio: 'Lyndon founded SpotOnAuto to make trustworthy repair information easier to use for everyday drivers. He focuses on practical, safe, and monetizable information architecture that helps users decide between DIY and professional service.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const author = AUTHORS.find((entry) => entry.slug === name);
  if (!author) return { title: 'Author Not Found | SpotOnAuto' };

  return {
    title: `${author.name} | Author Profile | SpotOnAuto`,
    description: `${author.name} — ${author.credentials}. ${author.years}. ${author.specialization}.`,
    alternates: {
      canonical: `https://spotonauto.com/author/${author.slug}`,
    },
  };
}

export function generateStaticParams() {
  return AUTHORS.map((author) => ({ name: author.slug }));
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const author = AUTHORS.find((entry) => entry.slug === name);
  if (!author) notFound();

  return (
    <main className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">{author.name}</h1>
        <p className="mt-2 text-cyan-200">{author.credentials}</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-gray-300">{author.bio}</p>
          <p className="mt-3 text-sm text-gray-300"><strong>Experience:</strong> {author.years}</p>
          <p className="mt-1 text-sm text-gray-300"><strong>Specialization:</strong> {author.specialization}</p>
          <p className="mt-3 text-xs text-gray-500">Verified by SpotOnAuto editorial team</p>
        </div>
        <Link href="/about" className="mt-6 inline-block text-sm text-cyan-300 hover:text-cyan-200">
          Back to About →
        </Link>
      </div>
    </main>
  );
}
