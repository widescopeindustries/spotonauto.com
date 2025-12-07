
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title: string;
    description: string;
    canonicalUrl?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ title, description, canonicalUrl }) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta name="twitter:card" content="summary_large_image" />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        </Helmet>
    );
};

export default SEOHead;
