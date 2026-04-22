import { Helmet } from 'react-helmet';

const StructuredData = ({ type = 'website', data = {} }) => {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DevFlow",
    "description": "Practice coding problems, compete in live contests, and track your progress. Built for college students who want to excel in competitive programming competitions.",
    "url": "https://devflow26.vercel.app",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "DevFlow Team"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Students, Programmers, Competitive Programmers"
    },
    "educationalUse": "Skill Development",
    "interactivityType": "Active",
    "learningResourceType": "Interactive Resource"
  };

  let structuredData = baseStructuredData;

  // Customize structured data based on page type
  switch (type) {
    case 'problems':
      structuredData = {
        ...baseStructuredData,
        "@type": "Course",
        "name": "Programming Problems Collection",
        "description": "Comprehensive collection of programming problems and coding challenges for competitive programming practice.",
        "provider": {
          "@type": "Organization",
          "name": "DevFlow"
        },
        "educationalLevel": "Beginner to Advanced"
      };
      break;
    
    case 'contests':
      structuredData = {
        ...baseStructuredData,
        "@type": "Event",
        "name": "Programming Contests",
        "description": "Live programming contests and coding competitions with real-time leaderboards.",
        "eventStatus": "EventScheduled",
        "eventAttendanceMode": "OnlineEventAttendanceMode",
        "organizer": {
          "@type": "Organization",
          "name": "DevFlow"
        }
      };
      break;
    
    case 'leaderboard':
      structuredData = {
        ...baseStructuredData,
        "@type": "WebPage",
        "name": "Programming Leaderboard",
        "description": "Global leaderboard showing top competitive programmers and their rankings.",
        "mainEntity": {
          "@type": "ItemList",
          "name": "Top Programmers",
          "description": "Ranking of competitive programmers based on contest performance"
        }
      };
      break;
  }

  // Merge with any additional data passed
  structuredData = { ...structuredData, ...data };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;