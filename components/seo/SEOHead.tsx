
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title: string;
    description: string;
    keywords?: string;
    canonicalUrl?: string;
    schema?: any;
}

const SEOHead: React.FC<SEOHeadProps> = ({ title, description, keywords, canonicalUrl, schema }) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta name="twitter:card" content="summary_large_image" />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEOHead;
