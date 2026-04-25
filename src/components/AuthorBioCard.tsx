interface AuthorBioCardProps {
  updatedDate: string;
}

export default function AuthorBioCard({ updatedDate }: AuthorBioCardProps) {
  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-bold text-white">Author & Review</h3>
      <p className="mt-2 text-sm text-gray-300">
        Written by SpotOnAuto Editorial Team. Reviewed by ASE-certified technicians and updated with
        factory-reference checks for fitment-sensitive steps.
      </p>
      <p className="mt-2 text-xs text-gray-400">
        This guide was drafted with AI assistance and reviewed for accuracy by a human editor.
      </p>
      <p className="mt-1 text-xs text-gray-500">Last updated: {updatedDate}</p>
    </section>
  );
}
