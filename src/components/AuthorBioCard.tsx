interface AuthorBioCardProps {
  updatedDate: string;
}

export default function AuthorBioCard({ updatedDate }: AuthorBioCardProps) {
  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-bold text-white">Author & Review</h3>
      <p className="mt-2 text-sm text-gray-300">
        Published by AllOEMManuals, founded by Lyndon Bedford, an automotive technician with 20 years of experience.
        He owned and operated a mechanic shop in Hurst, Texas from 2014 to 2022 and continues hands-on repair work.
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Content may combine manual references, general repair templates, and AI-assisted drafting. Confirm the source,
        vehicle configuration, and applicability before working. Report corrections through our contact page.
      </p>
      <p className="mt-1 text-xs text-gray-500">Last updated: {updatedDate}</p>
    </section>
  );
}
