import { AlertTriangle } from 'lucide-react';

interface SafetyWarningBoxProps {
  className?: string;
  bodyText?: string;
}

const DEFAULT_WARNING_TEXT =
  'DIY auto repair can cause serious injury, fire, or vehicle damage. These guides are for informational purposes only. Always follow OEM torque specs, wear PPE, and consult a certified mechanic if you are unsure. You are solely responsible for your safety.';

export default function SafetyWarningBox({ className = '', bodyText = DEFAULT_WARNING_TEXT }: SafetyWarningBoxProps) {
  return (
    <section
      className={`rounded-2xl border border-orange-400/50 bg-gradient-to-r from-red-950/50 via-orange-950/45 to-amber-950/45 p-5 ${className}`}
      role="alert"
      aria-labelledby="safety-warning-title"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
        <div>
          <h2 id="safety-warning-title" className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-200">
            Safety Warning
          </h2>
          <p className="mt-2 text-sm leading-6 text-orange-50/95">{bodyText}</p>
        </div>
      </div>
    </section>
  );
}
