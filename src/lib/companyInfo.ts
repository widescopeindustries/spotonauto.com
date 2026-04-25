export const COMPANY_INFO = {
  legalName: 'Widescope Industries LLC',
  streetAddress: '316 Brandywine Ave',
  city: 'Streetman',
  state: 'TX',
  zip: '75859',
  phoneDisplay: '682.999.0953',
  phoneE164: '+16829990953',
  phoneTel: 'tel:+16829990953',
  supportEmail: 'info@widescopeindustries.com',
  businessHours: 'Monday–Friday 9 AM – 5 PM CDT',
  sbaVerificationUrl: 'https://veterans.certify.sba.gov/#search',
} as const;

export function formatBusinessAddress(): string {
  return `${COMPANY_INFO.legalName}, ${COMPANY_INFO.streetAddress}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}`;
}
