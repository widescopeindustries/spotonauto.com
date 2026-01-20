import { Metadata } from 'next';
import GuideContent from './GuideContent';

interface PageProps {
    params: Promise<{
        year: string;
        make: string;
        model: string;
        task: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { year, make, model, task } = await params;
    const cleanTask = task.replace(/-/g, ' ');
    const title = `How to fix ${cleanTask} on ${year} ${make} ${model} | SpotOn Auto`;
    const description = `Step-by-step DIY repair guide for ${cleanTask} on a ${year} ${make} ${model}. Includes diagrams, parts list, and tool requirements.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://spotonauto.com/repair/${year}/${make}/${model}/${task}`,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const resolvedParams = await params;
    return <GuideContent params={resolvedParams} />;
}