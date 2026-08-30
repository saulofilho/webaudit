import { TechStackItem } from '../src/types';

export function detectTechnologies(headers: Record<string, string>, html: string): TechStackItem[] {
  const stack: TechStackItem[] = [];
  const lowerHtml = html.toLowerCase();
  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = String(v).toLowerCase();
  }

  // Web Server / CDN
  const server = lowerHeaders['server'] || '';
  if (server.includes('cloudflare') || lowerHeaders['cf-ray']) {
    stack.push({ category: 'CDN / Proxy', name: 'Cloudflare', confidence: 99 });
  }
  if (server.includes('nginx')) {
    stack.push({ category: 'Web Server', name: 'Nginx', confidence: 95 });
  }
  if (server.includes('apache')) {
    stack.push({ category: 'Web Server', name: 'Apache', confidence: 95 });
  }
  if (server.includes('caddy')) {
    stack.push({ category: 'Web Server', name: 'Caddy', confidence: 95 });
  }
  if (server.includes('vercel') || lowerHeaders['x-vercel-id']) {
    stack.push({ category: 'PaaS / Hosting', name: 'Vercel', confidence: 99 });
  }
  if (lowerHeaders['x-powered-by']?.includes('express') || server.includes('express')) {
    stack.push({ category: 'Backend Framework', name: 'Express.js', confidence: 90 });
  }

  // CMS & Frameworks
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes') || lowerHtml.includes('wordpress')) {
    stack.push({ category: 'CMS', name: 'WordPress', confidence: 98 });
  }
  if (lowerHtml.includes('__next') || lowerHtml.includes('/_next/') || lowerHtml.includes('next.js')) {
    stack.push({ category: 'Frontend Framework', name: 'Next.js', confidence: 98 });
  } else if (lowerHtml.includes('react') || lowerHtml.includes('data-reactroot') || lowerHtml.includes('react-dom')) {
    stack.push({ category: 'JavaScript Library', name: 'React', confidence: 85 });
  }
  if (lowerHtml.includes('vue') || lowerHtml.includes('data-v-') || lowerHtml.includes('/_nuxt/')) {
    stack.push({ category: 'Frontend Framework', name: lowerHtml.includes('/_nuxt/') ? 'Nuxt.js' : 'Vue.js', confidence: 90 });
  }
  if (lowerHtml.includes('cdn.shopify.com') || lowerHtml.includes('shopify')) {
    stack.push({ category: 'E-commerce', name: 'Shopify', confidence: 98 });
  }
  if (lowerHtml.includes('tailwind') || lowerHtml.includes('tailwindcss')) {
    stack.push({ category: 'CSS Framework', name: 'Tailwind CSS', confidence: 85 });
  }
  if (lowerHtml.includes('bootstrap') || lowerHtml.includes('cdn.jsdelivr.net/npm/bootstrap')) {
    stack.push({ category: 'CSS Framework', name: 'Bootstrap', confidence: 90 });
  }

  // Analytics & Tracking
  if (lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtm.js')) {
    stack.push({ category: 'Tag Management', name: 'Google Tag Manager', confidence: 95 });
  }
  if (lowerHtml.includes('google-analytics.com') || lowerHtml.includes('gtag(') || lowerHtml.includes('ga(')) {
    stack.push({ category: 'Analytics', name: 'Google Analytics', confidence: 95 });
  }
  if (lowerHtml.includes('connect.facebook.net') || lowerHtml.includes('fbq(')) {
    stack.push({ category: 'Marketing', name: 'Meta / Facebook Pixel', confidence: 90 });
  }
  if (lowerHtml.includes('hotjar') || lowerHtml.includes('static.hotjar.com')) {
    stack.push({ category: 'UX Analytics', name: 'Hotjar', confidence: 95 });
  }

  // Fonts & Utilities
  if (lowerHtml.includes('fonts.googleapis.com') || lowerHtml.includes('fonts.gstatic.com')) {
    stack.push({ category: 'Fonts', name: 'Google Fonts', confidence: 98 });
  }
  if (lowerHtml.includes('fontawesome') || lowerHtml.includes('font-awesome') || lowerHtml.includes('fa-')) {
    stack.push({ category: 'Icons', name: 'Font Awesome', confidence: 85 });
  }

  return stack;
}
