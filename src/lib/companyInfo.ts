export const COMPANY_INFO = {
  legalName: 'Widescope Industries LLC',
  streetAddress: '316 Brandywine Ave',
  city: 'Streetman',
  state: 'TX',
  zip: '75859',
  phoneDisplay: '469-986-7883',
  phoneE164: '+14699867883',
  phoneTel: 'tel:+14699867883',
  supportEmail: 'info@widescopeindustries.com',
  businessHours: 'Monday–Friday 9 AM – 5 PM CDT',
  sbaVerificationUrl: 'https://search.certifications.sba.gov/profile/ZFMKUREKJF88/9Q5T8?page=1#performance-history',
  // TODO: Paste your GBP review link here from Google Business Profile dashboard
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=PLACEHOLDER',
} as const;

export function formatBusinessAddress(): string {
  return `${COMPANY_INFO.legalName}, ${COMPANY_INFO.streetAddress}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}`;
}
