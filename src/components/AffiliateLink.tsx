interface AffiliateLinkProps {
  href: string;
  partName: string;
  vehicle: string;
  isHighTicket?: boolean;
  pageType?: 'repair_guide' | 'parts_page' | 'diagnostic';
  className?: string;
  children: React.ReactNode;
  subtag?: string;
  provider?: string;
}

export default function AffiliateLink({
  href,
  partName,
  vehicle,
  isHighTicket = false,
  pageType = 'repair_guide',
  className,
  children,
  subtag,
  provider = 'Amazon',
}: AffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={className}
      data-track-click={JSON.stringify({
        event_category: 'affiliate_click',
        provider,
        partName,
        vehicle,
        isHighTicket,
        pageType,
        subtag,
      })}
    >
      {children}
    </a>
  );
}
