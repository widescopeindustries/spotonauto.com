import React from 'react';

interface SEOHeadProps {
    title: string;
    description: string;
    keywords?: string;
    canonicalUrl?: string;
    schema?: any;
}

const SEOHead: React.FC<SEOHeadProps> = ({ title, description, keywords, canonicalUrl, schema }) => {
    // In Next.js, we use generateMetadata or the Metadata object.
    // For now, we'll return null to avoid breaking client components,
    // and rely on the page-level metadata we already set up.
    return null;
};

export default SEOHead;