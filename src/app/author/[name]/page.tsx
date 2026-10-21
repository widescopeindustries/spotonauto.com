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
    slug: 'alloemmanuals-editorial-team',
    name: 'AllOEMManuals Editorial Team',
    credentials: 'AllOEMManuals publishing and corrections',
    years: 'Led by founder Lyndon Bedford, an automotive technician with 20 years of experience',
    specialization: 'OBD2 diagnostics and maintenance planning',
    bio: 'This profile represents the publishing and corrections function of AllOEMManuals. Our content can combine manual references, general repair templates, and AI-assisted drafting. Contact us to report an error or request clarification of a source. This profile does not certify that every guide has received an individual technical review.',
  },
  {
    slug: 'lyndon-bedford',
    name: 'Lyndon Bedford',
    credentials: 'Automotive technician, former shop owner, and founder',
    years: '20 years as an automotive technician; shop owner and operator, 2014 to 2022',
    specialization: 'DIY workflow clarity and repair risk communication',
    bio: 'Lyndon Bedford has worked as an automotive technician for 20 years. He owned and operated an automotive mechanic shop in Hurst, Texas from 2014 to 2022 and continues hands-on repair work today. He founded AllOEMManuals to make repair information easier to navigate and help drivers assess when a repair calls for professional service.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const author = AUTHORS.find((entry) => entry.slug === name);
  if (!author) return { title: 'Author Not Found | AllOEMManuals' };

  return {
    title: `${author.name} | Author Profile | AllOEMManuals`,
    description: `${author.name} — ${author.credentials}. ${author.years}. ${author.specialization}.`,
    alternates: {
      canonical: `https://alloemmanuals.com/author/${author.slug}`,
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
          <p className="mt-3 text-xs text-gray-500">Verified by AllOEMManuals editorial team</p>
        </div>
        <Link href="/about" className="mt-6 inline-block text-sm text-cyan-300 hover:text-cyan-200">
          Back to About →
        </Link>
      </div>
    </main>
  );
}
