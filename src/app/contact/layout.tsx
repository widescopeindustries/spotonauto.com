import { Metadata } from 'next';
import { COMPANY_INFO } from '@/lib/companyInfo';

export const metadata: Metadata = {
  title: 'Contact AllOEMManuals | Support & Questions',
  description:
    `Reach AllOEMManuals support at ${COMPANY_INFO.phoneDisplay}. ${COMPANY_INFO.legalName}, ${COMPANY_INFO.streetAddress}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}.`,
  alternates: {
    canonical: 'https://alloemmanuals.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
