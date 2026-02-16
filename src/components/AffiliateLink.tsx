'use client';

import { trackAffiliateClick } from '@/lib/analytics';

interface AffiliateLinkProps {
  href: string;
  partName: string;
  vehicle: string;
  isHighTicket?: boolean;
  pageType?: 'repair_guide' | 'parts_page' | 'diagnostic';
  className?: string;
  children: React.ReactNode;
}

export default function AffiliateLink({
  href,
  partName,
  vehicle,
  isHighTicket = false,
  pageType = 'repair_guide',
  className,
  children,
}: AffiliateLinkProps) {
  const handleClick = () => {
    trackAffiliateClick({
      provider: 'Amazon',
      partName,
      vehicle,
      isHighTicket,
      pageType,
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
