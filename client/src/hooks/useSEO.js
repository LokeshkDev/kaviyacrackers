// SEO Helper Module for Kaviya Crackers
// Helps manage dynamic page titles, meta tags, and structured data

const seoConfig = {
  siteName: 'Kaviya Crackers',
  domain: 'https://kaviyacrackers.co.in',
  logo: 'https://kaviyacrackers.co.in/assets/kaviya_crackers_logo-C6Ez43wZ.jpeg',
  defaultDescription: 'Buy crackers online, fireworks online & diwali crackers 2026 at Kaviya Crackers. Original Sivakasi crackers with all India delivery.',
  defaultTitle: 'Buy Fireworks Online & Crackers at Best Prices | Kaviya Crackers',
  
  pages: {
    home: {
      title: 'Buy Fireworks Online & Crackers at Best Prices | Kaviya Crackers',
      description: 'Buy crackers online, fireworks online & diwali crackers 2026 at Kaviya Crackers. Original Sivakasi crackers with all India delivery. Order diwali fireworks online today!',
      keywords: 'buy fireworks online, buy crackers online, buy diwali crackers online, diwali crackers 2026, sivakasi crackers, order fireworks online india'
    },
    shop: {
      title: 'Shop Premium Fireworks & Crackers Online | Kaviya Crackers',
      description: 'Browse our exclusive collection of premium fireworks and crackers. Buy diwali crackers 2026, festival fireworks, sivakasi crackers online with fast delivery.',
      keywords: 'buy crackers online, fireworks online shopping, diwali crackers online 2026, festival fireworks 2026, sivakasi crackers online'
    },
    about: {
      title: 'About Kaviya Crackers - Premium Fireworks from Sivakasi',
      description: 'Learn about Kaviya Crackers, your trusted source for original Sivakasi crackers and premium fireworks with all India delivery.',
      keywords: 'Kaviya Crackers, Sivakasi crackers, fireworks manufacturer, premium fireworks supplier'
    },
    contact: {
      title: 'Contact Kaviya Crackers | Buy Fireworks Online',
      description: 'Get in touch with Kaviya Crackers for orders, wholesale inquiries, and customer support. Buy fireworks online with fast delivery across India.',
      keywords: 'contact Kaviya Crackers, fireworks wholesale, order fireworks online'
    },
    terms: {
      title: 'Terms & Conditions | Kaviya Crackers',
      description: 'Read the terms and conditions for buying fireworks and crackers online at Kaviya Crackers.',
      keywords: 'terms and conditions, online shopping terms'
    },
    privacy: {
      title: 'Privacy Policy | Kaviya Crackers',
      description: 'Learn how Kaviya Crackers protects your personal information when you buy fireworks and crackers online.',
      keywords: 'privacy policy, data protection'
    },
    shipping: {
      title: 'Shipping & Delivery | Kaviya Crackers',
      description: 'Fast and reliable shipping for fireworks and crackers across India. Same day delivery available in selected areas.',
      keywords: 'fireworks delivery india, crackers shipping, fast delivery, all india delivery'
    },
    returns: {
      title: 'Returns & Refunds | Kaviya Crackers',
      description: 'Easy returns and refunds policy for all fireworks and crackers purchases at Kaviya Crackers.',
      keywords: 'returns policy, refunds, money back guarantee'
    },
    faq: {
      title: 'Frequently Asked Questions | Kaviya Crackers',
      description: 'Find answers to common questions about buying fireworks and crackers online at Kaviya Crackers.',
      keywords: 'faq, frequently asked questions, fireworks buying guide'
    }
  }
};

/**
 * Set page SEO metadata
 * @param {string} pageKey - Key from seoConfig.pages
 * @param {object} customData - Additional custom metadata
 */
export const setSEOMeta = (pageKey, customData = {}) => {
  const pageData = seoConfig.pages[pageKey] || seoConfig.pages.home;
  const data = { ...pageData, ...customData };
  
  // Update page title
  document.title = data.title;
  
  // Update or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', data.description);
  
  // Update or create meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', data.keywords);
  
  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', data.canonical || seoConfig.domain);
  
  // Update Open Graph tags
  updateMetaProperty('og:title', data.title);
  updateMetaProperty('og:description', data.description);
  updateMetaProperty('og:url', data.canonical || seoConfig.domain);
  updateMetaProperty('og:image', data.image || seoConfig.logo);
  
  // Update Twitter tags
  updateMetaProperty('twitter:title', data.title);
  updateMetaProperty('twitter:description', data.description);
  updateMetaProperty('twitter:image', data.image || seoConfig.logo);
  
  // Update breadcrumb schema
  if (data.breadcrumbs) {
    updateBreadcrumbSchema(data.breadcrumbs);
  }
};

/**
 * Helper function to update or create meta properties
 */
const updateMetaProperty = (property, content) => {
  let metaTag = document.querySelector(`meta[property="${property}"]`);
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('property', property);
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', content);
};

/**
 * Update breadcrumb schema for current page
 */
const updateBreadcrumbSchema = (breadcrumbs) => {
  let schemaScript = document.getElementById('breadcrumb-schema');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.setAttribute('id', 'breadcrumb-schema');
    schemaScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schemaScript);
  }
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url
    }))
  };
  
  schemaScript.textContent = JSON.stringify(schema);
};

/**
 * Add structured data (JSON-LD) to page
 */
export const addStructuredData = (type, data) => {
  const scriptTag = document.createElement('script');
  scriptTag.setAttribute('type', 'application/ld+json');
  scriptTag.textContent = JSON.stringify(data);
  document.head.appendChild(scriptTag);
};

/**
 * Scroll to top on page change (better for UX and crawlability)
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Get SEO configuration
 */
export const getSEOConfig = () => seoConfig;

export default seoConfig;
