interface WhenToSeeMechanicProps {
  className?: string;
  title?: string;
}

const DEFAULT_SIGNALS = [
  'You smell fuel, burning insulation, or see smoke.',
  'Brakes feel soft, pull hard to one side, or make grinding noises.',
  'The engine overheats, stalls repeatedly, or misfires under load.',
  'You are missing required tools, torque specs, or safe lifting equipment.',
  'You are not confident in the next step or safety outcome.',
];

export default function WhenToSeeMechanic({
  className = '',
  title = 'When to See a Mechanic',
}: WhenToSeeMechanicProps) {
  return (
    <section className={`rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] p-6 ${className}`}>
      <h2 className="text-xl font-semibold tracking-tight text-amber-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-amber-50/80">
        Stop DIY work and contact a certified mechanic immediately if any of the following apply:
      </p>
      <ul className="mt-4 space-y-2">
        {DEFAULT_SIGNALS.map((signal) => (
          <li key={signal} className="text-sm leading-6 text-amber-50/95">
            • {signal}
          </li>
        ))}
      </ul>
    </section>
  );
}
