import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
  schema?: object | object[];
  noIndex?: boolean;
}

const SEO = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = 'https://traderedgepro.com/og-image.png',
  ogType = 'website',
  article,
  schema,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title.includes('TraderEdge') ? title : `${title} | TraderEdge Pro`;
  const siteUrl = 'https://traderedgepro.com';
  const canonical = canonicalUrl || siteUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="TraderEdge Pro" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@TraderEdgePro" />
      
      {/* Article-specific meta tags */}
      {ogType === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
        </>
      )}
      
      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(schema)
              ? schema.map((s) => ({ '@context': 'https://schema.org', ...s }))
              : { '@context': 'https://schema.org', ...schema }
          )}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
