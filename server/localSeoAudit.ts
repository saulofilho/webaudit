import { safeFetch } from './security/safeFetch';
import { URL } from 'url';
import {
  LocalSeoAuditData,
  NapEntity,
  CitationProfile,
  GoogleBusinessProfileAudit,
} from '../src/types';

const EMPTY_PHONE = { raw: '', formatted: '', telHref: undefined as string | undefined };

function cleanDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  }
}

function titleCaseDomain(domain: string): string {
  const base = domain.split('.')[0];
  return base
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Format phone number into clean display and standard E.164-like representation
function formatPhoneNumber(rawPhone: string): { raw: string; formatted: string; telHref: string } {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return {
      raw: rawPhone,
      formatted,
      telHref: `tel:+1${digits}`,
    };
  } else if (digits.length === 11 && digits.startsWith('1')) {
    const core = digits.slice(1);
    const formatted = `+1 (${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
    return {
      raw: rawPhone,
      formatted,
      telHref: `tel:+${digits}`,
    };
  }
  return {
    raw: rawPhone,
    formatted: rawPhone.trim(),
    telHref: `tel:${rawPhone.replace(/\s+/g, '')}`,
  };
}

async function fetchPageHtml(targetUrl: string, timeoutMs = 4500): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const normalized = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const res = await safeFetch(normalized, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function auditLocalSeo(targetUrl: string, existingReport?: any): Promise<LocalSeoAuditData> {
  const domain = cleanDomain(targetUrl);
  const fallbackBrand = titleCaseDomain(domain);

  const html = await fetchPageHtml(targetUrl);
  if (!html) {
    throw new Error(`Could not load ${targetUrl} to check local SEO signals.`);
  }

  // 1. Extract Schema.org LocalBusiness / PostalAddress
  let schemaNap: NapEntity | undefined;
  let schemaTypeDetected: string | undefined;
  let hasLocalSchema = false;
  let openingHoursText: string | undefined;
  let geoCoordinates: { lat: number; lng: number } | null = null;

  if (html) {
    const jsonLdMatches = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          const type = item['@type'];
          if (
            type &&
            (type === 'LocalBusiness' ||
              type === 'Store' ||
              type === 'Restaurant' ||
              type === 'Organization' ||
              type === 'ProfessionalService' ||
              type === 'Dentist' ||
              type === 'LegalService' ||
              type === 'AutomotiveBusiness' ||
              type === 'RealEstateAgent' ||
              type === 'MedicalBusiness')
          ) {
            hasLocalSchema = true;
            schemaTypeDetected = type;

            const name = item.name || fallbackBrand;
            const phone = item.telephone || '';
            const addressObj = item.address || {};
            const street = addressObj.streetAddress || '';
            const city = addressObj.addressLocality || '';
            const state = addressObj.addressRegion || '';
            const postalCode = addressObj.postalCode || '';
            const country = addressObj.addressCountry || '';
            const rawAddress = [street, city, state, postalCode].filter(Boolean).join(', ');

            if (item.geo) {
              const lat = parseFloat(item.geo.latitude);
              const lng = parseFloat(item.geo.longitude);
              if (!isNaN(lat) && !isNaN(lng)) {
                geoCoordinates = { lat, lng };
              }
            }

            if (item.openingHours || item.openingHoursSpecification) {
              openingHoursText = Array.isArray(item.openingHours)
                ? item.openingHours.join(', ')
                : typeof item.openingHours === 'string'
                ? item.openingHours
                : undefined;
            }

            if (item.name || street || phone) {
              schemaNap = {
                name,
                address: {
                  street,
                  city,
                  state,
                  postalCode,
                  country: typeof country === 'string' ? country : country?.name || '',
                  raw: rawAddress,
                },
                phone: phone ? formatPhoneNumber(phone) : EMPTY_PHONE,
                source: 'schema_markup',
                confidence: street && phone ? 96 : 78,
              };
              break;
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  // Check if existing audit report has structured data types
  if (!hasLocalSchema && existingReport?.rawData?.metaTags?.structuredDataTypes) {
    const types: string[] = existingReport.rawData.metaTags.structuredDataTypes;
    if (types.some((t: string) => /LocalBusiness|Organization|Store|Restaurant/i.test(t))) {
      hasLocalSchema = true;
      schemaTypeDetected = types.find((t: string) => /LocalBusiness|Organization|Store/i.test(t)) || 'LocalBusiness';
    }
  }

  // 2. Extract On-Page / Footer NAP
  let onPagePhone: string | null = null;
  let onPageTelHref: string | null = null;
  let hasGoogleMapsEmbed = false;
  let hasGeoMetaTags = false;
  let hasOpeningHoursOnPage = false;
  const detectedCity = schemaNap?.address.city || '';
  const detectedState = schemaNap?.address.state || '';

  if (html) {
    // Tel href
    const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
    if (telMatch) {
      onPageTelHref = telMatch[1];
      onPagePhone = telMatch[1].replace(/^\+1/, '');
    }

    // Phone regex in text
    if (!onPagePhone) {
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/;
      const textMatch = html.match(phoneRegex);
      if (textMatch) {
        onPagePhone = textMatch[0];
      }
    }

    // Google Maps Embed check
    if (
      html.includes('google.com/maps/embed') ||
      html.includes('maps.google.com') ||
      html.includes('maps/place') ||
      html.includes('google.com/maps')
    ) {
      hasGoogleMapsEmbed = true;
    }

    // Geo Meta Tags check
    if (
      html.includes('name="geo.position"') ||
      html.includes('name="geo.placename"') ||
      html.includes('name="ICBM"')
    ) {
      hasGeoMetaTags = true;
    }

    // Opening Hours text in page
    if (/hours|opening hours|business hours|mon-fri|monday - friday/i.test(html)) {
      hasOpeningHoursOnPage = true;
    }
  }

  // On-page NAP: only what was actually found in the HTML. Nothing is invented.
  const resolvedPhone = onPagePhone ? formatPhoneNumber(onPagePhone) : schemaNap?.phone || EMPTY_PHONE;
  const hasOnPageContact = Boolean(onPagePhone);

  const onPageNap: NapEntity = {
    name: schemaNap?.name || '',
    address: schemaNap
      ? { ...schemaNap.address }
      : { street: '', city: '', state: '', postalCode: '', country: '', raw: '' },
    phone: resolvedPhone,
    source: onPageTelHref ? 'footer' : hasOnPageContact ? 'contact_page' : 'not_detected',
    confidence: onPageTelHref ? 92 : hasOnPageContact ? 60 : 0,
  };

  // Footer NAP is the same on-page extraction; kept for API compatibility.
  const footerNap: NapEntity = { ...onPageNap, address: { ...onPageNap.address } };

  // Check consistency issues (only between sources we actually read)
  const consistencyIssues: string[] = [];
  if (!hasLocalSchema) {
    consistencyIssues.push('Missing Schema.org LocalBusiness JSON-LD markup on target landing page.');
  }
  if (!hasGoogleMapsEmbed) {
    consistencyIssues.push('No Google Maps embed or Place link found on the page.');
  }
  if (!onPageTelHref) {
    consistencyIssues.push('No click-to-call phone link (href="tel:...") found on the page.');
  }
  if (schemaNap?.phone.raw && onPagePhone) {
    const a = schemaNap.phone.raw.replace(/\D/g, '').slice(-10);
    const b = onPagePhone.replace(/\D/g, '').slice(-10);
    if (a && b && a !== b) {
      consistencyIssues.push(`Phone in Schema ("${schemaNap.phone.formatted}") differs from the phone on the page ("${formatPhoneNumber(onPagePhone).formatted}").`);
    }
  }

  // Directory citations cannot be verified without each directory's API; provide
  // search/claim links for a manual check instead of fabricated listing data.
  const canonicalName = schemaNap?.name || fallbackBrand;
  const canonicalCity = onPageNap.address.city;
  const searchTerm = [canonicalName, canonicalCity].filter(Boolean).join(' ');
  const notChecked = (platform: CitationProfile['platform'], id: string, directoryUrl: string, claimUrl: string): CitationProfile => ({
    id,
    platform,
    directoryUrl,
    claimUrl,
    status: 'not_checked',
    name: '',
    address: '',
    phone: '',
    hasMismatch: false,
    mismatchFields: [],
    notes: 'Not verified automatically — open the directory link and compare the listing with your NAP.',
  });
  const citations: CitationProfile[] = [
    notChecked('Google Business Profile', 'cit-gbp', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm)}`, 'https://business.google.com/create'),
    notChecked('Apple Maps', 'cit-apple', `https://maps.apple.com/?q=${encodeURIComponent(searchTerm)}`, 'https://businessconnect.apple.com/'),
    notChecked('Bing Places', 'cit-bing', `https://www.bing.com/maps?q=${encodeURIComponent(searchTerm)}`, 'https://www.bingplaces.com/'),
    notChecked('Yelp', 'cit-yelp', `https://www.yelp.com/search?find_desc=${encodeURIComponent(canonicalName)}${canonicalCity ? `&find_loc=${encodeURIComponent(canonicalCity)}` : ''}`, 'https://biz.yelp.com/'),
    notChecked('Facebook Places', 'cit-fb', `https://www.facebook.com/search/pages/?q=${encodeURIComponent(canonicalName)}`, 'https://www.facebook.com/pages/create'),
    notChecked('YellowPages', 'cit-yellowpages', `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(canonicalName)}${canonicalCity ? `&geo_location_terms=${encodeURIComponent(canonicalCity)}` : ''}`, 'https://adsolutions.yp.com/free-listing'),
  ];

  const gbpRecommendations: GoogleBusinessProfileAudit['recommendations'] = [];
  if (!hasLocalSchema) {
    gbpRecommendations.push({
      id: 'gbp-rec-schema',
      title: 'Implement LocalBusiness JSON-LD Schema',
      impact: 'critical',
      description: 'Add Schema.org LocalBusiness with address, telephone, opening hours and geo coordinates to the page.',
      actionLabel: 'Generate Schema Markup',
    });
  }
  if (!hasGoogleMapsEmbed) {
    gbpRecommendations.push({
      id: 'gbp-rec-maps',
      title: 'Link or Embed Your Google Maps Place',
      impact: 'high',
      description: 'A Google Maps embed or Place link on the contact page connects the domain with your Google Business Profile.',
      actionLabel: 'Copy Embed Code',
    });
  }
  if (!onPageTelHref) {
    gbpRecommendations.push({
      id: 'gbp-rec-tel',
      title: 'Add a Click-to-Call Phone Link',
      impact: 'medium',
      description: 'Wrap the phone number in <a href="tel:..."> so mobile visitors can call directly.',
      actionLabel: 'View Example',
    });
  }
  gbpRecommendations.push({
    id: 'gbp-rec-verify',
    title: 'Verify Your Google Business Profile Manually',
    impact: 'medium',
    description: 'Rating, reviews and claim status are not checked by this tool. Confirm them in Google Business Profile.',
    actionLabel: 'Open Google Business Profile',
  });

  // Scores from on-page signals only
  let napScore = 100;
  if (!hasLocalSchema) napScore -= 30;
  if (!schemaNap?.address.street) napScore -= 15;
  if (!onPageTelHref) napScore -= 15;
  if (!onPagePhone && !schemaNap?.phone.raw) napScore -= 15;
  if (consistencyIssues.some((i) => i.startsWith('Phone in Schema'))) napScore -= 10;
  napScore = Math.max(0, Math.min(100, napScore));

  let gbpScore = 100;
  if (!hasGoogleMapsEmbed) gbpScore -= 30;
  if (!hasLocalSchema) gbpScore -= 25;
  if (!geoCoordinates && !hasGeoMetaTags) gbpScore -= 15;
  if (!openingHoursText && !hasOpeningHoursOnPage) gbpScore -= 15;
  gbpScore = Math.max(0, Math.min(100, gbpScore));

  const overallScore = Math.round(napScore * 0.55 + gbpScore * 0.45);

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 88) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 45) grade = 'D';
  else grade = 'F';

  // Local keywords actually present in the visible text
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();
  const countOccurrences = (term: string) =>
    term ? visibleText.split(term.toLowerCase()).length - 1 : 0;
  const keywordCandidates: LocalSeoAuditData['localKeywordsDetected'] = [];
  if (detectedCity) keywordCandidates.push({ keyword: detectedCity.toLowerCase(), type: 'geo_city', occurrences: countOccurrences(detectedCity) });
  if (detectedState) keywordCandidates.push({ keyword: detectedState.toLowerCase(), type: 'geo_city', occurrences: countOccurrences(detectedState) });
  for (const intent of ['near me', 'open now', 'directions']) {
    keywordCandidates.push({ keyword: intent, type: 'intent', occurrences: countOccurrences(intent) });
  }
  const localKeywords = keywordCandidates.filter((k) => k.occurrences > 0);

  const gbpAudit: GoogleBusinessProfileAudit = {
    status: 'not_checked',
    profileFound: false,
    businessName: canonicalName,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm)}`,
    primaryCategory: schemaTypeDetected || '',
    additionalCategories: [],
    isClaimedAndVerified: false,
    rating: null,
    reviewsCount: null,
    reviewResponseRatePercent: null,
    hasOpeningHours: Boolean(openingHoursText || hasOpeningHoursOnPage),
    openingHoursFormatted: openingHoursText,
    hasWebsiteBacklink: false,
    hasGeoCoordinates: Boolean(geoCoordinates),
    latitude: geoCoordinates?.lat,
    longitude: geoCoordinates?.lng,
    hasLocalPhone: Boolean(onPagePhone || schemaNap?.phone.raw),
    hasServiceAreaConfigured: false,
    hasRecentPosts: false,
    descriptionStatus: 'missing',
    descriptionLength: 0,
    optimizationScore: gbpScore,
    recommendations: gbpRecommendations,
  };

  return {
    targetUrl,
    analyzedAt: new Date().toISOString(),
    overallLocalScore: overallScore,
    napConsistencyScore: napScore,
    gbpOptimizationScore: gbpScore,
    localPackReadinessGrade: grade,
    detectedNap: {
      schema: schemaNap,
      onPage: onPageNap,
      footer: footerNap,
      isConsistent: consistencyIssues.length === 0,
      consistencyIssues,
      canonicalNap: schemaNap || onPageNap,
    },
    citations,
    googleBusinessProfile: gbpAudit,
    localRankingSignals: {
      hasLocalSchema,
      schemaType: schemaTypeDetected,
      hasGoogleMapsEmbed,
      hasClickToCallPhone: Boolean(onPageTelHref),
      hasCityInTitleOrH1: Boolean(detectedCity && countOccurrences(detectedCity) > 0),
      hasGeoMetaTags,
      hasKmlOrGeoSitemap: false,
      hasOpeningHoursOnPage: hasOpeningHoursOnPage || Boolean(openingHoursText),
    },
    localKeywordsDetected: localKeywords,
  };
}
