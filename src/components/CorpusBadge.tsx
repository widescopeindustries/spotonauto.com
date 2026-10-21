interface CorpusBadgeProps {
    hasManualReferences: boolean;
    vehicleName: string;
}

export default function CorpusBadge({ hasManualReferences, vehicleName }: CorpusBadgeProps) {
    return (
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            <span className="font-semibold">{hasManualReferences ? 'Manual references available' : 'General repair guidance'}</span>
            {' - '}{hasManualReferences
                ? `Review the linked manual sections and confirm they match the engine and configuration of your ${vehicleName}.`
                : `An exact factory procedure is not established by this page. Confirm applicability, service steps, and specifications in the manual for your ${vehicleName} before working.`}
        </div>
    );
}
