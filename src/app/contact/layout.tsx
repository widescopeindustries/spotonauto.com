import { Metadata } from 'next';
import { COMPANY_INFO } from '@/lib/companyInfo';

export const metadata: Metadata = {
  title: 'Contact SpotOnAuto | Support & Questions',
  description:
    `Reach SpotOnAuto support at ${COMPANY_INFO.phoneDisplay}. ${COMPANY_INFO.legalName}, ${COMPANY_INFO.streetAddress}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}.`,
  alternates: {
    canonical: 'https://spotonauto.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
