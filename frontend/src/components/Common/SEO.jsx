import { Helmet } from 'react-helmet';

const SEO = ({ 
  title = 'DevFlow - Master Competitive Programming',
  description = 'Practice coding problems, compete in live contests, and track your progress. Built for college students who want to excel in competitive programming competitions.',
  keywords = 'competitive programming, coding contests, programming problems, algorithm practice, data structures, coding competitions, online judge, programming platform,devlow,khetesh deore',
  url = 'https://devflow26.vercel.app',
  image = 'https://devflow26.vercel.app/og-image.png',
  type = 'website'
}) => {
  const fullTitle = title.includes('DevFlow') ? title : `${title} | DevFlow`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Khetesh Deore" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="DevFlow" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="theme-color" content="#1f2937" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "DevFlow",
          "description": description,
          "url": url,
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "creator": {
            "@type": "Person",
            "name": "Khetesh Deore "
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;